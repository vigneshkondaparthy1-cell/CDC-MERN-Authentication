import 'dotenv/config';
import app from './app.js';import {connectDB} from './config/db.js';
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32||!process.env.MONGO_URI){console.error('Set MONGO_URI and a JWT_SECRET of at least 32 characters in server/.env');process.exit(1)}
try{await connectDB();app.listen(Number(process.env.PORT)||5000,()=>console.log(`API listening on http://localhost:${process.env.PORT||5000}`));}catch(err){console.error('Startup failed:',err.message);process.exit(1)}
