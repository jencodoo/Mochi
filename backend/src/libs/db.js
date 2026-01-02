import mongoose from 'mongoose';

//kết nối db
export const connectDB = async () => {
    try {
        // @ts-ignore
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log('Liên kết CSDL thành công');
    } catch (error){
        console.log('Lỗi khi kết nối CSDL:', error);
        process.exit(1); // dừng khi ko kn đc CSDL
    }
}


// // src/db/connectDB.js 
// import mongoose from "mongoose";

// let isConnected = false; // Theo dõi trạng thái kết nối

// export const connectDB = async () => {
//   if (isConnected) {
//     console.log("Đang sử dụng kết nối MongoDB hiện có");
//     return;
//   }

//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING, {
//       // Các option quan trọng hiện đại
//       maxPoolSize: 10, // Giới hạn pool kết nối (tùy chỉnh theo server)
//       serverSelectionTimeoutMS: 5000, // Timeout chọn server
//       socketTimeoutMS: 45000, // Timeout socket
//       family: 4, // Dùng IPv4, tránh lỗi trên một số host
//     });

//     isConnected = true;

//     console.log(`Liên kết CSDL thành công: ${conn.connection.host}`);

//     // Xử lý sự kiện disconnect (tự động reconnect)
//     mongoose.connection.on("disconnected", () => {
//       console.warn("Mất kết nối MongoDB! Đang thử kết nối lại...");
//       isConnected = false;
//     });

//     mongoose.connection.on("reconnected", () => {
//       console.log("Đã kết nối lại MongoDB thành công!");
//       isConnected = true;
//     });

//     mongoose.connection.on("error", (err) => {
//       console.error("Lỗi kết nối MongoDB:", err);
//     });

//   } catch (error) {
//     console.error("Lỗi khi kết nối CSDL:", error);
//     // Đợi 5 giây rồi thử lại (tốt hơn là crash ngay)
//     setTimeout(() => {
//       console.log("Thử kết nối lại MongoDB...");
//       connectDB();
//     }, 5000);
//     // Không process.exit(1) ngay để dev dễ debug, production có thể bật lại
//     // process.exit(1);
//   }
// };

// export default connectDB;