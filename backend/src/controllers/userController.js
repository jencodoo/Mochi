export const authMe = async (req, res) => {
  try {
    const user = req.user; // đã được gắn từ protectedRoute middleware

    if (!user) {
      return res.status(401).json({ message: "Không xác thực được người dùng" });
    }

    // Chỉ trả về các field an toàn và cần thiết cho frontend
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl || "",
      bio: user.bio || "",
      phone: user.phone || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Có thể thêm sau: isOnline, lastSeen, etc.
    };

    return res.status(200).json({
      message: "Lấy thông tin người dùng thành công",
      user: userResponse,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe:", error);
    return res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
};