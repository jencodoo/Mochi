// Import model Conversation (dùng cho group chat)
import Conversation from "../models/Conversation.js";

// Import model Friend (lưu quan hệ bạn bè)
import Friend from "../models/Friend.js";

/**
 * Hàm pair
 * Chuẩn hóa thứ tự 2 userId
 * Tránh trùng dữ liệu khi lưu / query Friend
 * Ví dụ:
 * pair("9", "5") => ["5", "9"]
 */
const pair = (a, b) => (a < b ? [a, b] : [b, a]);

/**
 * Middleware: checkFriendship
 * Mục đích:
 * - Chỉ cho phép:
 *   + Chat 1-1 với bạn bè
 *   + Tạo group / thêm thành viên là bạn bè
 */
export const checkFriendship = async (req, res, next) => {
  try {
    // ID user hiện tại (đã login, lấy từ middleware auth)
    const me = req.user._id.toString();

    // Dùng cho chat 1-1
    const recipientId = req.body?.recipientId ?? null;

    // Dùng cho group chat (tạo group / thêm thành viên)
    const memberIds = req.body?.memberIds ?? [];

    /**
     * Validate input:
     * - Bắt buộc phải có recipientId (chat 1-1)
     *   HOẶC memberIds (group chat)
     */
    if (!recipientId && memberIds.length === 0) {
      return res.status(400).json({
        message: "Cần cung cấp recipientId hoặc memberIds",
      });
    }

    /**
     * ==============================
     * CASE 1: CHAT 1-1
     * ==============================
     */
    if (recipientId) {
      // Chuẩn hóa thứ tự userId
      const [userA, userB] = pair(me, recipientId);

      // Kiểm tra quan hệ bạn bè trong DB
      const isFriend = await Friend.findOne({ userA, userB });

      // Nếu không phải bạn bè → cấm chat
      if (!isFriend) {
        return res.status(403).json({
          message: "Bạn chưa kết bạn với người này",
        });
      }

      // Là bạn → cho phép đi tiếp
      return next();
    }

    /**
     * ==============================
     * CASE 2: GROUP CHAT
     * ==============================
     * - Kiểm tra TẤT CẢ memberIds
     * - Mỗi người đều phải là bạn của "me"
     */
    const friendChecks = memberIds.map(async (memberId) => {
      const [userA, userB] = pair(me, memberId);

      // Kiểm tra từng user có phải bạn không
      const friend = await Friend.findOne({ userA, userB });

      // Không phải bạn → trả về memberId để báo lỗi
      return friend ? null : memberId;
    });

    // Chạy song song các query
    const results = await Promise.all(friendChecks);

    // Lọc ra các user không phải bạn
    const notFriends = results.filter(Boolean);

    // Nếu tồn tại user không phải bạn → cấm tạo / thêm group
    if (notFriends.length > 0) {
      return res.status(403).json({
        message: "Bạn chỉ có thể thêm bạn bè vào nhóm.",
        notFriends,
      });
    }

    // Tất cả đều là bạn → cho phép tiếp tục
    next();
  } catch (error) {
    console.error("Lỗi xảy ra khi checkFriendship:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

/**
 * Middleware: checkGroupMembership
 *
 * Mục đích:
 * - Chỉ cho phép user thao tác nếu:
 *   + Đang là thành viên của group
 *
 * Áp dụng cho:
 * - Gửi tin nhắn group
 * - Thêm / xóa thành viên
 * - Đổi tên group
 */
export const checkGroupMembership = async (req, res, next) => {
  try {
    // Lấy conversationId từ body
    const { conversationId } = req.body;

    // ID user hiện tại
    const userId = req.user._id;

    // Tìm group chat
    const conversation = await Conversation.findById(conversationId);

    // Không tìm thấy group
    if (!conversation) {
      return res.status(404).json({
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }

    /**
     * Kiểm tra user có nằm trong participants không
     * participants: [{ userId, role, joinedAt }]
     */
    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    // Không phải thành viên → cấm thao tác
    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không ở trong group này.",
      });
    }

    /**
     * Gắn conversation vào req
     * → Controller dùng lại, không cần query DB lần nữa
     */
    req.conversation = conversation;

    // Cho phép đi tiếp
    next();
  } catch (error) {
    console.error("Lỗi checkGroupMembership:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
