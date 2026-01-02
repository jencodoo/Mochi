import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js"
import cookieParser from "cookie-parser";
import { protectedRoute } from './middlewares/authMiddleware.js';
import userRoute from "./routes/userRoute.js";



dotenv.config(); //load các biến mt

const app = express(); // Khời tạo express
const PORT = process.env.PORT || 5001;// lấy giá trị tại PORT 5001

//middlewares
app.use(express.json()); //đọc request dạng json
app.use(cookieParser());

//public_routes
app.use('/api/auth', authRoute);


//prive_routes
app.use(protectedRoute)
app.use("/api/users", userRoute)


connectDB().then(() => {
        app.listen(PORT, () => {
        console.log(`server bắt đầu trên cổng ${PORT}`);
    });
})











