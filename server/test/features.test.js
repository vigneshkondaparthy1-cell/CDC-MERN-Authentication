import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import {MongoMemoryServer} from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import {Notice,Attendance} from '../src/models/Campus.js';

let mongo,adminId,studentId,facultyId;
const password='Features-test-42!';
const admin=request.agent(app);
const student=request.agent(app);
const faculty=request.agent(app);

before(async()=>{
  process.env.JWT_SECRET='features-test-secret-with-more-than-32-characters';
  process.env.MAIL_MODE='preview';
  mongo=await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.init();
  const passwordHash=await bcrypt.hash(password,4);

  const users=await User.create([
    {name:'Admin Alpha',email:'admin@example.com',role:'admin',passwordHash,emailVerified:true},
    {name:'Student Beta',email:'student@example.com',role:'student',rollNumber:'100001',passwordHash,studentQrId:'student-qr-12345',department:'Computer Science',contact:'+91 98765 00001',emailVerified:true},
    {name:'Faculty Gamma',email:'faculty@example.com',role:'faculty',passwordHash,department:'Computer Science',contact:'+91 98765 00002',emailVerified:true}
  ]);
  [adminId,studentId,facultyId]=users.map(u=>String(u._id));

  await admin.post('/api/auth/login').send({email:'admin@example.com',password}).expect(200);
  await student.post('/api/auth/login').send({email:'student@example.com',password}).expect(200);
  await faculty.post('/api/auth/login').send({email:'faculty@example.com',password}).expect(200);

  // Seed sample notices
  await Notice.create([
    {title:'First Deadline',body:'Submit your draft',kind:'deadline',dueAt:new Date(Date.now()+86400000),createdBy:adminId},
    {title:'First Announcement',body:'Campus library open 24/7',kind:'announcement',createdBy:adminId}
  ]);

  // Seed attendance
  await Attendance.create({student:studentId,date:new Date().toISOString().slice(0,10),present:true,recordedBy:adminId});
},{timeout:180000});

after(async()=>{
  await mongoose.disconnect();
  await mongo?.stop();
});

test('campus overview, notices, deadlines, and attendance summary',async()=>{
  const res=(await student.get('/api/campus/overview').expect(200)).body;
  assert.equal(typeof res.unread,'number');
  assert.ok(res.deadlines.length >= 1);
  assert.equal(res.attendance.present, 1);
  assert.equal(res.attendance.percentage, 100);

  // Mark notice as read
  const noticeId=res.notices[0]._id;
  await student.post(`/api/campus/notices/${noticeId}/read`).expect(200);
  const after=(await student.get('/api/campus/overview').expect(200)).body;
  assert.equal(after.notices.find(n=>n._id===noticeId).read, true);
});

test('notice publishing: Faculty/Admin can publish, Student is forbidden',async()=>{
  await student.post('/api/campus/notices').send({title:'Hacked',kind:'announcement'}).expect(403);

  const published=(await faculty.post('/api/campus/notices').send({
    title:'Midterm Examination Schedule',
    body:'Check department board',
    kind:'announcement',
    audience:'student'
  }).expect(201)).body.notice;
  assert.equal(published.title,'Midterm Examination Schedule');
});

test('profile details: updating department, contact, and avatar photo',async()=>{
  const avatarData='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const updated=(await student.patch('/api/profile/details').send({
    department:'Information Technology',
    contact:'+91 99999 11111',
    avatar:avatarData
  }).expect(200)).body.user;

  assert.equal(updated.department,'Information Technology');
  assert.equal(updated.contact,'+91 99999 11111');
  assert.equal(updated.avatar,avatarData);
});

test('account controls: deactivating and reactivating accounts',async()=>{
  // Deactivate student
  await admin.patch(`/api/admin/accounts/${studentId}/status`).send({active:false}).expect(200);

  // Existing session must be blocked
  await student.get('/api/auth/me').expect(403);

  // Login attempt must be blocked
  await request(app).post('/api/auth/login').send({email:'student@example.com',password}).expect(403);

  // Reactivate student
  await admin.patch(`/api/admin/accounts/${studentId}/status`).send({active:true}).expect(200);

  // Login attempt succeeds again
  await request(app).post('/api/auth/login').send({email:'student@example.com',password}).expect(200);
});

test('excel export for students and faculty separately',async()=>{
  for(const role of ['students','faculty']){
    const res=await admin.get(`/api/admin/export/${role}`).expect(200);
    assert.match(res.headers['content-type'],/spreadsheetml/);
    assert.match(res.headers['content-disposition'],new RegExp(`CDC-${role}.xlsx`));
    assert.ok(Number(res.headers['content-length']) > 100 || res.headers['content-type'].includes('spreadsheetml'));
  }
  // Faculty and anonymous blocked
  await faculty.get('/api/admin/export/students').expect(403);
  await request(app).get('/api/admin/export/students').expect(401);
});

test('CSV student import with validation and preview',async()=>{
  const validCsv="name,email,rollNumber,department,contact,password\n" +
    "Tarun Joshi,tarun.import@example.com,200001,Computer Science,+91 98765 20001,ImportPass123!\n" +
    "Uma Kapoor,uma.import@example.com,200002,Information Technology,+91 98765 20002,ImportPass123!\n";

  // Preview
  const preview=(await admin.post('/api/admin/import-students').send({csv:validCsv,preview:true}).expect(200)).body;
  assert.equal(preview.preview.length, 2);
  assert.equal(preview.ready, true);

  // Execute import
  const result=(await admin.post('/api/admin/import-students').send({csv:validCsv,preview:false}).expect(201)).body;
  assert.equal(result.created, 2);

  // Verify created in DB
  const created=await User.findOne({email:'tarun.import@example.com'});
  assert.equal(created.name,'Tarun Joshi');
  assert.equal(created.rollNumber,'200001');
});

test('password recovery: forgot password dispatch and reset with single-use link',async()=>{
  const forgot=(await request(app).post('/api/recovery/forgot-password').send({email:'admin@example.com'}).expect(200)).body;
  assert.ok(forgot.previewUrl);

  const token=new URL(forgot.previewUrl).searchParams.get('token') || new URLSearchParams(forgot.previewUrl.split('#')[1]).get('token');
  assert.ok(token);

  // Reset password
  const newPass='New-Admin-Pass-99!';
  await request(app).post('/api/recovery/reset-password').send({token,password:newPass}).expect(200);

  // Old password fails, new password works
  await request(app).post('/api/auth/login').send({email:'admin@example.com',password}).expect(401);
  await admin.post('/api/auth/login').send({email:'admin@example.com',password:newPass}).expect(200);

  // Token is single use
  await request(app).post('/api/recovery/reset-password').send({token,password:'AnotherPass123!'}).expect(400);
});

test('faculty CSV import previews safely, enforces Admin, and creates faculty without student identifiers',async()=>{
 const csv='name,email,department,contact,password\nMadhav Sethi,madhav@example.com,Computer Science,12345678,FacultyPass123!\nLeela Khanna,leela@example.com,Physics,23456789,FacultyPass123!';
 await faculty.post('/api/admin/import-faculty').send({csv,preview:true}).expect(403);
 const preview=(await admin.post('/api/admin/import-faculty').send({csv,preview:true}).expect(200)).body;
 assert.equal(preview.ready,true);assert.equal(preview.preview.length,2);assert.equal(preview.preview[0].password,undefined);
 assert.equal(await User.countDocuments({email:'madhav@example.com'}),0);
 const imported=(await admin.post('/api/admin/import-faculty').send({csv,preview:false}).expect(201)).body;
 assert.equal(imported.created,2);
 const saved=await User.findOne({email:'madhav@example.com'}).select('+passwordHash');
 assert.equal(saved.role,'faculty');assert.equal(saved.rollNumber,undefined);assert.equal(saved.studentQrId,undefined);
 assert.ok(await bcrypt.compare('FacultyPass123!',saved.passwordHash));
 const duplicate=(await admin.post('/api/admin/import-faculty').send({csv,preview:true}).expect(200)).body;
 assert.equal(duplicate.ready,false);assert.equal(duplicate.errors.length,2);
 await admin.post('/api/admin/import-faculty').send({csv,preview:false}).expect(400);
});
