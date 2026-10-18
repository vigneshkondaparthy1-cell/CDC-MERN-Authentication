const fs=require('fs');
const file='client/src/Dashboards.jsx';
let s=fs.readFileSync(file,'utf8');
const replace=(a,b)=>{if(!s.includes(a))throw Error('Missing UI target: '+a);s=s.replace(a,b)};
s="import {AccountSettings,AccountActivity,ManageAccount,DownloadQr,PasswordField,generatePassword} from './AccountFeatures';\n"+s;
replace("['students','Students'],['help','Help']","['students','Students'],['activity','Activity'],['help','Help']");
replace("['student-qr','My QR']]:[]),['help','Help']","['student-qr','My QR']]:[]),['settings','Settings'],['help','Help']");
const start=s.indexOf('function CreateAccount('),end=s.indexOf('export function AdminDashboard(');
s=s.slice(0,start)+`function CreateAccount({type,api,onCreated,onClose}) {
 const dialog=useRef(null),student=type==='students';
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[password,setPassword]=useState(''),[roll,setRoll]=useState(''),[suggesting,setSuggesting]=useState(false);
 useEffect(()=>{dialog.current.showModal();let active=true;if(student)api('/admin/next-roll').then(data=>{if(active)setRoll(value=>value||data.rollNumber)}).catch(()=>{});return()=>{active=false}},[student,api]);
 async function suggest(){setSuggesting(true);setError('');try{setRoll((await api('/admin/next-roll')).rollNumber)}catch(e){setError(e.message)}finally{setSuggesting(false)}}
 async function submit(event){event.preventDefault();setBusy(true);setError('');const body={...Object.fromEntries(new FormData(event.currentTarget)),password};try{await api('/admin/'+type,{method:'POST',body});onCreated();onClose()}catch(e){setError(e.message);setBusy(false)}}
 return <dialog className="account-dialog" ref={dialog} onCancel={event=>{event.preventDefault();if(!busy)onClose()}} aria-labelledby="dialog-title"><div className="section-heading"><div><p className="eyebrow">NEW ACCOUNT</p><h2 id="dialog-title">Add {student?'student':'faculty'}</h2></div><button className="icon-button" aria-label="Close account form" disabled={busy} onClick={onClose}><X size={20}/></button></div><form onSubmit={submit}><fieldset disabled={busy}><div className="form-field"><label htmlFor="create-name">Full name</label><input id="create-name" name="name" required minLength={2} maxLength={100}/></div><div className="form-field"><label htmlFor="create-email">Email</label><input id="create-email" name="email" type="email" required/></div>{student&&<div className="form-field"><label htmlFor="create-rollNumber">Roll number</label><input id="create-rollNumber" name="rollNumber" required pattern="[0-9]{6}" minLength={6} maxLength={6} inputMode="numeric" value={roll} onChange={e=>setRoll(e.target.value)}/><div className="roll-helper"><span>Six digits · checked when saved</span><button type="button" className="text-button" disabled={suggesting} onClick={suggest}>{suggesting?'Checking…':'Suggest available'}</button></div></div>}<PasswordField id="create-password" label="Initial password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8}/><button type="button" className="text-button generator" onClick={()=>setPassword(generatePassword())}>Generate password</button>{error&&<p role="alert" className="notice error">{error}</p>}<button disabled={busy} className="primary-button submit-button">{busy?'Creating…':'Create account'}<ArrowUpRight size={17}/></button></fieldset></form></dialog>;
}
`+s.slice(end);
replace("[revision,setRevision]=useState(0);","[revision,setRevision]=useState(0),[management,setManagement]=useState(null);");
const effectStart=s.indexOf('  useEffect(()=>{let active=true;setLoading(true);setError('),effectEnd=s.indexOf('  const filtered=',effectStart);
if(effectStart<0||effectEnd<0)throw Error('Effect not found');
s=s.slice(0,effectStart)+`  useEffect(()=>{let active=true;setLoading(true);async function load(){try{const [faculty,students]=await Promise.all([api('/admin/faculty'),api('/admin/students')]);if(active){setData({faculty:faculty.users,students:students.users});setError('')}}catch(e){if(active)setError(e.message)}finally{if(active)setLoading(false)}}load();const timer=setInterval(()=>{if(document.visibilityState==='visible')load()},15000);return()=>{active=false;clearInterval(timer)}},[revision,api]);
`+s.slice(effectEnd);
replace('{person.rollNumber&&<span>Roll number <strong>{person.rollNumber}</strong></span>}</div>','{person.rollNumber&&<span>Roll number <strong>{person.rollNumber}</strong></span>}<div className="account-actions"><button onClick={()=>setManagement({person,mode:"edit"})}>Edit profile</button><button onClick={()=>setManagement({person,mode:"reset"})}>Reset password</button></div></div>');
replace('</section>{modal&&<CreateAccount','</section><AccountActivity api={api} revision={revision}/>{management&&<ManageAccount person={management.person} mode={management.mode} api={api} onClose={()=>setManagement(null)} onSaved={()=>setRevision(v=>v+1)}/>} {modal&&<CreateAccount');
replace('export function ProfileDashboard({user,logout,student=false})','export function ProfileDashboard({user,logout,student=false,api,onUserUpdated})');
replace('  const timer=useRef();','  const qrRef=useRef(null);\n  const timer=useRef();');
replace('<div className="qr-frame">','<div className="qr-frame" ref={qrRef}>');
replace('<button className="secondary-button" onClick={copyId}>','<div className="qr-actions"><DownloadQr user={user} qrRef={qrRef}/><button className="secondary-button" onClick={copyId}>');
replace("{copied?'Copied!':'Copy identifier'}</button>","{copied?'Copied!':'Copy identifier'}</button></div>");
replace('</aside>}</div></Shell>','</aside>}</div><AccountSettings user={user} api={api} onUserUpdated={onUserUpdated}/></Shell>');
fs.writeFileSync(file,s);
