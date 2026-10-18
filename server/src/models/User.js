import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
 name:{type:String,required:true,trim:true,minlength:2,maxlength:100},
 email:{type:String,required:true,lowercase:true,trim:true,unique:true},
 passwordHash:{type:String,required:true,select:false},
 role:{type:String,enum:['admin','faculty','student'],required:true},
 active:{type:Boolean,default:true},
 department:{type:String,trim:true,maxlength:80,default:''},
 contact:{type:String,trim:true,maxlength:40,default:''},
 avatar:{type:String,default:''},
 emailVerified:{type:Boolean,default:false},
 resetHash:{type:String,select:false},resetExpires:{type:Date,select:false},
 verifyHash:{type:String,select:false},verifyExpires:{type:Date,select:false},
 readNotices:{type:[String],default:[],select:false},
 rollNumber:{type:String,trim:true,match:[/^[0-9]{6}$/, 'Roll number must be exactly 6 digits'],required:function(){return this.role==='student'}},
 studentQrId:{type:String},
 sessionVersion:{type:Number,default:0,select:false},
 passwordChangedAt:Date,emailChangedAt:Date,
 accountEvents:{type:[new mongoose.Schema({type:{type:String,enum:["email_changed","password_changed","profile_updated_by_admin","password_reset_by_admin"]},at:Date,actorId:mongoose.Schema.Types.ObjectId})],select:false,default:[]}
},{timestamps:true});
userSchema.index({rollNumber:1},{unique:true,partialFilterExpression:{rollNumber:{$type:'string'}}});
userSchema.index({studentQrId:1},{unique:true,partialFilterExpression:{studentQrId:{$type:'string'}}});
userSchema.set('toJSON',{transform(_doc,ret){delete ret.passwordHash;delete ret.sessionVersion;delete ret.accountEvents;delete ret.__v;return ret;}});
export default mongoose.model('User',userSchema);
