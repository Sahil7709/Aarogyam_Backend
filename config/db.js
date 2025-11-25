import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Using URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/aarogyam');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aarogyam');
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Please check your MongoDB connection string and ensure the database is accessible.');
    process.exit(1);
  }
};

export default connectDB;