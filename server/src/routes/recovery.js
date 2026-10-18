import {Router} from 'express';
import {randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import {z} from 'zod';
import User from '../models/User.js';
import {accountNotice} from '../models/Campus.js';
import {requireAuth} from '../middleware/auth.js';
const router=Router();
const digest=value=>createHash('sha256').update(value).digest('hex');
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
router.use(rateLimit({windowMs:15*60*1000,limit:20,message:{message:'Too many requests. Please try later.'}}));
export async function deliverLink(user,purpose,token){
 const url=new URL('/'+(purpose==='reset'?'reset-password':'verify-email'),process.env.CLIENT_ORIGIN||'http://localhost:5173');url.hash=new URLSearchParams({token}).toString();
 const subject=purpose==='reset'?'Reset your CDC password':'Verify your CDC email';
 const text=`${subject}\n\n${url}\n\nThis single-use link expires in ${purpose==='reset'?'30 minutes':'24 hours'}. If you did not request it, ignore this message.`;
 if(process.env.MAIL_MODE==='preview'||process.env.NODE_ENV!=='production'){
  const folder=fileURLToPath(new URL('../../../.local/mail-preview/',import.meta.url));await mkdir(folder,{recursive:true});
  await writeFile(folder+randomBytes(12).toString('hex')+'.txt',`To: ${user.email}\nSubject: ${subject}\n\n${text}`,{mode:0o600});
  return url.toString();
 }
 if(!process.env.SMTP_HOST||!process.env.MAIL_FROM)throw Error('Email delivery is not configured');
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',...(process.env.SMTP_USER?{auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}:{})});
 await transport.sendMail({from:process.env.MAIL_FROM,to:user.email,subject,text});
 return url.toString();
}
async function issue(user,purpose){
 const token=randomBytes(32).toString('hex'),field=purpose==='reset'?'reset':'verify';
 await User.updateOne({_id:user._id,email:user.email},{$set:{[field+'Hash']:digest(token),[field+'Expires']:new Date(Date.now()+(purpose==='reset'?30*60:24*60*60)*1000)}});
 try{return await deliverLink(user,purpose,token)}catch(error){await User.updateOne({_id:user._id,[field+'Hash']:digest(token)},{$unset:{[field+'Hash']:1,[field+'Expires']:1}});throw error;}
}
router.post('/forgot-password',wrap(async(req,res)=>{
 const parsed=z.string().trim().email().safeParse(req.body.email);if(!parsed.success)return res.status(400).json({message:'Enter a valid email'});
 const user=await User.findOne({email:parsed.data.toLowerCase(),active:{$ne:false}});
 let previewUrl=null;
 if(user){
  try{previewUrl=await issue(user,'reset')}catch(e){console.error('Password recovery delivery failed:',e.message);}
 }
 res.json({message:'If an active account exists with this email, a reset link has been dispatched.',previewUrl:process.env.NODE_ENV!=='production'?previewUrl:undefined});
}));
router.post('/request-verification',requireAuth,wrap(async(req,res)=>{
 if(req.user.emailVerified)return res.json({message:'Email already verified'});
 let previewUrl=null;
 try{previewUrl=await issue(req.user,'verify')}catch{return res.status(503).json({message:'Email delivery unavailable.'})}
 res.json({message:'Verification link sent to your email.',previewUrl:process.env.NODE_ENV!=='production'?previewUrl:undefined});
}));
router.post('/verify-email',wrap(async(req,res)=>{
 if(!/^[a-f0-9]{64}$/.test(req.body.token||''))return res.status(400).json({message:'Invalid or expired link'});
 const user=await User.findOneAndUpdate({verifyHash:digest(req.body.token),verifyExpires:{$gt:new Date()},active:{$ne:false}},{$set:{emailVerified:true},$unset:{verifyHash:1,verifyExpires:1}},{new:true});
 if(!user)return res.status(400).json({message:'Invalid or expired link'});res.json({message:'Email verified. You can now use password recovery.'});
}));
router.post('/reset-password',wrap(async(req,res)=>{
 const p=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(8).max(72).refine(v=>Buffer.byteLength(v)<=72)}).strict().safeParse(req.body);
 if(!p.success)return res.status(400).json({message:'Use a valid link and an 8–72 byte password'});
 const now=new Date();const user=await User.findOneAndUpdate({resetHash:digest(p.data.token),resetExpires:{$gt:now},active:{$ne:false},emailVerified:true},{$set:{passwordHash:await bcrypt.hash(p.data.password,12),passwordChangedAt:now},$inc:{sessionVersion:1},$unset:{resetHash:1,resetExpires:1},$push:{accountEvents:{$each:[{type:'password_changed',at:now}],$slice:-20}}},{new:true});
 if(!user)return res.status(400).json({message:'Invalid or expired link'});await accountNotice(user,'Password recovered');res.json({message:'Password reset. Sign in with your new password.'});
}));
export default router;
