import {Router} from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import {requireAuth,adminOnly} from '../middleware/auth.js';
const router=Router();router.use(requireAuth,adminOnly);
router.get('/next-roll',async(_req,res,next)=>{try{
 const taken=new Set((await User.find({role:'student'}).select('rollNumber').lean()).map(x=>x.rollNumber));
 let value=100001;while(value<=999999&&taken.has(String(value)))value++;
 if(value>999999)return res.status(409).json({message:'No six-digit roll numbers remain in the suggested range'});
 res.json({rollNumber:String(value)});
}catch(e){next(e)}});
router.get('/activity',async(_req,res,next)=>{try{
 const events=await User.aggregate([{$match:{role:{$in:['faculty','student']}}},{$unwind:'$accountEvents'},{$sort:{'accountEvents.at':-1}},{$limit:100},{$project:{_id:0,id:'$accountEvents._id',userId:'$_id',name:1,email:1,role:1,type:'$accountEvents.type',at:'$accountEvents.at'}}]);
 res.json({events});
}catch(e){next(e)}});
router.use('/accounts',rateLimit({windowMs:15*60*1000,limit:50,message:{message:'Too many account updates. Please try again later.'}}));
router.param('id',(req,res,next,id)=>mongoose.isObjectIdOrHexString(id)?next():res.status(400).json({message:'Invalid account ID'}));
router.patch('/accounts/:id',async(req,res,next)=>{try{
 const parsed=z.object({name:z.string().trim().min(2).max(100),email:z.string().trim().email()}).strict().safeParse(req.body);
 if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0].message});
 const current=await User.findOne({_id:req.params.id,role:{$in:['faculty','student']}});
 if(!current)return res.status(404).json({message:'Faculty or Student account not found'});
 const email=parsed.data.email.toLowerCase(),now=new Date();
 const update={$set:{name:parsed.data.name,email,...(email!==current.email?{emailChangedAt:now}:{})},$push:{accountEvents:{$each:[{type:'profile_updated_by_admin',at:now,actorId:req.user._id}],$slice:-20}}};
 if(email!==current.email)update.$inc={sessionVersion:1};
 const user=await User.findOneAndUpdate({_id:current._id,email:current.email,updatedAt:current.updatedAt},update,{new:true,runValidators:true});
 if(!user)return res.status(409).json({message:'Account changed in another session. Refresh and retry.'});
 res.json({user,message:'Profile updated'});
}catch(e){next(e)}});
router.post('/accounts/:id/reset-password',async(req,res,next)=>{try{
 const parsed=z.object({password:z.string().min(8).max(72).refine(value=>Buffer.byteLength(value,'utf8')<=72,'Password must be at most 72 bytes'),confirm:z.literal(true)}).strict().safeParse(req.body);
 if(!parsed.success)return res.status(400).json({message:'Provide an 8–72 byte password and confirm the reset'});
 const now=new Date();
 const user=await User.findOneAndUpdate({_id:req.params.id,role:{$in:['faculty','student']}},{$set:{passwordHash:await bcrypt.hash(parsed.data.password,12),passwordChangedAt:now},$inc:{sessionVersion:1},$push:{accountEvents:{$each:[{type:'password_reset_by_admin',at:now,actorId:req.user._id}],$slice:-20}}},{new:true,runValidators:true});
 if(!user)return res.status(404).json({message:'Faculty or Student account not found'});
 res.json({user,message:'Password reset. Existing sessions have been signed out.'});
}catch(e){next(e)}});
export default router;
