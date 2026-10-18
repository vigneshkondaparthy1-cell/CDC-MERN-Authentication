import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import {MongoMemoryServer} from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
let mongo,studentId,adminId;
const password='Initial-test-42!',changed='Changed-test-43!';
const admin=request.agent(app),student=request.agent(app),oldSession=request.agent(app),faculty=request.agent(app);
before(async()=>{
 process.env.JWT_SECRET='management-test-secret-with-more-than-32-characters';
 mongo=await MongoMemoryServer.create();await mongoose.connect(mongo.getUri());await User.init();
 const passwordHash=await bcrypt.hash(password,4);
 const users=await User.create([{name:'Admin Test',email:'admin@example.com',role:'admin',passwordHash},{name:'Student Test',email:'student@example.com',role:'student',passwordHash,rollNumber:'100001',studentQrId:'fixed-student-identifier'},{name:'Faculty Test',email:'faculty@example.com',role:'faculty',passwordHash}]);
 [adminId,studentId]=users.map(x=>String(x._id));
 for(const [agent,email] of [[admin,'admin'],[student,'student'],[oldSession,'student'],[faculty,'faculty']])await agent.post('/api/auth/login').send({email:email+'@example.com',password}).expect(200);
},{timeout:180000});
after(async()=>{await mongoose.disconnect();await mongo?.stop()});
test('management endpoints require Admin; suggested rolls are available',async()=>{
 for(const route of ['/api/admin/next-roll','/api/admin/activity']){await request(app).get(route).expect(401);await student.get(route).expect(403);await faculty.get(route).expect(403);}
 await student.patch('/api/admin/accounts/'+studentId).send({name:'Not allowed',email:'x@example.com'}).expect(403);
 await faculty.post('/api/admin/accounts/'+studentId+'/reset-password').send({password:changed,confirm:true}).expect(403);
 assert.equal((await admin.get('/api/admin/next-roll').expect(200)).body.rollNumber,'100002');
});
test('self-service email change verifies password, rejects duplicates and invalidates old sessions',async()=>{
 await student.patch('/api/profile/email').send({email:'new@example.com',currentPassword:'wrong'}).expect(400);
 await student.patch('/api/profile/email').send({email:'faculty@example.com',currentPassword:password}).expect(409);
 await student.patch('/api/profile/email').send({email:'new@example.com',currentPassword:password,userId:adminId}).expect(400);
 const result=await student.patch('/api/profile/email').send({email:'new@example.com',currentPassword:password}).expect(200);
 assert.equal(result.body.user.email,'new@example.com');assert.equal(result.body.user.passwordHash,undefined);
 await student.get('/api/auth/me').expect(200);await oldSession.get('/api/auth/me').expect(401);
 await request(app).post('/api/auth/login').send({email:'student@example.com',password}).expect(401);
});
test('password changes remain hashed and appear as metadata only in Admin activity',async()=>{
 await student.patch('/api/profile/password').send({password:changed,currentPassword:password}).expect(200);
 await request(app).post('/api/auth/login').send({email:'new@example.com',password}).expect(401);
 await request(app).post('/api/auth/login').send({email:'new@example.com',password:changed}).expect(200);
 const activity=(await admin.get('/api/admin/activity').expect(200)).body;
 assert.ok(activity.events.some(x=>x.type==='email_changed'));assert.ok(activity.events.some(x=>x.type==='password_changed'));
 assert.ok(!JSON.stringify(activity).includes(changed));assert.ok(!JSON.stringify(activity).includes('passwordHash'));
 const stored=await User.findById(studentId).select('+passwordHash');assert.ok(await bcrypt.compare(changed,stored.passwordHash));
 assert.equal(stored.studentQrId,'fixed-student-identifier');
 await faculty.patch('/api/profile/password').send({password:'Faculty-changed-43!',currentPassword:password}).expect(200);
});
test('Admin editing preserves identity; password reset needs confirmation and revokes sessions',async()=>{
 await admin.patch('/api/admin/accounts/'+studentId).send({name:'Edited Student',email:'edited@example.com',role:'admin'}).expect(400);
 const edited=(await admin.patch('/api/admin/accounts/'+studentId).send({name:'Edited Student',email:'edited@example.com'}).expect(200)).body.user;
 assert.equal(edited.rollNumber,'100001');assert.equal(edited.studentQrId,'fixed-student-identifier');
 await student.get('/api/auth/me').expect(401);
 await admin.post('/api/admin/accounts/'+studentId+'/reset-password').send({password:'Reset-test-44!'}).expect(400);
 await admin.post('/api/admin/accounts/'+studentId+'/reset-password').send({password:'Reset-test-44!',confirm:true}).expect(200);
 await request(app).post('/api/auth/login').send({email:'edited@example.com',password:changed}).expect(401);
 await request(app).post('/api/auth/login').send({email:'edited@example.com',password:'Reset-test-44!'}).expect(200);
 await admin.patch('/api/admin/accounts/'+adminId).send({name:'Change Admin',email:'changed-admin@example.com'}).expect(404);
 await admin.post('/api/admin/accounts/'+adminId+'/reset-password').send({password:'Reset-test-44!',confirm:true}).expect(404);
});
