import mongoose from "mongoose";

// Định nghĩa cấu trúc (schema) cho bảng User trong MongoDB
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,   // Bắt buộc phải có
      unique: true,     // Không được trùng với user khác
      trim: true,       // Tự động bỏ khoảng trắng đầu/cuối
      lowercase: true,  // Tự động chuyển về chữ thường
    },

    password: {   // Lưu mật khẩu đã mã hóa (không bao giờ lưu mật khẩu gốc)
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,   // Bắt buộc
      unique: true,     // Không trùng email
      lowercase: true,  // Chuẩn hóa chữ thường
      trim: true,
    },

    displayName: {
      type: String,     // Tên sẽ hiển thị ra UI
      required: true,
      trim: true,
    },

    avatarUrl: {
      type: String,     // Link ảnh đại diện (URL CDN, Cloudinary,...)
    },

    avatarId: {
      type: String,     // public_id của Cloudinary → dùng để xoá / thay avatar
    },

    bio: {
      type: String,     // Giới thiệu ngắn
      maxlength: 500,   // Giới hạn tối đa 500 ký tự
    },

    phone: {
      type: String,
      sparse: true,     // Cho phép null, nhưng nếu có thì không được trùng
                       // (khác với unique, unique không cho null trùng nhau)
    },
  },

  {
    timestamps: true,  
    // timestamps = true nghĩa là Mongoose sẽ tự thêm 2 field vào document:
    // createdAt: thời điểm document được tạo
    // updatedAt: thời điểm document được cập nhật gần nhất
    // → Không cần tự tạo hoặc cập nhật thủ công
  }
);

// Tạo model User để mongoose map với collection "users"
const User = mongoose.model("User", userSchema);
export default User;

