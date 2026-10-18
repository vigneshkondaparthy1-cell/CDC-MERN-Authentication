const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env')));
const { Notice, Attendance } = require('./src/models/Campus.js');
const User = require('./src/models/User.js').default;

(async () => {
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const admin = await User.findOne({ role: 'admin' });
  const students = await User.find({ role: 'student' }).lean();
  const faculty = await User.find({ role: 'faculty' }).lean();

  console.log(`Found ${students.length} students, ${faculty.length} faculty.`);

  // Clean existing notices and attendance
  await Notice.deleteMany({});
  await Attendance.deleteMany({});

  const now = new Date();
  const inDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const sampleNotices = [
    {
      title: 'Career Portal Profile Final Submission',
      body: 'Verify your contact details, roll number, and department before the semester placement lock date.',
      kind: 'deadline',
      audience: 'all',
      department: '',
      dueAt: inDays(3),
      createdBy: admin?._id
    },
    {
      title: 'Spring Placement Drive Pre-Assessment',
      body: 'Online coding and analytical assessment link will be activated for registered students.',
      kind: 'deadline',
      audience: 'student',
      department: '',
      dueAt: inDays(7),
      createdBy: admin?._id
    },
    {
      title: 'Faculty Course Assessment & Grading Review',
      body: 'Semester mid-term evaluation reports must be finalized and submitted to the department portal.',
      kind: 'deadline',
      audience: 'faculty',
      department: '',
      dueAt: inDays(10),
      createdBy: admin?._id
    },
    {
      title: 'Internship Offer Letter & NOC Upload',
      body: 'Upload company confirmation letter to secure course credits and verified internship clearance.',
      kind: 'deadline',
      audience: 'student',
      department: '',
      dueAt: inDays(14),
      createdBy: admin?._id
    },
    {
      title: 'CDC Annual Recruitment Drive 2026 Announced',
      body: 'Over 65 premier recruiting partners are visiting campus this season. Please keep your profiles up to date.',
      kind: 'announcement',
      audience: 'all',
      department: '',
      createdBy: admin?._id
    },
    {
      title: 'Mock Technical & HR Interview Schedule Published',
      body: 'Departmental mock interview sessions are slated for this upcoming weekend. Review company pattern rubrics.',
      kind: 'announcement',
      audience: 'student',
      department: '',
      createdBy: admin?._id
    },
    {
      title: 'Department Research Advisory & Curriculum Meeting',
      body: 'Faculty coordination session scheduled in Conference Hall B for next academic term syllabus updates.',
      kind: 'announcement',
      audience: 'faculty',
      department: '',
      createdBy: admin?._id
    },
    {
      title: 'System Account Security & Verified Credentials Updated',
      body: 'Password recovery with expiring links and verified email workflows are now active on your portal.',
      kind: 'account',
      audience: 'all',
      department: '',
      createdBy: admin?._id
    }
  ];

  await Notice.insertMany(sampleNotices);
  console.log(`Seeded ${sampleNotices.length} notices.`);

  // Seed attendance for past 10 instructional days
  const dates = [];
  for (let i = 14; i >= 1; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Weekdays only
      dates.push(d.toISOString().slice(0, 10));
      if (dates.length === 10) break;
    }
  }

  const attendanceRecords = [];
  for (const st of students) {
    for (const d of dates) {
      // 93% attendance rate
      const present = Math.random() < 0.93;
      attendanceRecords.push({
        student: st._id,
        date: d,
        present: present,
        recordedBy: admin?._id
      });
    }
  }

  if (attendanceRecords.length) {
    await Attendance.insertMany(attendanceRecords);
    console.log(`Seeded ${attendanceRecords.length} attendance records across ${students.length} students.`);
  }

  console.log('Campus data seeding completed successfully!');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
