import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {chromium} from 'playwright';
import {createServer} from '../../client/node_modules/vite/dist/node/index.js';
import app from '../src/app.js';
import User from '../src/models/User.js';
let mongo,api,vite,browser;
const dir=fileURLToPath(new URL('../test-artifacts/',import.meta.url));
try{
 process.env.JWT_SECRET='isolated-admin-card-test-secret-at-least-32-characters';
 mongo=await MongoMemoryServer.create();await mongoose.connect(mongo.getUri());await User.init();
 const password='Browser-test-42!',passwordHash=await bcrypt.hash(password,4);
 await User.create([{name:'Browser Admin',email:'admin@example.com',role:'admin',passwordHash},{name:'Nikhil Varma',email:'student@example.com',role:'student',rollNumber:'100001',studentQrId:'b013e2bc-9879-459b-9b40-2e221c947615',passwordHash,department:'Computer Science & Engineering',branch:'Computer Science (CSE)',section:'Section A',studyYear:'3rd year (B.Tech)',validPeriod:'2024 – 2028'},{name:'Faculty Example',email:'faculty@example.com',role:'faculty',passwordHash}]);
 api=app.listen(0,'127.0.0.1');await new Promise(resolve=>api.once('listening',resolve));
 const root=fileURLToPath(new URL('../../client/',import.meta.url));process.chdir(root);
 vite=await createServer({root,server:{host:'127.0.0.1',port:0,proxy:{'/api':{target:`http://127.0.0.1:${api.address().port}`,changeOrigin:true}}}});await vite.listen();
 const origin=`http://127.0.0.1:${vite.httpServer.address().port}`;
 browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1440,height:1050}});page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const login=async email=>{await page.goto(origin+'/login');await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();};
 await mkdir(dir,{recursive:true});await login('admin@example.com');await page.waitForURL('**/admin');
 assert.equal(await page.getByRole('button',{name:'Add account',exact:true}).count(),0);
 for(const label of ['Import Student CSV','Import Faculty CSV']){const button=page.getByRole('button',{name:label,exact:true}).first();assert.ok((await button.getAttribute('class')).includes('primary-button'));await button.click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Close dialog',exact:true}).click();}
 await page.locator('.person summary').first().click();await page.getByRole('button',{name:'Delete account',exact:true}).first().click();
 const confirm=page.getByRole('button',{name:'Permanently delete account'});assert.equal(await confirm.isDisabled(),true);await page.getByLabel('Type faculty@example.com to confirm').fill('faculty@example.com');const deletion=page.waitForResponse(r=>r.request().method()==='DELETE');await confirm.click();const deleted=await deletion;assert.equal(deleted.status(),200,await deleted.text());await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByText('Account deleted.',{exact:true}).waitFor();assert.equal(await User.countDocuments({email:'faculty@example.com'}),0);
 await page.getByRole('button',{name:'Logout',exact:true}).click();await login('student@example.com');await page.waitForURL('**/student');
 await page.getByRole('heading',{name:'Student ID card',exact:true}).waitFor();await page.locator('.student-pass').screenshot({path:dir+'/student-digital-pass.png'});
 const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Download ID card',exact:true}).click();const download=await downloadEvent;assert.equal(download.suggestedFilename(),'CDC-100001-ID.png');await download.saveAs(dir+'/student-digital-pass-download.png');
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.student-pass').evaluate(el=>getComputedStyle(el).visibility),'visible');assert.equal(await page.locator('.workspace-header').evaluate(el=>getComputedStyle(el).visibility),'hidden');await page.emulateMedia({media:'screen'});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.student-pass').screenshot({path:dir+'/student-digital-pass-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: both CSV dialogs, green buttons, no Add account, confirmed deletion, student card, PNG download, print isolation, mobile width.');
}finally{await browser?.close();await vite?.close();if(api)await new Promise(resolve=>api.close(resolve));await mongoose.disconnect();await mongo?.stop();}
