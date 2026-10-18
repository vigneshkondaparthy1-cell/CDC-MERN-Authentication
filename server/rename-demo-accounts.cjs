const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
const local=path.join(__dirname,'..','.local');
const manifest=path.join(local,'demo-accounts.json');
const env=dotenv.parse(fs.readFileSync(path.join(__dirname,'.env')));
const first=[
  'Aarav', 'Aditi', 'Aditya', 'Ananya', 'Arjun', 'Avni', 'Dev', 'Diya', 'Ishaan', 'Isha',
  'Kabir', 'Kavya', 'Krish', 'Meera', 'Neel', 'Nisha', 'Pranav', 'Priya', 'Rahul', 'Riya',
  'Rohan', 'Saanvi', 'Sahil', 'Shreya', 'Siddharth', 'Sneha', 'Varun', 'Vidya', 'Vikram', 'Zoya',
  'Abhinav', 'Aishwarya', 'Akash', 'Alok', 'Amrita', 'Aniket', 'Anjali', 'Ankush', 'Anushka', 'Aparna',
  'Ashwin', 'Bhavna', 'Chetan', 'Deepak', 'Divya', 'Gaurav', 'Geeta', 'Harish', 'Harini', 'Hemant',
  'Himani', 'Inder', 'Jagdish', 'Jaya', 'Jitendra', 'Jyoti', 'Kailash', 'Kalpana', 'Karan', 'Karthik',
  'Kiran', 'Komal', 'Krishna', 'Lakshmi', 'Madhav', 'Malini', 'Manish', 'Manju', 'Mayank', 'Mohit',
  'Mukesh', 'Nandini', 'Naresh', 'Navin', 'Nikita', 'Naveen', 'Pallavi', 'Pankaj', 'Pooja', 'Prakash',
  'Prateek', 'Preeti', 'Raghav', 'Rajesh', 'Rakesh', 'Rashmi', 'Ravindra', 'Rekha', 'Rishi', 'Ritika',
  'Sameer', 'Sandhya', 'Sanjay', 'Santosh', 'Sarita', 'Satish', 'Saurabh', 'Seema', 'Shalini', 'Shashi',
  'Shivani', 'Shobha', 'Shruti', 'Smita', 'Somesh', 'Sonali', 'Subhash', 'Sudhir', 'Sujata', 'Sumit',
  'Sunil', 'Sunita', 'Suresh', 'Suraj', 'Sushil', 'Swati', 'Tanvi', 'Tarun', 'Tejas', 'Uday',
  'Uma', 'Umesh', 'Upendra', 'Urvashi', 'Utkarsh', 'Vaibhav', 'Vandana', 'Vasant', 'Vedant', 'Veena',
  'Vijay', 'Vikas', 'Vimal', 'Vinay', 'Vinod', 'Vipul', 'Vishal', 'Vivek', 'Yash', 'Yogesh',
  'Devendra', 'Chirag', 'Tanya', 'Akshat', 'Bhavya', 'Darshan', 'Esha', 'Girish', 'Hitesh', 'Ira'
];
const last=[
  'Sharma', 'Reddy', 'Patel', 'Rao', 'Verma', 'Nair', 'Iyer', 'Gupta', 'Mehta', 'Das',
  'Joshi', 'Kapoor', 'Menon', 'Singh', 'Shah', 'Kumar', 'Naidu', 'Mishra', 'Bose', 'Kulkarni',
  'Agarwal', 'Banerjee', 'Bhat', 'Bhattacharya', 'Chakraborty', 'Chatterjee', 'Chauhan', 'Chopra', 'Choudhury', 'Deshmukh',
  'Deshpande', 'Dey', 'Dhawan', 'Dubey', 'Dutta', 'Fernandes', 'Ganguly', 'Garg', 'Ghosh', 'Goswami',
  'Gowda', 'Grover', 'Hegde', 'Jadhav', 'Jain', 'Jha', 'Kashyap', 'Kaul', 'Kaur', 'Khanna',
  'Khatri', 'Kothari', 'Mahajan', 'Malhotra', 'Mallick', 'Mandal', 'Mani', 'Marathe', 'Mathur', 'Mazumdar',
  'Mukherjee', 'Nadkarni', 'Nambiar', 'Narayan', 'Nath', 'Nayyar', 'Pai', 'Pandey', 'Panicker', 'Pant',
  'Parikh', 'Pathak', 'Patil', 'Pillai', 'Pradhan', 'Prasad', 'Puri', 'Radhakrishnan', 'Raina', 'Rajagopal',
  'Rajan', 'Rastogi', 'Rathore', 'Rath', 'Rawat', 'Ray', 'Roy', 'Saha', 'Sahni', 'Saxena',
  'Sehgal', 'Sen', 'Sengupta', 'Seth', 'Sethi', 'Shetty', 'Shukla', 'Singhal', 'Sinha', 'Soni',
  'Srinivasan', 'Subramaniam', 'Swaminathan', 'Talwar', 'Tandon', 'Tendulkar', 'Tewari', 'Thakur', 'Tripathi', 'Trivedi',
  'Upadhyay', 'Varshney', 'Venkataraman', 'Venkatesh', 'Vora', 'Vyas', 'Walia', 'Yadav', 'Acharya', 'Ahluwalia',
  'Bhandari', 'Bhatia', 'Chandran', 'Datta', 'Deo', 'Grewal', 'Kamat', 'Kannan', 'Kaushik', 'Majumdar'
];
(async()=>{
 const entries=JSON.parse(fs.readFileSync(manifest,'utf8'));
 await mongoose.connect(env.MONGO_URI,{serverSelectionTimeoutMS:10000});
 const users=mongoose.connection.collection('users');
 const documents=await users.find({email:{$in:entries.map(x=>x.email)}}).toArray();
 if(documents.length!==entries.length)throw Error('Some demo accounts are missing; no names changed.');
 const existing=new Map(documents.map(x=>[x.email,x]));
 for(const entry of entries)if(existing.get(entry.email).role!==entry.role)throw Error('Role mismatch; no names changed.');
 const usedFirst=new Set(),usedLast=new Set();
 entries.forEach((entry,idx)=>{
   const f=first[idx],l=last[idx];
   if(usedFirst.has(f)||usedLast.has(l))throw Error('Duplicate name index');
   usedFirst.add(f);usedLast.add(l);
   entry.name=`${f} ${l}`;
 });
 const backup=path.join(local,'demo-accounts-before-rename.json');
 if(!fs.existsSync(backup))fs.copyFileSync(manifest,backup);
 const result=await users.bulkWrite(entries.map(entry=>({updateOne:{filter:{_id:existing.get(entry.email)._id,role:entry.role},update:{$set:{name:entry.name,updatedAt:new Date()}}}})));
 const updated=await users.find({email:{$in:entries.map(x=>x.email)}}).toArray();
 for(const user of updated){
  const old=existing.get(user.email),entry=entries.find(x=>x.email===user.email);
  if(user.name!==entry.name||user.passwordHash!==old.passwordHash||user.rollNumber!==old.rollNumber||user.studentQrId!==old.studentQrId)throw Error('Verification failed');
 }
 fs.writeFileSync(manifest,JSON.stringify(entries,null,2));
 const lines=['CDC Portal demo account logins','URL: http://localhost:5173/login','Keep this file private.',''];
 for(const role of ['faculty','student']){
  lines.push(role.toUpperCase(),'');
  for(const entry of entries.filter(x=>x.role===role))lines.push(entry.name,`Email: ${entry.email}`,`Password: ${entry.password}`,...(entry.rollNumber?[`Roll number: ${entry.rollNumber}`]:[]),'');
 }
 fs.writeFileSync(path.join(local,'FACULTY-STUDENT-LOGINS.txt'),lines.join('\r\n'));
 console.log(JSON.stringify({matched:result.matchedCount,faculty:entries.filter(x=>x.role==='faculty').length,students:entries.filter(x=>x.role==='student').length,uniqueNames: new Set(entries.map(x=>x.name)).size,credentialsAndIdentifiers:'unchanged'}));
})().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>mongoose.disconnect());
