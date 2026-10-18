import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
export async function requireAuth(req,res,next){
 const token=req.cookies?.cdc_token;
 if(!token)return res.status(401).json({message:'Please log in'});
 let payload;
 try{payload=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']});}
 catch{return res.status(401).json({message:'Session expired or invalid'});}
 if(typeof payload.sub!=='string'||!mongoose.isObjectIdOrHexString(payload.sub))return res.status(401).json({message:'Session expired or invalid'});
 try{
  const user=await User.findById(payload.sub).select('+sessionVersion');
  if(!user)return res.status(401).json({message:'Account no longer exists'});
  if(user.active===false)return res.status(403).json({message:'Your account has been deactivated.'});
  if((payload.v||0)!==(user.sessionVersion||0))return res.status(401).json({message:'Your account credentials changed. Please sign in again.'});
  req.user=user;next();
 }catch(error){next(error);}
}
export const adminOnly=(req,res,next)=>req.user?.role==='admin'?next():res.status(403).json({message:'Admin access required'});
