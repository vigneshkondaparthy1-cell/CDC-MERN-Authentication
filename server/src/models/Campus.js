import mongoose from 'mongoose';
const {Schema}=mongoose;
export const Notice=mongoose.model('Notice',new Schema({
 title:{type:String,required:true,maxlength:120},body:{type:String,maxlength:1000},
 kind:{type:String,enum:['announcement','deadline','account'],required:true},
 audience:{type:String,enum:['all','student','faculty','admin'],default:'all'},
 department:{type:String,default:''},recipient:Schema.Types.ObjectId,
 dueAt:Date,createdBy:Schema.Types.ObjectId
},{timestamps:true}));
const attendance=new Schema({student:{type:Schema.Types.ObjectId,required:true},date:{type:String,required:true},present:{type:Boolean,required:true},recordedBy:Schema.Types.ObjectId},{timestamps:true});
attendance.index({student:1,date:1},{unique:true});
export const Attendance=mongoose.model('Attendance',attendance);
export const visibleNotices=user=>({$or:[{recipient:user._id},{recipient:null,audience:{$in:['all',user.role]},department:{$in:['',user.department||'']}}]});
export async function accountNotice(user,title){
 // Notifications must not turn an already committed account update into a failed request.
 try{await Notice.create([{title,body:'Your account details changed. Contact Admin if this was unexpected.',kind:'account',recipient:user._id},{title:`${user.name}: ${title}`,kind:'account',audience:'admin'}]);}catch(error){console.error('Account notification could not be saved:',error.message)}
}
