import {Router} from 'express';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import {requireAuth} from '../middleware/auth.js';
import {setSession} from '../config/session.js';
const router=Router();
router.use(requireAuth);
router.get('/me',(req,res)=>res.json({user:req.user}));
const sensitive=rateLimit({windowMs:15*60*1000,limit:15,message:{message:'Too many account changes. Please try again later.'}});
const password=z.string().min(8).max(72).refine(value=>Buffer.byteLength(value,'utf8')<=72,'Password must be at most 72 bytes');
for(const field of ['email','password']){
 router.patch('/'+field,sensitive,async(req,res,next)=>{try{
  if(!['faculty','student'].includes(req.user.role))return res.status(403).json({message:'This setting is available to Faculty and Students'});
  const schema=z.object({currentPassword:z.string().min(1),...(field==='email'?{email:z.string().trim().email()}:{password})}).strict();
  const parsed=schema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0].message});
  const current=await User.findById(req.user._id).select('+passwordHash +sessionVersion');
  if(!current||!await bcrypt.compare(parsed.data.currentPassword,current.passwordHash))return res.status(400).json({message:'Current password is incorrect'});
  const now=new Date();
  const changes=field==='email'?{email:parsed.data.email.toLowerCase(),emailChangedAt:now,emailVerified:false}:{passwordHash:await bcrypt.hash(parsed.data.password,12),passwordChangedAt:now};
  if(field==='email'&&changes.email===current.email)return res.status(400).json({message:'Enter a different email address'});
  if(field==='password'&&await bcrypt.compare(parsed.data.password,current.passwordHash))return res.status(400).json({message:'Choose a different password'});
  const user=await User.findOneAndUpdate({_id:current._id,passwordHash:current.passwordHash,email:current.email},{$set:changes,$unset:{verifyHash:1,verifyExpires:1,resetHash:1,resetExpires:1},$inc:{sessionVersion:1},$push:{accountEvents:{$each:[{type:field+'_changed',at:now,actorId:current._id,actorName:current.name,actorRole:current.role,changes:field==='email'?[{field:'email',before:current.email,after:changes.email}]:[]}],$slice:-20}}},{new:true,runValidators:true}).select('+sessionVersion');
  if(!user)return res.status(409).json({message:'Account changed in another session. Sign in again and retry.'});
  setSession(res,user);
  res.json({user,message:field==='email'?'Email updated. Use your new email next time you sign in.':'Password updated. Other sessions have been signed out.'});
 }catch(e){next(e)}});
}
router.patch('/details',async(req,res,next)=>{try{
 const schema=z.object({
  department:z.string().trim().max(80).optional(),
  contact:z.string().trim().max(40).optional(),
  avatar:z.string().max(2500000).optional()
 }).strict();
 const parsed=schema.safeParse(req.body);
 if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0].message});
 const update={};
 if(parsed.data.department!==undefined)update.department=parsed.data.department;
 if(parsed.data.contact!==undefined)update.contact=parsed.data.contact;
 if(parsed.data.avatar!==undefined)update.avatar=parsed.data.avatar;
 const detailChanges=Object.entries(update).filter(([key,value])=>(req.user[key]||'')!==value).map(([field,after])=>({field,before:field==='avatar'?(req.user.avatar?'Photo set':'No photo'):(req.user[field]||''),after:field==='avatar'?(after?'Photo set':'No photo'):after}));
 const user=await User.findOneAndUpdate({_id:req.user._id,updatedAt:req.user.updatedAt},{$set:update,...(detailChanges.length?{$push:{accountEvents:{$each:[{type:'profile_updated',at:new Date(),actorId:req.user._id,actorName:req.user.name,actorRole:req.user.role,changes:detailChanges}],$slice:-20}}}:{})},{new:true,runValidators:true});
 if(!user)return res.status(409).json({message:'Profile changed. Refresh and retry.'});
 res.json({user,message:'Profile details updated successfully.'});
}catch(e){next(e)}});
export default router;

