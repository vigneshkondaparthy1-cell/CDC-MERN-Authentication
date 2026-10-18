import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import {parse} from 'csv-parse/sync';
import mongoose from 'mongoose';
import {z} from 'zod';
import User from '../models/User.js';
import {accountNotice} from '../models/Campus.js';
import {requireAuth,adminOnly} from '../middleware/auth.js';
const router=Router();router.use(requireAuth,adminOnly);
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
router.patch('/accounts/:id/status',wrap(async(req,res)=>{
 if(!mongoose.isObjectIdOrHexString(req.params.id)||typeof req.body.active!=='boolean')return res.status(400).json({message:'Choose a valid account and status'});
 const user=await User.findOneAndUpdate({_id:req.params.id,role:{$in:['student','faculty']}},{$set:{active:req.body.active},$inc:{sessionVersion:1},$unset:{resetHash:1,resetExpires:1,verifyHash:1,verifyExpires:1}},{new:true});
 if(!user)return res.status(404).json({message:'Account not found'});
 await accountNotice(user,req.body.active?'Account reactivated':'Account deactivated');res.json({user});
}));
router.get('/export/:role',wrap(async(req,res)=>{
 const role={students:'student',faculty:'faculty'}[req.params.role];if(!role)return res.status(400).json({message:'Choose Students or Faculty'});
 const users=await User.find({role}).sort({name:1}).lean();
 const workbook=new ExcelJS.Workbook();workbook.creator='CDC Portal';workbook.created=new Date();
 const sheet=workbook.addWorksheet(role==='student'?'Students':'Faculty',{views:[{state:'frozen',ySplit:1}]});
 sheet.columns=[{header:'Full name',key:'name',width:30},{header:'Email',key:'email',width:38},...(role==='student'?[{header:'Roll number',key:'rollNumber',width:16}]:[]),{header:'Department',key:'department',width:24},{header:'Contact',key:'contact',width:22},{header:'Status',key:'status',width:14},{header:'Email verified',key:'verified',width:18},{header:'Created',key:'createdAt',width:23}];
 for(const user of users)sheet.addRow({...user,status:user.active===false?'Inactive':'Active',verified:user.emailVerified?'Yes':'No',createdAt:user.createdAt?.toISOString().slice(0,10)||''});
 sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF244B47'}};sheet.getRow(1).height=26;
 sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,sheet.rowCount),column:sheet.columnCount}};
 sheet.eachRow((row,i)=>{row.alignment={vertical:'middle'};if(i>1&&i%2===0)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF0F6F3'}}});
 const buffer=await workbook.xlsx.writeBuffer();res.set('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').set('Content-Disposition',`attachment; filename="CDC-${req.params.role}.xlsx"`).send(Buffer.from(buffer));
}));
const rowSchema=z.object({name:z.string().trim().min(2).max(100),email:z.string().trim().email().transform(v=>v.toLowerCase()),rollNumber:z.string().regex(/^\d{6}$/),department:z.string().trim().max(80).default(''),contact:z.string().trim().max(40).default(''),password:z.string().min(8).max(72).refine(v=>Buffer.byteLength(v)<=72)}).strict();
router.post(['/import-students','/import-faculty'],wrap(async(req,res)=>{
 const student=req.path==='/import-students',role=student?'student':'faculty',label=student?'students':'faculty';
 const schema=student?rowSchema:rowSchema.omit({rollNumber:true});
 if(typeof req.body.csv!=='string'||req.body.csv.length>200000||typeof req.body.preview!=='boolean')return res.status(400).json({message:'Upload a CSV up to 200 KB and specify preview'});
 let rows;try{rows=parse(req.body.csv,{columns:true,bom:true,skip_empty_lines:true,trim:true,max_record_size:4096})}catch{return res.status(400).json({message:'Invalid CSV. Check headers and quoted fields.'})}
 if(!rows.length||rows.length>200)return res.status(400).json({message:`Import between 1 and 200 ${label} at a time`});
 const errors=[],valid=[],emails=new Set(),rolls=new Set();
 for(const [i,row] of rows.entries()){
  const p=schema.safeParse(row);if(!p.success){errors.push({row:i+2,message:p.error.issues.map(x=>`${x.path.join('.')}: ${x.message}`).join('; ')});continue}
  if(emails.has(p.data.email)||(student&&rolls.has(p.data.rollNumber))){errors.push({row:i+2,message:student?'Repeated email or roll number in this CSV':'Repeated email in this CSV'});continue}
  emails.add(p.data.email);if(student)rolls.add(p.data.rollNumber);valid.push({row:i+2,...p.data});
 }
 const existing=await User.find({$or:[{email:{$in:[...emails]}},{rollNumber:{$in:[...rolls]}}]}).select('email rollNumber').lean();
 for(const row of valid)if(existing.some(u=>u.email===row.email||(student&&u.rollNumber===row.rollNumber)))errors.push({row:row.row,message:student?'Email or roll number already exists':'Email already exists'});
 if(req.body.preview||errors.length)return res.status(errors.length&&!req.body.preview?400:200).json({preview:valid.map(({password,...row})=>row),errors,ready:errors.length===0});
 let created=0;
 for(const row of valid){try{await User.create({name:row.name,email:row.email,department:row.department,contact:row.contact,role,...(student?{rollNumber:row.rollNumber,studentQrId:randomUUID()}:{}),passwordHash:await bcrypt.hash(row.password,12)});created++}catch(e){if(e.code!==11000)throw e;errors.push({row:row.row,message:'Concurrent duplicate: row not imported'})}}
 res.status(201).json({created,errors,message:`${created} ${label} imported. ${errors.length} rows skipped.`});
}));
export default router;
