//ý tưởng: lấy token từ header → verify → gắn user vào req.user → next().

// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization: Bearer <token>
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token bằng promise (sạch hơn callback)
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    // Tìm user từ userId trong payload
    const user = await User.findById(decoded.userId)
      .select("-password"); 
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Gắn thông tin user vào req (frontend/route sau này dùng req.user)
    req.user = user;

    // Cho phép đi tiếp
    next();
  } catch (error) {
    // Phân biệt lỗi hết hạn để frontend dễ refresh token
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token đã hết hạn",
        errorCode: "TOKEN_EXPIRED", // frontend dùng để gọi refresh
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Access token không hợp lệ" });
    }

    // Các lỗi khác (server, etc.)
    console.error("Lỗi xác thực token:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// // @ts-nocheck
// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// // authorization - xác minh user là ai
// export const protectedRoute = (req, res, next) => {
//   try {
//     // lấy token từ header
//     const authHeader = req.headers["authorization"];
//     const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

//     if (!token) {
//       return res.status(401).json({ message: "Không tìm thấy access token" });
//     }

//     // xác nhận token hợp lệ
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
//       if (err) {
//         console.error(err);

//         return res
//           .status(403)
//           .json({ message: "Access token hết hạn hoặc không đúng" });
//       }

//       // tìm user
//       const user = await User.findById(decodedUser.userId).select("-password");

//       if (!user) {
//         return res.status(404).json({ message: "người dùng không tồn tại." });
//       }

//       // trả user về trong req
//       req.user = user;
//       next();
//     });
//   } catch (error) {
//     console.error("Lỗi khi xác minh JWT trong authMiddleware", error);
//     return res.status(500).json({ message: "Lỗi hệ thống" });
//   }
// };