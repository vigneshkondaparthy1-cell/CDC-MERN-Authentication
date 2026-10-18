const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env')));
const local = path.join(__dirname, '..', '.local');
const manifest = path.join(local, 'demo-accounts.json');

const firstNames = [
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

const lastNames = [
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

const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics & Comm',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering'
];

(async () => {
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const usersColl = mongoose.connection.collection('users');
  const allUsers = await usersColl.find({}).sort({ role: 1, email: 1 }).toArray();

  console.log(`Loaded ${allUsers.length} users from database.`);
  if (allUsers.length > firstNames.length || allUsers.length > lastNames.length) {
    throw new Error('Not enough unique names for all users!');
  }

  // Admin first, then faculty, then students
  const adminUsers = allUsers.filter(u => u.role === 'admin');
  const facultyUsers = allUsers.filter(u => u.role === 'faculty').sort((a,b) => a.email.localeCompare(b.email));
  const studentUsers = allUsers.filter(u => u.role === 'student').sort((a,b) => a.email.localeCompare(b.email));

  const sorted = [...adminUsers, ...facultyUsers, ...studentUsers];

  const assignedFirst = new Set();
  const assignedLast = new Set();
  const updates = [];

  let idx = 0;
  for (const user of sorted) {
    const f = firstNames[idx];
    const l = lastNames[idx];
    if (assignedFirst.has(f)) throw new Error('Duplicate first name: ' + f);
    if (assignedLast.has(l)) throw new Error('Duplicate last name: ' + l);

    assignedFirst.add(f);
    assignedLast.add(l);

    const fullName = `${f} ${l}`;
    const dept = user.department || departments[idx % departments.length];
    const contact = user.contact || `+91 98765 ${String(10000 + idx).slice(1)}`;
    const emailVerified = user.emailVerified !== undefined ? user.emailVerified : (idx % 2 === 0);

    updates.push({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: fullName,
      department: dept,
      contact: contact,
      emailVerified: emailVerified
    });

    idx++;
  }

  // Double check uniqueness
  const finalFirsts = updates.map(u => u.name.split(' ')[0]);
  const finalLasts = updates.map(u => u.name.split(' ').slice(1).join(' '));
  console.log('Uniqueness check:');
  console.log('Total updates:', updates.length);
  console.log('Unique first names:', new Set(finalFirsts).size);
  console.log('Unique last names:', new Set(finalLasts).size);

  if (new Set(finalFirsts).size !== updates.length || new Set(finalLasts).size !== updates.length) {
    throw new Error('Uniqueness assertion failed!');
  }

  // Perform bulk update in MongoDB
  const bulkOps = updates.map(u => ({
    updateOne: {
      filter: { _id: u._id },
      update: {
        $set: {
          name: u.name,
          department: u.department,
          contact: u.contact,
          emailVerified: u.emailVerified,
          updatedAt: new Date()
        }
      }
    }
  }));

  const res = await usersColl.bulkWrite(bulkOps);
  console.log('MongoDB bulkWrite matched:', res.matchedCount, 'modified:', res.modifiedCount);

  // Update demo-accounts.json if it exists
  if (fs.existsSync(manifest)) {
    const demoEntries = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    for (const entry of demoEntries) {
      const match = updates.find(u => u.email.toLowerCase() === entry.email.toLowerCase());
      if (match) {
        entry.name = match.name;
        entry.department = match.department;
        entry.contact = match.contact;
      }
    }
    fs.writeFileSync(manifest, JSON.stringify(demoEntries, null, 2));
    console.log('Updated demo-accounts.json');

    // Update FACULTY-STUDENT-LOGINS.txt
    const lines = [
      'CDC Portal demo account logins',
      'URL: http://localhost:5173/login',
      'Keep this file private.',
      'NOTE: Every account has a strictly unique first name and unique last name.',
      ''
    ];
    for (const role of ['faculty', 'student']) {
      lines.push(role.toUpperCase(), '');
      for (const entry of demoEntries.filter(x => x.role === role)) {
        lines.push(
          entry.name,
          `Email: ${entry.email}`,
          `Password: ${entry.password}`,
          ...(entry.rollNumber ? [`Roll number: ${entry.rollNumber}`] : []),
          `Department: ${entry.department || 'General'}`,
          ''
        );
      }
    }
    fs.writeFileSync(path.join(local, 'FACULTY-STUDENT-LOGINS.txt'), lines.join('\r\n'));
    console.log('Updated FACULTY-STUDENT-LOGINS.txt');
  }

  console.log('SUCCESS: All accounts updated with 100% unique first and last names!');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
