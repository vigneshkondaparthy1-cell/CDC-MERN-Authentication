import mongoose from 'mongoose';
import User from '../models/User.js';
export const connectDB = async () => { await mongoose.connect(process.env.MONGO_URI); await User.init(); console.log('MongoDB connected'); };
