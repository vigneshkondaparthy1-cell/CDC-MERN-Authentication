import React,{useRef,useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {GraduationCap,Download,Printer,ShieldCheck} from 'lucide-react';
import './student-card.css';

export default function StudentCard({user}){
 const card=useRef(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const fields=[['BRANCH',user.branch],['SECTION',user.section],['YEAR OF STUDY',user.studyYear],['DEPARTMENT',user.department]];
 const status=user.active===false?'Inactive account':'Active account';
 async function download(){
  setBusy(true);setError('');let qrUrl;
  try{
   const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1120;const ctx=canvas.getContext('2d');
   const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Could not render card image'));img.src=src});
   ctx.fillStyle='#f6f7fb';ctx.fillRect(0,0,1000,1120);
   const g=ctx.createLinearGradient(0,0,1000,220);g.addColorStop(0,'#5030d4');g.addColorStop(1,'#008c9c');ctx.fillStyle=g;ctx.fillRect(0,0,1000,220);
   ctx.textAlign='center';ctx.fillStyle='white';ctx.font='bold 24px sans-serif';ctx.fillText('CAMPUS DIGITAL PASS',500,65);ctx.font='bold 42px sans-serif';ctx.fillText('CDC / STUDENT IDENTITY',500,132);ctx.font='22px sans-serif';ctx.fillText('STUDENT ID CARD',500,180);
   ctx.textAlign='left';ctx.fillStyle='#5636bd';ctx.fillRect(55,270,155,155);
   if(user.avatar)ctx.drawImage(await load(user.avatar),55,270,155,155);else{ctx.fillStyle='white';ctx.font='bold 65px sans-serif';ctx.fillText(user.name.charAt(0),105,372)}
   ctx.fillStyle='#202435';ctx.font='bold 34px sans-serif';ctx.fillText(user.name,245,310,700);ctx.font='26px sans-serif';ctx.fillText(user.rollNumber,245,360);ctx.font='22px sans-serif';ctx.fillText(user.email,245,405,700);
   fields.forEach(([label,value],i)=>{const x=55+(i%2)*475,y=500+Math.floor(i/2)*125;ctx.fillStyle='#687080';ctx.font='bold 18px sans-serif';ctx.fillText(label,x,y);ctx.fillStyle='#202435';ctx.font='bold 26px sans-serif';ctx.fillText(value||'Not set',x,y+42,440)});
   qrUrl=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(card.current.querySelector('svg.student-pass-qr'))],{type:'image/svg+xml'}));
   ctx.drawImage(await load(qrUrl),55,800,210,210);ctx.fillStyle='#687080';ctx.font='18px sans-serif';ctx.fillText('STUDENT IDENTIFIER',300,835);ctx.fillStyle='#202435';ctx.font='20px monospace';ctx.fillText(user.studentQrId,300,875,635);ctx.fillStyle='#16755e';ctx.font='bold 24px sans-serif';ctx.fillText(status,300,920);ctx.fillStyle='#202435';ctx.font='22px sans-serif';ctx.fillText('Valid period: '+(user.validPeriod||'Not set'),300,965,635);
   ctx.fillStyle='#687080';ctx.font='18px sans-serif';ctx.fillText('Campus identity only · QR is not a login credential',55,1070);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Download unavailable');
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CDC-${user.rollNumber}-ID.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){setError(e.message)}finally{if(qrUrl)URL.revokeObjectURL(qrUrl);setBusy(false)}
 }
 return <section id="student-qr" className="student-id-panel"><h2>Student ID card</h2><article ref={card} className="student-pass" aria-label="Student digital ID card"><header className="student-pass-banner"><span><GraduationCap size={20}/> CAMPUS DIGITAL PASS</span><h3>CDC / STUDENT IDENTITY</h3><p>STUDENT ID CARD</p></header><div className="student-pass-content"><div className="student-pass-person"><div className="student-pass-photo">{user.avatar?<img src={user.avatar} alt="Student profile"/>:user.name.charAt(0)}</div><div><h3>{user.name}</h3><span className="student-pass-roll">{user.rollNumber}</span><p>{user.email}</p></div></div><dl className="student-pass-fields">{fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Not set'}</dd></div>)}</dl><div className="student-pass-bottom"><QRCodeSVG className="student-pass-qr" value={user.studentQrId} size={100} level="M" marginSize={2} title="Student identifier QR code"/><div className="student-pass-token"><span>STUDENT IDENTIFIER</span><code>{user.studentQrId}</code><strong><ShieldCheck size={14}/>{status}</strong></div><div className="student-pass-valid"><span>VALID PERIOD</span><strong>{user.validPeriod||'Not set'}</strong><small>Campus identity</small></div></div><p className="student-pass-footnote">QR identifies this student; it is not a login credential.</p></div></article><div className="student-pass-actions"><button className="secondary-button" onClick={()=>window.print()}><Printer size={16}/>Print ID card</button><button className="primary-button" disabled={busy} onClick={download}><Download size={16}/>{busy?'Preparing…':'Download ID card'}</button></div>{error&&<p role="alert" className="notice error">{error}</p>}</section>;
}
