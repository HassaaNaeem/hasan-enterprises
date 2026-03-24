import mongoose from "mongoose";
import "dotenv/config";
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });
    console.log(`✓ MongoDB Connected:`);
    return conn;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error:`);
    process.exit(1);
  }
};

export default connectDB;
