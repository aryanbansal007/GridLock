import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Logs and returns on failure instead of exiting the process — auth and Race
// Engineer chat history need Mongo, but standings/calendar/analysis don't, so a
// Mongo outage/misconfiguration shouldn't take down the entire backend.
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed (auth/chat routes will error until this is fixed): ${(error as Error).message}`);
  }
};