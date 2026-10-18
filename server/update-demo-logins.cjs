const fs=require('fs'),path=require('path'),bcrypt=require('bcryptjs'),mongoose=require('mongoose'),dotenv=require('dotenv');
const local=path.join(__dirname,'..','.local');
const env=dotenv.parse(fs.readFileSync(path.join(__dirname,'.env')));
const planFile=path.join(local,'simple-logins-plan.json');
(async()=>{
 await mongoose.connect(env.MONGO_URI,{serverSelectionTimeoutMS:10000});
 const collection=mongoose.connection.collection('users');
 const original=JSON.parse(fs.readFileSync(path.join(local,'demo-accounts.json'),'utf8'));
 const docs=await collection.find({email:{$in:original.map(x=>x.email)}}).toArray();
 if(docs.length!==120||docs.some(x=>!['faculty','student'].includes(x.role)))throw Error('Unexpected account selection; no changes made.');
 const byEmail=new Map(docs.map(x=>[x.email,x]));
 const admins=await collection.find({role:'admin'}).toArray();
 let entries;
 if(fs.existsSync(planFile))entries=JSON.parse(fs.readFileSync(planFile,'utf8'));
 else{
  const taken=new Set((await collection.find({role:'student'}).toArray()).map(x=>x.rollNumber));
  let roll=100001;const counts={faculty:0,student:0};
  entries=original.map(entry=>{
   const doc=byEmail.get(entry.email);if(doc.role!==entry.role)throw Error('Role mismatch');
   const sequence=String(++counts[entry.role]).padStart(3,'0');
   const next={...entry,name:doc.name,password:(entry.role==='faculty'?'Faculty':'Student')+sequence};
   if(entry.role==='student'){while(taken.has(String(roll)))roll++;if(roll>999999)throw Error('No available roll number');next.rollNumber=String(roll++);taken.add(next.rollNumber)}
   return next;
  });
  fs.writeFileSync(path.join(local,'before-simple-logins-backup.json'),JSON.stringify(docs,null,2),{flag:'wx'});
  fs.writeFileSync(planFile,JSON.stringify(entries,null,2),{flag:'wx'});
 }
 const changes=[];
 for(const entry of entries){const doc=byEmail.get(entry.email);if(!doc||doc.role!==entry.role)throw Error('Invalid migration plan');changes.push({updateOne:{filter:{_id:doc._id,role:entry.role},update:{$set:{passwordHash:await bcrypt.hash(entry.password,12),...(entry.role==='student'?{rollNumber:entry.rollNumber}:{}),updatedAt:new Date()}}}});}
 const result=await collection.bulkWrite(changes);
 const updated=await collection.find({email:{$in:entries.map(x=>x.email)}}).toArray();
 for(const doc of updated){const entry=entries.find(x=>x.email===doc.email),old=byEmail.get(doc.email);if(!await bcrypt.compare(entry.password,doc.passwordHash)||doc.name!==old.name||doc.studentQrId!==old.studentQrId||(entry.role==='student'&&doc.rollNumber!==entry.rollNumber))throw Error('Verification failed: '+doc.email);}
 for(const admin of admins){const after=await collection.findOne({_id:admin._id});if(after.passwordHash!==admin.passwordHash)throw Error('Admin password changed unexpectedly');}
 fs.writeFileSync(path.join(local,'demo-accounts.json'),JSON.stringify(entries,null,2));
 const all=['CDC Portal updated demo logins','URL: http://localhost:5173/login',''];
 for(const role of ['faculty','student']){
  const lines=[`CDC Portal — ${role} logins`,'URL: http://localhost:5173/login',''];
  for(const entry of entries.filter(x=>x.role===role))lines.push(entry.name,`Email: ${entry.email}`,`Password: ${entry.password}`,...(entry.rollNumber?[`Roll number: ${entry.rollNumber}`]:[]),'');
  fs.writeFileSync(path.join(local,role==='faculty'?'FACULTY-LOGINS.txt':'STUDENT-LOGINS.txt'),lines.join('\r\n'));all.push(...lines);
 }
 fs.writeFileSync(path.join(local,'FACULTY-STUDENT-LOGINS.txt'),all.join('\r\n'));
 console.log(JSON.stringify({updated:result.matchedCount,faculty:entries.filter(x=>x.role==='faculty').length,students:entries.filter(x=>x.role==='student').length,uniqueRollNumbers:new Set(entries.filter(x=>x.role==='student').map(x=>x.rollNumber)).size,allPasswordsVerified:true,adminUnchanged:true}));
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());
