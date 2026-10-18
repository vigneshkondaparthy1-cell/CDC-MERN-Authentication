import {Router} from 'express';
import bcrypt from 'bcryptjs';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import User from '../models/User.js';
import {requireAuth,adminOnly} from '../middleware/auth.js';
const router=Router();router.use(requireAuth,adminOnly);
const base=z.object({name:z.string().trim().min(2).max(100),email:z.string().trim().email(),password:z.string().min(8).max(72).refine(value=>Buffer.byteLength(value,'utf8')<=72,'Password must be at most 72 bytes')});
async function create(req,res,next,role){try{
 const schema=role==='student'?base.extend({rollNumber:z.string().trim().regex(/^[0-9]{6}$/, 'Roll number must be exactly 6 digits')}):base;
 const parsed=schema.safeParse(req.body);
 if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0].message});
 const {name,email,password}=parsed.data;
 const user=await User.create({name,email:email.toLowerCase(),passwordHash:await bcrypt.hash(password,12),role,...(role==='student'?{rollNumber:parsed.data.rollNumber.toUpperCase(),studentQrId:randomUUID()}:{})});
 res.status(201).json({user});
}catch(e){next(e)}}
router.post('/faculty',(req,res,next)=>create(req,res,next,'faculty'));
router.post('/students',(req,res,next)=>create(req,res,next,'student'));
router.get('/faculty',async(_req,res,next)=>{try{res.json({users:await User.find({role:'faculty'}).sort({createdAt:-1})})}catch(e){next(e)}});
router.get('/students',async(_req,res,next)=>{try{res.json({users:await User.find({role:'student'}).sort({createdAt:-1})})}catch(e){next(e)}});
export default router;
