import 'dotenv/config';import bcrypt from 'bcryptjs';import mongoose from 'mongoose';
import User from '../models/User.js';
const {MONGO_URI,ADMIN_NAME,ADMIN_EMAIL,ADMIN_PASSWORD}=process.env;
if(!MONGO_URI||!ADMIN_EMAIL||!ADMIN_PASSWORD||ADMIN_PASSWORD.length<8){console.error('Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in server/.env');process.exit(1)}
try{await mongoose.connect(MONGO_URI);const existing=await User.findOne({email:ADMIN_EMAIL.toLowerCase()});
if(existing){console.log('Admin email already exists; no changes made');}else{await User.create({name:ADMIN_NAME||'Administrator',email:ADMIN_EMAIL.toLowerCase(),passwordHash:await bcrypt.hash(ADMIN_PASSWORD,12),role:'admin'});console.log('Admin seeded:',ADMIN_EMAIL)}
}catch(e){console.error(e.message);process.exitCode=1}finally{await mongoose.disconnect()}
