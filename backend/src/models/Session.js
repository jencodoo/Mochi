import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // query theo userId (ví dụ logout all)
    },
    refreshToken: {
      type: String,
      required: true,
      index: true, // RẤT QUAN TRỌNG: để query nhanh khi refresh
      // Bỏ unique vì đã hash, trùng gần như không thể
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // Tùy chọn: hỗ trợ revoke thủ công (logout all devices)
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: tự động xóa document khi expiresAt qua thời điểm hiện tại
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index tìm theo refreshToken (hashed) - bắt buộc phải có để query nhanh
sessionSchema.index({ refreshToken: 1 });

export default mongoose.model("Session", sessionSchema);



// import mongoose from "mongoose";

// const sessionSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     refreshToken: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     expiresAt: {
//       type: Date,
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // tự động xoá khi hết hạn
// sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// export default mongoose.model("Session", sessionSchema);