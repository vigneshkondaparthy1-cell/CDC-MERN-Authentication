import {Router} from 'express';
import mongoose from 'mongoose';
import {z} from 'zod';
import User from '../models/User.js';
import {Notice,Attendance,visibleNotices} from '../models/Campus.js';
import {requireAuth} from '../middleware/auth.js';
const router=Router();router.use(requireAuth);
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
router.get('/overview',wrap(async(req,res)=>{
 const query=visibleNotices(req.user);
 const user=await User.findById(req.user._id).select('+readNotices');
 const [notices,unread,deadlines]=await Promise.all([
  Notice.find(query).sort({createdAt:-1}).limit(100).lean(),
  Notice.countDocuments({...query,_id:{$nin:user.readNotices||[]}}),
  Notice.find({...query,kind:'deadline',dueAt:{$gte:new Date()}}).sort({dueAt:1}).limit(5).lean()
 ]);
 const scope=req.user.role==='student'?{student:req.user._id}:{student:{$in:(await User.find({role:'student',...(req.user.role==='faculty'?{department:req.user.department||''}:{})}).select('_id')).map(u=>u._id)}};
 const records=await Attendance.aggregate([{$match:scope},{$group:{_id:null,total:{$sum:1},present:{$sum:{$cond:['$present',1,0]}}}}]);
 const a=records[0];res.json({notices:notices.map(n=>({...n,read:(user.readNotices||[]).includes(String(n._id))})),unread,deadlines,attendance:a?{...a,percentage:Math.round(a.present/a.total*100)}:null});
}));
router.post('/notices/:id/read',wrap(async(req,res)=>{
 if(!mongoose.isObjectIdOrHexString(req.params.id))return res.status(400).json({message:'Invalid notice'});
 if(!await Notice.exists({_id:req.params.id,...visibleNotices(req.user)}))return res.status(404).json({message:'Notice not found'});
 await User.updateOne({_id:req.user._id},{$addToSet:{readNotices:req.params.id}});res.json({message:'Marked as read'});
}));
router.post('/notices',wrap(async(req,res)=>{
 if(req.user.role==='student')return res.status(403).json({message:'Faculty or Admin access required'});
 const parsed=z.object({title:z.string().trim().min(2).max(120),body:z.string().trim().max(1000).default(''),kind:z.enum(['announcement','deadline']),audience:z.enum(['all','student','faculty']).default('all'),department:z.string().trim().max(80).default(''),dueAt:z.string().datetime().optional()}).strict().safeParse(req.body);
 if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0].message});
 const data=parsed.data;
 if(data.kind==='deadline'&&(!data.dueAt||new Date(data.dueAt)<=new Date()))return res.status(400).json({message:'Choose a future deadline'});
 if(req.user.role==='faculty'){if(!req.user.department)return res.status(400).json({message:'Set your department before publishing'});data.department=req.user.department;data.audience='student';}
 const notice=await Notice.create({...data,createdBy:req.user._id});res.status(201).json({notice});
}));
router.get('/attendance/students',wrap(async(req,res)=>{
 if(req.user.role==='student')return res.status(403).json({message:'Faculty or Admin access required'});
 const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
 const filter = {
  role: 'student',
  active: { $ne: false },
  ...(req.user.role === 'faculty' && req.user.department ? { department: req.user.department } : {})
 };
 if(q){
  filter.$or = [
   { rollNumber: { $regex: q, $options: 'i' } },
   { name: { $regex: q, $options: 'i' } }
  ];
 }
 const users = await User.find(filter).select('name rollNumber department email contact avatar').sort({ rollNumber: 1, name: 1 }).lean();
 res.json({ users });
}));
router.post('/attendance',wrap(async(req,res)=>{
 if(req.user.role==='student')return res.status(403).json({message:'Faculty or Admin access required'});
 const p=z.object({student:z.string().refine(mongoose.isObjectIdOrHexString),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),present:z.boolean()}).strict().safeParse(req.body);
 if(!p.success)return res.status(400).json({message:'Choose a student, date, and attendance status'});
 if(!Number.isFinite(Date.parse(p.data.date))||new Date(p.data.date).toISOString().slice(0,10)!==p.data.date||p.data.date>new Date().toISOString().slice(0,10))return res.status(400).json({message:'Choose a valid date that is not in the future'});
 const student=await User.findOne({_id:p.data.student,role:'student',active:{$ne:false},...(req.user.role==='faculty'?{department:req.user.department||''}:{})});
 if(!student)return res.status(404).json({message:'Student not found in your department'});
 await Attendance.findOneAndUpdate({student:student._id,date:p.data.date},{$set:{present:p.data.present,recordedBy:req.user._id}},{upsert:true,runValidators:true});res.json({message:'Attendance saved'});
}));
export default router;
