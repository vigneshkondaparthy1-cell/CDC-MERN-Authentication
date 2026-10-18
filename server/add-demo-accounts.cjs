const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const dotenv=require('dotenv');
const env=dotenv.parse(fs.readFileSync(path.join(__dirname,'.env')));
const local=path.join(__dirname,'..','.local');
const manifestPath=path.join(local,'demo-accounts.json');
const loginPath=path.join(local,'FACULTY-STUDENT-LOGINS.txt');
const base='http://127.0.0.1:5000/api';
let cookie;
async function api(route,body){
 const response=await fetch(base+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(!response.ok)throw Error(route+': '+response.status+' '+data.message);
 return {response,data};
}
(async()=>{
 const login=await api('/auth/login',{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD});
 cookie=login.response.headers.get('set-cookie').split(';')[0];
 const faculty=(await api('/admin/faculty')).data.users;
 const students=(await api('/admin/students')).data.users;
 let entries;
 if(fs.existsSync(manifestPath))entries=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 else{
  const emails=new Set([...faculty,...students].map(x=>x.email));
  const rolls=new Set(students.map(x=>x.rollNumber));
  entries=[];
  for(const [role,count] of [['faculty',30],['student',90]]){
   for(let i=1,added=0;added<count;i++){
    const number=String(i).padStart(3,'0');
    const email=`${role}${number}@example.com`;
    const rollNumber=`DEMO-${number}`;
    if(emails.has(email)||(role==='student'&&rolls.has(rollNumber)))continue;
    entries.push({role,name:`Demo ${role==='faculty'?'Faculty':'Student'} ${number}`,email,password:crypto.randomBytes(12).toString('base64url'),...(role==='student'?{rollNumber}:{})});
    emails.add(email);if(role==='student')rolls.add(rollNumber);added++;
   }
  }
  fs.mkdirSync(local,{recursive:true});
  fs.writeFileSync(manifestPath,JSON.stringify(entries,null,2),{flag:'wx'});
 }
 const existing=new Map([...faculty,...students].map(x=>[x.email,x]));
 let created=0;
 for(const entry of entries){
  if(existing.has(entry.email)){
   const user=existing.get(entry.email);
   if(user.role!==entry.role||user.name!==entry.name)throw Error('Account collision: '+entry.email);
   continue;
  }
  await api('/admin/'+(entry.role==='faculty'?'faculty':'students'),entry);created++;
  if(created%30===0)console.log(`Created ${created} accounts in this run.`);
 }
 const finalFaculty=(await api('/admin/faculty')).data.users;
 const finalStudents=(await api('/admin/students')).data.users;
 const all=new Map([...finalFaculty,...finalStudents].map(x=>[x.email,x]));
 for(const entry of entries){const user=all.get(entry.email);if(!user||user.role!==entry.role||(entry.role==='student'&&(!user.studentQrId||user.rollNumber!==entry.rollNumber)))throw Error('Verification failed: '+entry.email);}
 for(const role of ['faculty','student']){
  const entry=entries.find(x=>x.role===role);
  const result=await api('/auth/login',{email:entry.email,password:entry.password});
  if(result.data.user.role!==role)throw Error('Login verification failed: '+role);
 }
 const lines=['CDC Portal demo account logins','URL: http://localhost:5173/login','Keep this file private.',''];
 for(const role of ['faculty','student']){
  lines.push(role.toUpperCase(),'');
  for(const entry of entries.filter(x=>x.role===role))lines.push(entry.name,`Email: ${entry.email}`,`Password: ${entry.password}`,...(entry.rollNumber?[`Roll number: ${entry.rollNumber}`]:[]),'');
 }
 fs.writeFileSync(loginPath,lines.join('\r\n'));
 console.log(JSON.stringify({created,verifiedFaculty:entries.filter(x=>x.role==='faculty').length,verifiedStudents:entries.filter(x=>x.role==='student').length,totalFaculty:finalFaculty.length,totalStudents:finalStudents.length,sampleLogins:'passed',loginFile:loginPath}));
})().catch(error=>{console.error(error.message);process.exitCode=1});
