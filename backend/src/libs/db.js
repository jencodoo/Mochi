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