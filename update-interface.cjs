const fs=require('fs');
function edit(file,before,after){const text=fs.readFileSync(file,'utf8');if(!text.includes(before))throw Error('Missing edit target: '+file);fs.writeFileSync(file,text.replace(before,after));}
let app=fs.readFileSync('client/src/App.jsx','utf8');
const start=app.indexOf('function Login()'),end=app.indexOf('function Admin()');
app=app.slice(0,start)+"function Login(){const{user,login}=useAuth();return user?<Navigate to={pathFor(user.role)} replace/>:<LoginPage login={login}/>;}\n"+app.slice(end);
app="import LoginPage from './LoginPage';\n"+app;
fs.writeFileSync('client/src/App.jsx',app);
edit('server/src/routes/admin.js',"z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9-]+$/)","z.string().trim().regex(/^[0-9]{6}$/, 'Roll number must be exactly 6 digits')");
edit('server/src/models/User.js',"rollNumber:{type:String,trim:true,uppercase:true}","rollNumber:{type:String,trim:true,match:[/^[0-9]{6}$/, 'Roll number must be exactly 6 digits'],required:function(){return this.role==='student'}}");
edit('client/src/Dashboards.jsx','function Shell({user, logout, children})','function Shell({user, logout, children, onSection})');
edit('client/src/Dashboards.jsx',"const [error,setError]=useState(''),[busy,setBusy]=useState(false);","const [error,setError]=useState(''),[busy,setBusy]=useState(false),[active,setActive]=useState('overview');\n  const links=user.role==='admin'?[['overview','Overview'],['faculty','Faculty'],['students','Students'],['help','Help']]:[['overview','Overview'],['profile','My profile'],...(user.role==='student'?[['student-qr','My QR']]:[]),['help','Help']];");
edit('client/src/Dashboards.jsx','</header><main className="workspace-main">','</header><nav className="workspace-nav" aria-label="Workspace navigation">{links.map(([id,label])=><a key={id} href={"#"+(["faculty","students"].includes(id)?"directory":id)} aria-current={active===id?"location":undefined} onClick={()=>{setActive(id);onSection?.(id)}}>{label}</a>)}</nav><main id="overview" className="workspace-main">');
edit('client/src/Dashboards.jsx','{children}</main>','{children}<details id="help" className="workspace-help"><summary>Need a hand?</summary><p>{user.role==="admin"?"Use Faculty or Students to browse accounts. Add account creates a login for the selected role. Student roll numbers must contain exactly six digits.":"Your administrator manages your account details. Contact them for profile corrections or login help."}</p>{user.role==="student"&&<p>Your QR contains only your unique student identifier. Use Copy identifier when you need the code as text.</p>}</details></main>');
edit('client/src/Dashboards.jsx',"key==='rollNumber'?3:undefined","key==='rollNumber'?6:undefined");
edit('client/src/Dashboards.jsx',"key==='rollNumber'?30:undefined","key==='rollNumber'?6:undefined");
edit('client/src/Dashboards.jsx',"pattern={key==='rollNumber'?'[A-Za-z0-9-]+':undefined}","pattern={key==='rollNumber'?'[0-9]{6}':undefined} inputMode={key==='rollNumber'?'numeric':undefined} title={key==='rollNumber'?'Enter exactly six digits':undefined} placeholder={key==='rollNumber'?'e.g. 100001':undefined}");
edit('client/src/Dashboards.jsx','return <Shell user={user} logout={logout}><Heading user={user} subtitle="A little overview. Everyone in one place."','return <Shell user={user} logout={logout} onSection={id=>{if(id==="faculty"||id==="students")selectTab(id)}}><Heading user={user} subtitle="A little overview. Everyone in one place."');
edit('client/src/Dashboards.jsx','<section className="directory enter">','<section id="directory" className="directory enter">');
edit('client/src/Dashboards.jsx','<section className="profile-card">','<section id="profile" className="profile-card">');
edit('client/src/Dashboards.jsx','<section className="qr-card">','<section id="student-qr" className="qr-card">');
for(const file of ['server/test/auth.test.js','server/test-ui/smoke.js']){
 let t=fs.readFileSync(file,'utf8').replaceAll('cs-001','100001').replaceAll('CS-001','100001').replaceAll('CS-UI-001','100002').replace("rollNumber:'SAMPLE-'+i","rollNumber:String(200000+i)");
 fs.writeFileSync(file,t);
}
