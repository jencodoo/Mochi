// @ts-nocheck
//npm i jsonwebtoken bcrypt cookie-parser : xác thực log, mã hóa mk và đọc token từ cookie
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m"; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày


//1/1/26
export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    // Kiểm tra thiếu trường
    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ các trường bắt buộc",
      });
    }

    // Chuẩn hóa dữ liệu
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Kiểm tra định dạng email
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    // Kiểm tra độ dài password
    if (password.length < 8) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

    // Kiểm tra username hoặc email đã tồn tại
    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      if (existingUser.username === normalizedUsername) {
        return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });
      }
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({ message: "Email đã được sử dụng" });
      }
    }

    // Mã hóa password
    const hashedPassword = await bcrypt.hash(password, 12); // 12 là mức tốt hiện nay (cân bằng tốc độ & an toàn)

    // Tạo user
    const newUser = await User.create({
      username: normalizedUsername,
      password: hashedPassword, // Đảm bảo field trong schema là "password", không phải hashedPassword
      email: normalizedEmail,
      displayName: `${firstName.trim()} ${lastName.trim()}`,
    });

    // Trả về thành công
    return res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    return res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
};

//2/1/26
export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Vui lòng cung cấp username và password",
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

   
    const user = await User.findOne({ username: normalizedUsername })
      .select('+password');

    if (!user) {
      return res.status(401).json({
        message: "Tên đăng nhập hoặc mật khẩu không chính xác",
      });
    }

    
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Tên đăng nhập hoặc mật khẩu không chính xác",
      });
    }

    // Phần còn lại giữ nguyên
    const payload = {
      userId: user._id,
      username: user.username,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

    await Session.create({
      userId: user._id,
      refreshToken: hashedRefreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: REFRESH_TOKEN_TTL,
      path: '/',
    });

    return res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    return res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
};

// Đăng xuất
export const signOut = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.sendStatus(204); // Không có token thì coi như đã logout
    }

    // Tìm session có refreshToken (hashed)
    const session = await Session.findOne({});

    // Duyệt tất cả session của user? Không, vì ta không biết userId từ plain token
    // Cách tốt nhất: tìm session và compare hash
    const sessions = await Session.find({}); // tạm thời, hoặc optimize sau

    let deleted = false;
    for (const sess of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, sess.refreshToken);
      if (isMatch) {
        await Session.deleteOne({ _id: sess._id });
        deleted = true;
        break; // chỉ xóa 1 (thiết bị hiện tại)
      }
    }

    // Xóa cookie dù có tìm thấy session hay không
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi signOut:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const incomingToken = req.cookies?.refreshToken;

    if (!incomingToken) {
      return res.status(401).json({ message: "Không có refresh token" });
    }

    // Tìm session khớp với incoming token (so sánh hash)
    let validSession = null;
    const sessions = await Session.find({ expiresAt: { $gt: new Date() } }); // chỉ lấy chưa hết hạn

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(incomingToken, session.refreshToken);
      if (isMatch) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      return res.status(403).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }

    // Optional: thêm kiểm tra isRevoked nếu có field này
    // if (validSession.isRevoked) { return res.status(403)... }

    // Tạo access token mới
    const payload = {
      userId: validSession.userId,
      username: (await User.findById(validSession.userId))?.username || '', // optional
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi refresh token:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// // tạo access token mới từ refresh token
// export const refreshToken = async (req, res) => {
//   try {
//     // lấy refresh token từ cookie
//     const token = req.cookies?.refreshToken;
//     if (!token) {
//       return res.status(401).json({ message: "Token không tồn tại." });
//     }

//     // so với refresh token trong db
//     const session = await Session.findOne({ refreshToken: token });

//     if (!session) {
//       return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
//     }

//     // kiểm tra hết hạn chưa
//     if (session.expiresAt < new Date()) {
//       return res.status(403).json({ message: "Token đã hết hạn." });
//     }

//     // tạo access token mới
//     const accessToken = jwt.sign(
//       {
//         userId: session.userId,
//       },
//       process.env.ACCESS_TOKEN_SECRET,
//       { expiresIn: ACCESS_TOKEN_TTL }
//     );

//     // return
//     return res.status(200).json({ accessToken });
//   } catch (error) {
//     console.error("Lỗi khi gọi refreshToken", error);
//     return res.status(500).json({ message: "Lỗi hệ thống" });
//   }
// };