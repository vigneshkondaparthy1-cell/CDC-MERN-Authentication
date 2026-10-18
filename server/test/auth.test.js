import {before, after, test} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import request from 'supertest';
import {MongoMemoryServer} from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

let mongo;
const admin=request.agent(app);
const password='Development-test-42!';
before(async()=>{
 process.env.JWT_SECRET='isolated-test-secret-with-more-than-32-characters';
 mongo=await MongoMemoryServer.create();
 await mongoose.connect(mongo.getUri());
 await User.init();
 const env={...process.env,MONGO_URI:mongo.getUri(),ADMIN_NAME:'Test Admin',ADMIN_EMAIL:'admin@example.com',ADMIN_PASSWORD:password};
 await promisify(execFile)(process.execPath,['src/scripts/seedAdmin.js'],{env});
}, {timeout:180000});
after(async()=>{await mongoose.disconnect();await mongo?.stop();});

test('seeding again preserves the existing Admin password',async()=>{
 const before=await User.findOne({email:'admin@example.com'}).select('+passwordHash');
 await promisify(execFile)(process.execPath,['src/scripts/seedAdmin.js'],{env:{...process.env,MONGO_URI:mongo.getUri(),ADMIN_EMAIL:'admin@example.com',ADMIN_PASSWORD:'Different-test-password-42!'}});
 const after=await User.findOne({email:'admin@example.com'}).select('+passwordHash');
 assert.equal(after.passwordHash,before.passwordHash);assert.equal(await User.countDocuments(),1);
});

test('health, input errors and anonymous authorization',async()=>{
 assert.deepEqual((await request(app).get('/api/health').expect(200)).body,{status:'ok'});
 for(const path of ['/api/auth/me','/api/profile/me','/api/admin/students','/api/admin/faculty'])await request(app).get(path).expect(401);
 await request(app).post('/api/auth/login').send({email:'bad'}).expect(400);
 await request(app).post('/api/auth/login').send({email:'admin@example.com',password:'wrong'}).expect(401);
 await request(app).post('/api/auth/login').set('Content-Type','application/json').send('{').expect(400);
 await request(app).post('/api/auth/login').send({text:'x'.repeat(40000)}).expect(413);
 await request(app).get('/api/missing').expect(404);
});

test('admin session, account creation, validation, uniqueness and password protection',async()=>{
 const login=await admin.post('/api/auth/login').send({email:' ADMIN@example.com ',password}).expect(200);
 assert.equal(login.body.user.role,'admin');
 assert.equal(login.body.user.passwordHash,undefined);
 assert.match(login.headers['set-cookie'][0],/HttpOnly/);
 assert.match(login.headers['set-cookie'][0],/SameSite=Lax/);
 await admin.get('/api/auth/me').expect(200);
 await admin.post('/api/admin/students').send({name:'Student Test',email:'student@example.com',password,rollNumber:'100001'}).expect(201);
 await admin.post('/api/admin/faculty').send({name:'Faculty Test',email:'faculty@example.com',password}).expect(201);
 await admin.post('/api/admin/faculty').send({name:'Duplicate Test',email:'STUDENT@example.com',password}).expect(409);
 await admin.post('/api/admin/students').send({name:'Duplicate Roll',email:'another@example.com',password,rollNumber:'100001'}).expect(409);
 await admin.post('/api/admin/students').send({name:'Bad Roll',email:'bad@example.com',password,rollNumber:'!'}).expect(400);
 await admin.post('/api/admin/faculty').send({name:'Bad Password',email:'bad@example.com',password:'short'}).expect(400);
 const students=(await admin.get('/api/admin/students').expect(200)).body.users;
 const faculty=(await admin.get('/api/admin/faculty').expect(200)).body.users;
 assert.equal(students.length,1);assert.equal(faculty.length,1);
 assert.equal(students[0].rollNumber,'100001');
 assert.match(students[0].studentQrId,/^[0-9a-f-]{36}$/);
 for(const user of [...students,...faculty])assert.equal(user.passwordHash,undefined);
 const stored=await User.findOne({email:'student@example.com'}).select('+passwordHash');
 assert.notEqual(stored.passwordHash,password);assert.ok(await bcrypt.compare(password,stored.passwordHash));
});

test('faculty and student self-profile, role restrictions, QR stability and logout',async()=>{
 for(const role of ['faculty','student']){
  const session=request.agent(app);
  const credentials={email:role+'@example.com',password};
  const first=(await session.post('/api/auth/login').send(credentials).expect(200)).body.user;
  const profile=(await session.get('/api/profile/me?userId=someone-else').expect(200)).body.user;
  assert.equal(profile._id,first._id);assert.equal(profile.role,role);
  await session.get('/api/auth/me').expect(200);
  for(const resource of ['faculty','students']){
   await session.get('/api/admin/'+resource).expect(403);
   await session.post('/api/admin/'+resource).send({}).expect(403);
  }
  await session.post('/api/auth/logout').expect(200);
  await session.get('/api/auth/me').expect(401);
  const second=(await session.post('/api/auth/login').send(credentials).expect(200)).body.user;
  assert.equal(second.studentQrId,first.studentQrId);
 }
});

test('invalid, expired and deleted-user sessions are rejected',async()=>{
 const secret=process.env.JWT_SECRET;
 const tokens=['bad-token',jwt.sign({sub:'bad-id'},secret),jwt.sign({sub:new mongoose.Types.ObjectId().toString()},secret),jwt.sign({sub:new mongoose.Types.ObjectId().toString()},secret,{expiresIn:-1})];
 for(const token of tokens)await request(app).get('/api/auth/me').set('Cookie','cdc_token='+token).expect(401);
});
