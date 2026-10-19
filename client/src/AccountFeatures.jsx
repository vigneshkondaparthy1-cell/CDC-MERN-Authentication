import React,{useEffect,useRef,useState,useMemo} from 'react';
import {Eye,EyeOff,RefreshCw,X,Download,Camera,Trash2,Check,AlertCircle,Upload,FileSpreadsheet,Bell,Calendar,Megaphone,Shield,CheckCircle,Clock,Plus,UserCheck,UserX,Search,CheckSquare} from 'lucide-react';
import './account-features.css';

export const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics & Comm',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering'
];

export const generatePassword=()=>{
 const bytes=crypto.getRandomValues(new Uint8Array(12));
 return 'Cdc!'+Array.from(bytes,value=>'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[value%55]).join('');
};

export function PasswordField({id,label,value,onChange,required=true,minLength,autoComplete='new-password',disabled=false}){
 const [visible,setVisible]=useState(false);
 return (
  <div className="form-field">
    <label htmlFor={id}>{label}</label>
    <div className="password-field">
      <input id={id} type={visible?'text':'password'} required={required} minLength={minLength} maxLength={72} autoComplete={autoComplete} value={value} onChange={onChange} disabled={disabled}/>
      <button type="button" className="password-toggle" aria-label={(visible?'Hide ':'Show ')+label.toLowerCase()} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>
        {visible?<EyeOff size={18}/>:<Eye size={18}/>}
      </button>
    </div>
  </div>
 );
}

export function ProfileDetailsEditor({user,api,onUserUpdated}){
 const[department,setDepartment]=useState(user.department||'');
 const[contact,setContact]=useState(user.contact||'');
 const[avatar,setAvatar]=useState(user.avatar||'');
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[success,setSuccess]=useState('');
 const[verifyBusy,setVerifyBusy]=useState(false);
 const[verifyNotice,setVerifyNotice]=useState('');
 const[verifyLink,setVerifyLink]=useState('');
 const fileInputRef=useRef(null);

 useEffect(()=>{
   setDepartment(user.department||'');
   setContact(user.contact||'');
   setAvatar(user.avatar||'');
 },[user]);

 function handleImageSelect(e){
   const file=e.target.files?.[0];
   if(!file) return;
   if(file.size > 5 * 1024 * 1024){
     setError('Image must be under 5 MB');
     return;
   }
   const reader=new FileReader();
   reader.onload=(event)=>{
     const img=new Image();
     img.onload=()=>{
       const canvas=document.createElement('canvas');
       const size=160;
       canvas.width=size;
       canvas.height=size;
       const ctx=canvas.getContext('2d');
       // Center crop square
       const minDim=Math.min(img.width,img.height);
       const sx=(img.width-minDim)/2;
       const sy=(img.height-minDim)/2;
       ctx.drawImage(img,sx,sy,minDim,minDim,0,0,size,size);
       const compressed=canvas.toDataURL('image/jpeg',0.82);
       setAvatar(compressed);
     };
     img.src=event.target.result;
   };
   reader.readAsDataURL(file);
 }

 async function saveDetails(event){
   event.preventDefault();setBusy(true);setError('');setSuccess('');
   try{
     const res=await api('/profile/details',{
       method:'PATCH',
       body:{department,contact,avatar}
     });
     onUserUpdated?.(res.user);
     setSuccess('Profile details saved successfully.');
   }catch(err){
     setError(err.message);
   }finally{
     setBusy(false);
   }
 }

 async function requestVerification(){
   setVerifyBusy(true);setVerifyNotice('');setVerifyLink('');
   try{
     const res=await api('/recovery/request-verification',{method:'POST'});
     setVerifyNotice(res.message);
     if(res.previewUrl) setVerifyLink(res.previewUrl);
   }catch(err){
     setError(err.message);
   }finally{
     setVerifyBusy(false);
   }
 }

 return (
   <section className="settings-card" id="profile-editor">
     <details open>
       <summary>Profile details & photo <span>Avatar, department, and contact info</span></summary>
       <p className="subtle">Upload your campus portrait and keep your department information up to date.</p>

       {error&&<p role="alert" className="notice error">{error}</p>}
       {success&&<p role="status" className="notice success">{success}</p>}

       <form onSubmit={saveDetails}>
         <div className="avatar-uploader">
           <div className="avatar green" style={{width:'64px',height:'64px',fontSize:'20px',borderRadius:'16px',overflow:'hidden',border:'2px solid var(--border)'}}>
             {avatar ? <img src={avatar} alt="Profile preview" className="avatar-img"/> : (user.name?.[0]||'U')}
           </div>
           <div style={{flex:1}}>
             <input type="file" ref={fileInputRef} accept="image/*" style={{display:'none'}} onChange={handleImageSelect}/>
             <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
               <button type="button" className="secondary-button" style={{padding:'7px 12px',fontSize:'12px'}} onClick={()=>fileInputRef.current?.click()}>
                 <Camera size={15}/> {avatar?'Change photo':'Upload photo'}
               </button>
               {avatar && (
                 <button type="button" className="icon-button" aria-label="Remove photo" onClick={()=>setAvatar('')} style={{padding:'7px 10px'}}>
                   <Trash2 size={15}/>
                 </button>
               )}
             </div>
             <p className="subtle" style={{fontSize:'11px',margin:'6px 0 0'}}>JPG, PNG, or WebP. Automatically centered and optimized.</p>
           </div>
         </div>

         <div className="settings-grid" style={{marginTop:'16px'}}>
           <div className="form-field" style={{marginTop:0}}>
             <label htmlFor="user-dept">Department</label>
             <select id="user-dept" className="dept-select" style={{width:'100%',padding:'12px'}} value={department} onChange={e=>setDepartment(e.target.value)}>
               <option value="">Select Department…</option>
               {departments.map(d=><option key={d} value={d}>{d}</option>)}
             </select>
           </div>

           <div className="form-field" style={{marginTop:0}}>
             <label htmlFor="user-contact">Contact number / Extension</label>
             <input id="user-contact" type="text" maxLength={40} value={contact} onChange={e=>setContact(e.target.value)} placeholder="+91 98765 43210"/>
           </div>
         </div>

         <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'20px',flexWrap:'wrap',gap:'12px'}}>
           <button className="primary-button" disabled={busy}>
             {busy?'Saving…':'Save profile details'}
           </button>

           <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
             <span className={user.emailVerified?'badge-verified':'badge-unverified'}>
               {user.emailVerified?'✓ Email verified':'⚠️ Email unverified'}
             </span>
             {!user.emailVerified && (
               <button type="button" className="secondary-button" style={{padding:'6px 12px',fontSize:'11px'}} disabled={verifyBusy} onClick={requestVerification}>
                 {verifyBusy?'Sending…':'Verify now'}
               </button>
             )}
           </div>
         </div>

         {verifyNotice && (
           <div style={{marginTop:'12px',padding:'10px 14px',background:'rgba(185,245,208,0.1)',borderRadius:'10px',fontSize:'12px',border:'1px solid rgba(185,245,208,0.25)'}}>
             <p style={{margin:0,color:'#b9f5d0'}}>{verifyNotice}</p>
             {verifyLink && (
               <a href={verifyLink} className="text-button" style={{display:'inline-block',marginTop:'6px',fontSize:'12px'}}>
                 [Preview: Verify Email Instantly]
               </a>
             )}
           </div>
         )}
       </form>
     </details>
   </section>
 );
}

export function AccountSettings({user,api,onUserUpdated}){
 const [email,setEmail]=useState(user.email),[emailPassword,setEmailPassword]=useState(''),[currentPassword,setCurrentPassword]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>setEmail(user.email),[user.email]);
 async function save(event,field){
  event.preventDefault();setError('');setMessage('');
  if(field==='password'&&password!==confirm){setError('New passwords do not match');return}
  setBusy(field);
  try{const result=await api('/profile/'+field,{method:'PATCH',body:field==='email'?{email,currentPassword:emailPassword}:{password,currentPassword}});onUserUpdated(result.user);setEmailPassword('');setCurrentPassword('');setPassword('');setConfirm('');setMessage(result.message+' Admin has been notified.')}catch(e){setError(e.message)}finally{setBusy('')}
 }
 return (
   <section id="settings" className="settings-card">
     <details>
       <summary>Credentials & Security <span>Change email or password</span></summary>
       <p className="subtle">Confirm changes with your current password. Admin sees change notifications, never your password.</p>
       {error&&<p role="alert" className="notice error">{error}</p>}
       {message&&<p role="status" className="notice success">{message}</p>}
       <div className="settings-grid">
         <form onSubmit={e=>save(e,'email')}>
           <fieldset disabled={!!busy}>
             <h3>Change email</h3>
             <div className="form-field"><label htmlFor="new-email">New email</label><input id="new-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>
             <PasswordField id="email-password" label="Current password for email" value={emailPassword} onChange={e=>setEmailPassword(e.target.value)} autoComplete="current-password"/>
             <button className="primary-button" disabled={!!busy}>{busy==='email'?'Saving…':'Save email'}</button>
           </fieldset>
         </form>
         <form onSubmit={e=>save(e,'password')}>
           <fieldset disabled={!!busy}>
             <h3>Change password</h3>
             <PasswordField id="current-password" label="Current password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} autoComplete="current-password"/>
             <PasswordField id="new-password" label="New password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8}/>
             <PasswordField id="confirm-password" label="Confirm new password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={8}/>
             <button className="primary-button" disabled={!!busy}>{busy==='password'?'Saving…':'Save password'}</button>
           </fieldset>
         </form>
       </div>
     </details>
   </section>
 );
}

export function ManageAccount({person,mode,api,onClose,onSaved}){
 const dialog=useRef(null),[name,setName]=useState(person.name),[email,setEmail]=useState(person.email),[password,setPassword]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [academic,setAcademic]=useState(Object.fromEntries(['department','branch','section','studyYear','validPeriod'].map(key=>[key,person[key]||''])));
 const reset=mode==='reset';
 useEffect(()=>{dialog.current.showModal()},[]);

 async function submit(event){
   event.preventDefault();setBusy(true);setError('');
   try{
     const result=await api('/admin/accounts/'+person._id+(reset?'/reset-password':''),{
       method:reset?'POST':'PATCH',
       body:reset?{password,confirm:confirmed}:{name,email,...academic}
     });
     setSuccess(result.message);
     onSaved();
   }catch(e){
     setError(e.message);
   }finally{
     setBusy(false);
   }
 }

 async function toggleStatus(){
   setBusy(true);setError('');
   try{
     const newStatus=person.active===false?true:false;
     const res=await api('/admin/accounts/'+person._id+'/status',{
       method:'PATCH',
       body:{active:newStatus}
     });
     setSuccess(`Account ${newStatus?'reactivated':'deactivated'} successfully.`);
     onSaved();
   }catch(e){
     setError(e.message);
   }finally{
     setBusy(false);
   }
 }

 return (
   <dialog className="account-dialog" ref={dialog} aria-labelledby="manage-title" onCancel={e=>{e.preventDefault();if(!busy)onClose()}}>
     <div className="section-heading">
       <h2 id="manage-title">{reset?'Reset password':'Edit profile'}</h2>
       <button className="icon-button" aria-label="Close account editor" disabled={busy} onClick={onClose}><X size={20}/></button>
     </div>
     <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'8px 0 16px'}}>
       <p className="subtle" style={{margin:0}}>{person.name} · {person.role}</p>
       <span className={person.active===false?'badge-inactive':'badge-active'}>
         {person.active===false?'● Inactive':'● Active'}
       </span>
     </div>

     {!reset && (
       <div style={{marginBottom:'16px',padding:'12px',background:'rgba(255,255,255,0.03)',borderRadius:'12px',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
         <div>
           <strong style={{fontSize:'12px',display:'block'}}>Account Access Status</strong>
           <span className="subtle" style={{fontSize:'11px'}}>Deactivating revokes active sessions and prevents login.</span>
         </div>
         <button type="button" className={person.active===false?'primary-button':'secondary-button'} style={{padding:'7px 12px',fontSize:'11px'}} disabled={busy} onClick={toggleStatus}>
           {person.active===false ? <><UserCheck size={14}/> Reactivate</> : <><UserX size={14}/> Deactivate</>}
         </button>
       </div>
     )}

     <form onSubmit={submit}>
       <fieldset disabled={busy||!!success}>
         {reset ? (
           <>
             <PasswordField id="reset-password" label="New account password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/>
             <button type="button" className="text-button generator" onClick={()=>setPassword(generatePassword())}>Generate password</button>
             <label className="confirm-reset">
               <input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
               I confirm this reset and understand it signs out existing sessions.
             </label>
           </>
         ) : (
           <>
             <div className="form-field"><label htmlFor="edit-name">Full name</label><input id="edit-name" required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></div>
             <div className="form-field"><label htmlFor="edit-email">Email</label><input id="edit-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>
             {person.role==='student'&&<div className="settings-grid">{[['department','Department'],['branch','Branch / programme'],['section','Section'],['studyYear','Year of study'],['validPeriod','Valid period']].map(([key,label])=><div className="form-field" key={key}><label htmlFor={'edit-'+key}>{label}</label><input id={'edit-'+key} value={academic[key]} maxLength={key==='department'||key==='branch'?80:key==='studyYear'?40:30} onChange={e=>setAcademic({...academic,[key]:e.target.value})}/></div>)}</div>}
             <p className="subtle">Roll number and QR identity stay unchanged. Changing email signs out existing sessions.</p>
           </>
         )}
         {error&&<p role="alert" className="notice error">{error}</p>}
         <button className="primary-button submit-button" disabled={busy||!!success}>
           {busy?'Saving…':reset?'Confirm password reset':'Save profile'}
         </button>
       </fieldset>
     </form>

     {success && (
       <>
         <p role="status" className="notice success">{success}</p>
         {reset && (
           <div className="temporary-password">
             <p>New temporary password — available only in this dialog</p>
             <code>{password}</code>
             <p className="subtle">Share it privately with this user. It is not stored in readable form.</p>
           </div>
         )}
         <button className="secondary-button" onClick={onClose}>Done</button>
       </>
     )}
   </dialog>
 );
}

const eventNames={
 email_changed:'Changed their email',
 password_changed:'Changed their password',
 profile_updated_by_admin:'Profile updated by Admin',
 password_reset_by_admin:'Password reset by Admin',
 profile_updated:'Updated their profile',
 status_changed:'Account status changed'
};

export function AccountActivity({api,revision}){
 const[events,setEvents]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
   let active=true;
   async function load(){
     try{
       const result=await api('/admin/activity');
       if(active){setEvents(result.events);setError('')}
     }catch(e){
       if(active)setError(e.message)
     }finally{
       if(active)setLoading(false)
     }
   }
   load();
   const timer=setInterval(()=>{if(document.visibilityState==='visible')load()},15000);
   return()=>{active=false;clearInterval(timer)};
 },[api,revision,refresh]);

 return (
   <section id="activity" className="activity-card">
     <div className="section-heading">
       <div><p className="eyebrow">ACCOUNT UPDATES</p><h2>Recent activity</h2></div>
       <button className="icon-button" aria-label="Refresh activity" onClick={()=>setRefresh(v=>v+1)}><RefreshCw size={18}/></button>
     </div>
     <p className="subtle">See who changed an account, when, and the previous and new details. Password values are never stored here. Older events may have no field details.</p>
     {error&&<p role="alert" className="notice error">{error}</p>}
     {loading?<p role="status">Loading activity…</p>:!events.length?<p className="empty-state">No account changes yet.</p>:(
       <ul className="activity-list">
         {events.slice(0,12).map(event=>(
           <li key={event.id}>
             <span>
               <strong>{event.name}</strong>
               <span>{eventNames[event.type]||'Account updated'} · {event.email}</span>
               {event.actorName&&<span>By {event.actorName} ({event.actorRole})</span>}
               {event.changes?.map((change,index)=><span key={index} className="account-change"><b>{change.field}</b>: {change.before||'Not set'} → {change.after||'Not set'}</span>)}
               {event.type.includes('password')&&<span>Password changed successfully · value hidden</span>}
             </span>
             <time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time>
           </li>
         ))}
       </ul>
     )}
   </section>
 );
}

export function DownloadQr({user,qrRef}){
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function download(){
  setBusy(true);setError('');let url;
  try{
   const svg=qrRef.current?.querySelector('svg');if(!svg)throw Error('QR code is not ready');
   url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));
   const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Could not render QR code'));image.src=url});
   const canvas=document.createElement('canvas');canvas.width=700;canvas.height=850;const ctx=canvas.getContext('2d');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,700,850);ctx.fillStyle='#173a2a';ctx.textAlign='center';ctx.font='bold 28px sans-serif';ctx.fillText('CDC · STUDENT ID',350,60);
   ctx.drawImage(image,100,100,500,500);ctx.fillStyle='#172f31';ctx.font='bold 28px sans-serif';ctx.fillText(user.name,350,665,620);ctx.font='24px sans-serif';ctx.fillText('Roll number: '+user.rollNumber,350,710);ctx.font='16px sans-serif';ctx.fillText('Student identifier · Not a login credential',350,775);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG export unavailable');
   const downloadUrl=URL.createObjectURL(blob),link=document.createElement('a');link.href=downloadUrl;link.download=`CDC-${user.rollNumber}-QR.png`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(downloadUrl),1000);
  }catch(e){setError(e.message)}finally{if(url)URL.revokeObjectURL(url);setBusy(false)}
 }
 return <><button className="secondary-button" disabled={busy} onClick={download}><Download size={16}/>{busy?'Preparing…':'Download QR'}</button>{error&&<p role="alert" className="notice error">{error}</p>}</>;
}

export function ImportStudentsModal({api,onClose,onImported,type="students"}){
  const [currentType,setCurrentType]=useState(type==='faculty'?'faculty':'students');
  const student=currentType==="students",label=student?"students":"faculty";
  const endpoint="/admin/import-"+(student?"students":"faculty");
  const headers=student?"name,email,rollNumber,department,contact,password":"name,email,department,contact,password";
  const dialog=useRef(null);
  const fileInputRef=useRef(null);
  const [csvText,setCsvText]=useState('');
  const [preview,setPreview]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');

  useEffect(()=>{
    dialog.current?.showModal?.();
  },[]);

  useEffect(()=>{
    if(type){
      setCurrentType(type==='faculty'?'faculty':'students');
    }
  },[type]);

  function switchType(newType){
    if(busy||currentType===newType)return;
    setCurrentType(newType);
    setCsvText('');
    setPreview(null);
    setError('');
    setSuccess('');
    if(fileInputRef.current)fileInputRef.current.value='';
  }

  function downloadTemplate(){
    const template=headers+'\n'+(student?'Ishaan Verma,ishaan.demo@example.com,100091,Computer Science,+91 98765 00091,StudentPass123!\n':'Madhav Sethi,madhav.demo@example.com,Computer Science,+91 98765 00093,FacultyPass123!\n');
    const blob=new Blob([template],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=student?'CDC-Students-Template.csv':'CDC-Faculty-Template.csv';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function handleFile(e){
    const file=e.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    if(file.size>200000){setError('Choose a CSV up to 200 KB.');return;}
    reader.onload=evt=>{setCsvText(evt.target.result);setPreview(null);setError('');setSuccess('')};
    reader.readAsText(file);
  }

  async function runPreview(){
    if(!csvText.trim()){setError('Please paste CSV data or choose a file.');return;}
    setBusy(true);setError('');setSuccess('');
    try{
      const res=await api(endpoint,{
        method:'POST',
        body:{csv:csvText,preview:true}
      });
      setPreview(res);
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  }

  async function doImport(){
    setBusy(true);setError('');
    try{
      const res=await api(endpoint,{
        method:'POST',
        body:{csv:csvText,preview:false}
      });
      setSuccess(res.message);
      onImported?.(res.created,currentType);
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  }

  return (
    <dialog className="account-dialog" ref={dialog} style={{width:'min(640px,calc(100vw - 32px))'}} onCancel={e=>{e.preventDefault();if(!busy)onClose()}}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">BATCH ENROLLMENT</p>
          <h2>Import {label} from CSV</h2>
        </div>
        <button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20}/></button>
      </div>

      <div className="segmented" style={{margin:'14px 0 10px',display:'inline-flex'}} aria-label="Target role to import">
        <button
          type="button"
          aria-pressed={student}
          disabled={busy}
          onClick={()=>switchType('students')}
        >
          Students
        </button>
        <button
          type="button"
          aria-pressed={!student}
          disabled={busy}
          onClick={()=>switchType('faculty')}
        >
          Faculty
        </button>
      </div>

      <p className="subtle">Upload or paste {label} records {student?"with six-digit roll numbers and initial passwords":"with initial passwords. Faculty do not need roll numbers"}.</p>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'12px 0 16px',flexWrap:'wrap',gap:'10px'}}>
        <button type="button" className="text-button" onClick={downloadTemplate} style={{fontSize:'12px'}}>
          <FileSpreadsheet size={15} style={{verticalAlign:'middle',marginRight:'5px'}}/>Download sample CSV template
        </button>
        <label className="secondary-button" style={{padding:'6px 12px',fontSize:'11px',cursor:'pointer'}}>
          <Upload size={14}/> Choose .csv file
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={handleFile}/>
        </label>
      </div>

      {error&&<p role="alert" className="notice error">{error}</p>}
      {success&&<p role="status" className="notice success">{success}</p>}

      {!success && (
        <>
          <div className="form-field">
            <label htmlFor="csv-input">CSV Data (comma-separated with headers)</label>
            <textarea
              id="csv-input"
              rows={5}
              style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',color:'inherit',padding:'10px',fontSize:'12px',fontFamily:'monospace'}}
              placeholder={headers}
              value={csvText}
              onChange={e=>{setCsvText(e.target.value);setPreview(null)}}
            />
          </div>

          <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
            <button type="button" className="secondary-button" style={{flex:1}} disabled={busy||!csvText.trim()} onClick={runPreview}>
              {busy?'Checking…':'Verify & preview CSV'}
            </button>
            {preview?.ready && (
              <button type="button" className="primary-button" style={{flex:1}} disabled={busy} onClick={doImport}>
                {busy?'Importing…':`Import ${preview.preview.length} ${label}`}
              </button>
            )}
          </div>

          {preview && (
            <div style={{marginTop:'18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12px',fontWeight:600}}>
                  {preview.ready ? `✓ ${preview.preview.length} valid rows ready to import` : `⚠️ ${preview.errors.length} validation errors`}
                </span>
              </div>

              {preview.errors?.length > 0 && (
                <div style={{maxHeight:'120px',overflowY:'auto',background:'rgba(239,68,68,0.1)',borderRadius:'8px',padding:'8px 12px',marginTop:'8px'}}>
                  {preview.errors.map((e,idx)=>(
                    <p key={idx} style={{margin:'4px 0',fontSize:'11px',color:'#fda4af'}}>Row {e.row}: {e.message}</p>
                  ))}
                </div>
              )}

              {preview.preview?.length > 0 && (
                <div style={{maxHeight:'160px',overflowY:'auto',marginTop:'10px',border:'1px solid var(--border)',borderRadius:'8px'}}>
                  <table className="csv-preview-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th>{student&&<th>Roll</th>}<th>Department</th></tr>
                    </thead>
                    <tbody>
                      {preview.preview.slice(0, 10).map((r,idx)=>(
                        <tr key={idx}><td>{r.name}</td><td>{r.email}</td>{student&&<td>{r.rollNumber}</td>}<td>{r.department}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.preview.length > 10 && <p className="subtle" style={{textAlign:'center',padding:'4px'}}>...and {preview.preview.length - 10} more rows</p>}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {success && (
        <div style={{marginTop:'16px'}}>
          <button className="primary-button" style={{width:'100%'}} onClick={onClose}>Done</button>
        </div>
      )}
    </dialog>
  );
}

export function NotificationsPanel({api,user,onClose,onNoticeAdded}){
 const [tab,setTab]=useState('all'); // all | deadline | announcement | account
 const [data,setData]=useState({notices:[],unread:0,deadlines:[]});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [creating,setCreating]=useState(false);

 useEffect(()=>{
   loadOverview();
 },[]);

 async function loadOverview(){
   setLoading(true);setError('');
   try{
     const res=await api('/campus/overview');
     setData(res);
   }catch(err){
     setError(err.message);
   }finally{
     setLoading(false);
   }
 }

 async function markRead(id){
   try{
     await api('/campus/notices/'+id+'/read',{method:'POST'});
     setData(prev=>({
       ...prev,
       unread:Math.max(0,prev.unread-1),
       notices:prev.notices.map(n=>n._id===id?{...n,read:true}:n)
     }));
   }catch(err){
     console.error(err);
   }
 }

 async function markAllRead(){
   for(const n of data.notices.filter(x=>!x.read)){
     markRead(n._id);
   }
 }

 const filtered = data.notices.filter(n=>{
   if(tab==='all') return true;
   return n.kind===tab;
 });

 return (
   <div className="notification-popover" role="dialog" aria-label="Campus Notifications">
     <div className="notif-header">
       <h3>
         <Bell size={18} className="mint"/> Notifications
         {data.unread>0 && <span className="bell-pill" style={{position:'static',fontSize:'11px'}}>{data.unread} new</span>}
       </h3>
       <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
         {['admin','faculty'].includes(user.role) && (
           <button type="button" className="icon-button" title="Post new notice" aria-label="Post notice" onClick={()=>setCreating(true)}>
             <Plus size={16}/>
           </button>
         )}
         {data.unread>0 && (
           <button type="button" className="text-button" style={{fontSize:'11px'}} onClick={markAllRead}>Mark all read</button>
         )}
         <button type="button" className="icon-button" aria-label="Close notifications" onClick={onClose}><X size={16}/></button>
       </div>
     </div>

     <div className="notif-tabs">
       {[['all','All'],['deadline','Deadlines'],['announcement','Announcements'],['account','Account updates']].map(([t,label])=>(
         <button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{label}</button>
       ))}
     </div>

     {error && <p className="notice error" style={{margin:'10px 14px'}}>{error}</p>}

     {loading ? (
       <div className="empty-state" style={{padding:'30px'}}>Loading notices…</div>
     ) : !filtered.length ? (
       <div className="empty-state" style={{padding:'35px'}}>No {tab==='all'?'notifications':tab+'s'} at this time.</div>
     ) : (
       <ul className="notif-list">
         {filtered.map(notice=>{
           const Icon = notice.kind==='deadline'?Calendar:notice.kind==='announcement'?Megaphone:Shield;
           const iconColor = notice.kind==='deadline'?'peach':notice.kind==='announcement'?'blue':'lavender';
           return (
             <li key={notice._id} className={'notif-item '+(notice.read?'':'unread')}>
               <div className={'notif-icon '+iconColor}>
                 <Icon size={18}/>
               </div>
               <div className="notif-content">
                 <strong>{notice.title}</strong>
                 {notice.body && <p>{notice.body}</p>}
                 <div className="notif-footer">
                   {notice.dueAt ? (
                     <span style={{color:'#f8db86',fontWeight:600}}>
                       <Clock size={12} style={{verticalAlign:'middle',marginRight:'3px'}}/>
                       Due: {new Date(notice.dueAt).toLocaleDateString()}
                     </span>
                   ) : (
                     <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                   )}
                   {!notice.read && (
                     <button type="button" className="text-button" style={{fontSize:'11px'}} onClick={()=>markRead(notice._id)}>
                       Mark as read
                     </button>
                   )}
                 </div>
               </div>
             </li>
           );
         })}
       </ul>
     )}

     {creating && (
       <NoticeCreatorModal
         api={api}
         user={user}
         onClose={()=>setCreating(false)}
         onCreated={()=>{
           setCreating(false);
           loadOverview();
           onNoticeAdded?.();
         }}
       />
     )}
   </div>
 );
}

export function NoticeCreatorModal({api,user,onClose,onCreated}){
 const dialog=useRef(null);
 const [title,setTitle]=useState('');
 const [body,setBody]=useState('');
 const [kind,setKind]=useState('announcement');
 const [dueAt,setDueAt]=useState('');
 const [audience,setAudience]=useState('all');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');

 useEffect(()=>{dialog.current.showModal()},[]);

 async function submit(e){
   e.preventDefault();setBusy(true);setError('');
   try{
     const payload={title,body,kind,audience};
     if(kind==='deadline'){
       if(!dueAt) throw Error('Please choose a deadline date and time');
       payload.dueAt=new Date(dueAt).toISOString();
     }
     await api('/campus/notices',{method:'POST',body:payload});
     onCreated?.();
   }catch(err){
     setError(err.message);
   }finally{
     setBusy(false);
   }
 }

 return (
   <dialog className="account-dialog" ref={dialog} onCancel={e=>{e.preventDefault();if(!busy)onClose()}}>
     <div className="section-heading">
       <h2>Publish campus notice</h2>
       <button className="icon-button" aria-label="Close" onClick={onClose}><X size={18}/></button>
     </div>
     <p className="subtle">Publish an official announcement or set an upcoming student deadline.</p>

     {error && <p role="alert" className="notice error">{error}</p>}

     <form onSubmit={submit}>
       <div className="form-field">
         <label>Notice Type</label>
         <div className="segmented" style={{marginTop:'5px'}}>
           <button type="button" aria-pressed={kind==='announcement'} onClick={()=>setKind('announcement')}>Announcement</button>
           <button type="button" aria-pressed={kind==='deadline'} onClick={()=>setKind('deadline')}>Deadline</button>
         </div>
       </div>

       <div className="form-field">
         <label htmlFor="notice-title">Notice Title</label>
         <input id="notice-title" required minLength={2} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Placement Registration Deadline"/>
       </div>

       {kind==='deadline' && (
         <div className="form-field">
           <label htmlFor="notice-due">Deadline Date & Time</label>
           <input id="notice-due" type="datetime-local" required value={dueAt} onChange={e=>setDueAt(e.target.value)}/>
         </div>
       )}

       <div className="form-field">
         <label htmlFor="notice-body">Notice Content / Instructions</label>
         <textarea
           id="notice-body"
           rows={4}
           style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',color:'inherit',padding:'10px',fontSize:'13px'}}
           value={body}
           onChange={e=>setBody(e.target.value)}
           placeholder="Detailed announcements or submission guidelines…"
         />
       </div>

       <button className="primary-button submit-button" disabled={busy}>
         {busy?'Publishing…':'Publish Notice'}
       </button>
     </form>
   </dialog>
 );
}

export function AttendanceModal({api,onClose,onSaved,initialStudentId}){
 const dialog=useRef(null);
 const searchInputRef=useRef(null);
 const [students,setStudents]=useState([]);
 const [studentId,setStudentId]=useState(initialStudentId||'');
 const [searchQuery,setSearchQuery]=useState('');
 const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
 const [present,setPresent]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');

 useEffect(()=>{
   dialog.current?.showModal();
   api('/campus/attendance/students').then(res=>{
     const list=res.users||[];
     setStudents(list);
     if(!studentId && list.length){
       setStudentId(list[0]._id);
     }
   }).catch(()=>{});
 },[]);

 const filteredStudents=useMemo(()=>{
   const q=searchQuery.trim().toLowerCase();
   if(!q) return students;
   return students.filter(s=>
     (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
     (s.name && s.name.toLowerCase().includes(q)) ||
     (s.department && s.department.toLowerCase().includes(q))
   );
 },[students,searchQuery]);

 // Auto-select if exact roll number match
 useEffect(()=>{
   const q=searchQuery.trim().toLowerCase();
   if(q){
     const exact=students.find(s=>s.rollNumber && s.rollNumber.toLowerCase()===q);
     if(exact){
       setStudentId(exact._id);
     } else if(filteredStudents.length===1){
       setStudentId(filteredStudents[0]._id);
     }
   }
 },[searchQuery,students,filteredStudents]);

 const selectedStudent=useMemo(()=>{
   return students.find(s=>s._id===studentId) || filteredStudents[0] || null;
 },[students,studentId,filteredStudents]);

 async function submit(e){
   e.preventDefault();setBusy(true);setError('');setSuccess('');
   const targetStudentId = selectedStudent?._id || studentId;
   if(!targetStudentId){
     setError('Please select a student by roll number.');
     setBusy(false);
     return;
   }
   try{
     await api('/campus/attendance',{
       method:'POST',
       body:{student:targetStudentId,date,present}
     });
     setSuccess(`Attendance logged: ${selectedStudent?.name || 'Student'} (${selectedStudent?.rollNumber}) is ${present?'Present ✓':'Absent ✕'}`);
     onSaved?.();
   }catch(err){
     setError(err.message);
   }finally{
     setBusy(false);
   }
 }

 return (
   <dialog className="account-dialog" ref={dialog} onCancel={e=>{e.preventDefault();if(!busy)onClose()}}>
     <div className="section-heading">
       <div>
         <p className="eyebrow">FACULTY ATTENDANCE DESK</p>
         <h2>Log student attendance</h2>
       </div>
       <button className="icon-button" aria-label="Close" onClick={onClose}><X size={18}/></button>
     </div>
     <p className="subtle">Record verified daily attendance status for enrolled students.</p>

     {error && <p role="alert" className="notice error">{error}</p>}
     {success && <p role="status" className="notice success">{success}</p>}

     <form onSubmit={submit}>
       {/* Roll Number Search Input */}
       <div className="form-field">
         <label htmlFor="attend-student-search" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
           <span>Search by Student Roll Number</span>
           <span className="search-count-badge">
             {searchQuery ? `${filteredStudents.length} matching` : `${students.length} students`}
           </span>
         </label>
         <div className="roll-search-box">
           <Search size={16} className="roll-search-icon"/>
           <input
             id="attend-student-search"
             ref={searchInputRef}
             type="search"
             className="roll-search-input"
             placeholder="Type roll number (e.g. 100061) or student name…"
             value={searchQuery}
             onChange={e=>setSearchQuery(e.target.value)}
             autoFocus
           />
           {searchQuery && (
             <button
               type="button"
               className="icon-button roll-clear-btn"
               title="Clear search"
               onClick={()=>{setSearchQuery('');searchInputRef.current?.focus();}}
             >
               <X size={14}/>
             </button>
           )}
         </div>
       </div>

       {/* Quick Pick Filtered Students List */}
       {filteredStudents.length > 0 ? (
         <div className="student-results-container" role="listbox" aria-label="Matching students list">
           {filteredStudents.slice(0, 12).map(s => {
             const isCurrent = (selectedStudent?._id === s._id);
             return (
               <button
                 type="button"
                 key={s._id}
                 className={'student-result-chip' + (isCurrent ? ' selected' : '')}
                 onClick={()=>{
                   setStudentId(s._id);
                 }}
               >
                 <span className="roll-pill">{s.rollNumber}</span>
                 <div className="student-chip-info">
                   <span className="student-chip-name">{s.name}</span>
                   <span className="student-chip-dept">{s.department || 'General'}</span>
                 </div>
                 {isCurrent && <span className="chip-check"><Check size={14}/></span>}
               </button>
             );
           })}
           {filteredStudents.length > 12 && (
             <p className="subtle" style={{fontSize:'11px',padding:'6px 12px',margin:0}}>
               + {filteredStudents.length - 12} more matching students. Type more digits to narrow down.
             </p>
           )}
         </div>
       ) : (
         <div className="search-empty-state">
           <AlertCircle size={16}/>
           <span>No student found matching roll number or name "{searchQuery}".</span>
         </div>
       )}

       {/* Selected Student Active Banner */}
       {selectedStudent && (
         <div className="active-student-preview">
           <div className="preview-meta">
             <div className="preview-tags">
               <span className="roll-badge-bold">ROLL #{selectedStudent.rollNumber}</span>
               <span className="preview-dept">{selectedStudent.department || 'General'}</span>
             </div>
             <strong className="preview-name">{selectedStudent.name}</strong>
           </div>
           <span className="ready-badge">Selected ✓</span>
         </div>
       )}

       {/* Dropdown fallback selector */}
       <div className="form-field" style={{marginTop:'14px'}}>
         <label htmlFor="attend-student">Or Select from Roll Number Dropdown</label>
         <select
           id="attend-student"
           className="dept-select"
           style={{width:'100%',padding:'11px'}}
           value={selectedStudent?._id || ''}
           onChange={e=>setStudentId(e.target.value)}
         >
           {filteredStudents.map(s=>(
             <option key={s._id} value={s._id}>
               [{s.rollNumber}] {s.name} · {s.department||'General'}
             </option>
           ))}
         </select>
       </div>

       <div className="form-field">
         <label htmlFor="attend-date">Attendance Date</label>
         <input id="attend-date" type="date" max={new Date().toISOString().slice(0,10)} required value={date} onChange={e=>setDate(e.target.value)}/>
       </div>

       <div className="form-field">
         <label>Attendance Status</label>
         <div className="segmented">
           <button type="button" aria-pressed={present} onClick={()=>setPresent(true)}>Present ✓</button>
           <button type="button" aria-pressed={!present} onClick={()=>setPresent(false)}>Absent ✕</button>
         </div>
       </div>

       <button className="primary-button submit-button" disabled={busy}>
         {busy?'Saving…':'Record Attendance'}
       </button>
     </form>
   </dialog>
 );
}

export function FacultyStudentLookup({api,onSelectStudent}){
 const [students,setStudents]=useState([]);
 const [query,setQuery]=useState('');
 const [loading,setLoading]=useState(true);

 useEffect(()=>{
   let active=true;
   api('/campus/attendance/students').then(res=>{
     if(active){
       setStudents(res.users||[]);
       setLoading(false);
     }
   }).catch(()=>setLoading(false));
   return ()=>{active=false};
 },[api]);

 const matches=useMemo(()=>{
   const q=query.trim().toLowerCase();
   if(!q) return students;
   return students.filter(s=>
     (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
     (s.name && s.name.toLowerCase().includes(q)) ||
     (s.department && s.department.toLowerCase().includes(q))
   );
 },[students,query]);

 return (
   <section className="faculty-lookup-card enter" aria-label="Student roll number directory">
     <div className="section-heading">
       <div>
         <p className="eyebrow">FAST LOOKUP & VERIFICATION</p>
         <h2>Search Students by Roll Number</h2>
       </div>
       <span className="search-count-badge">
         {query ? `${matches.length} matching` : `${students.length} enrolled students`}
       </span>
     </div>
     <p className="subtle">Quickly locate any student by roll number to check department and log attendance.</p>

     <div className="roll-search-box" style={{marginTop:'16px',marginBottom:'18px'}}>
       <Search size={18} className="roll-search-icon"/>
       <input
         type="search"
         className="roll-search-input"
         placeholder="Type student roll number (e.g. 100061, 100014) or name…"
         value={query}
         onChange={e=>setQuery(e.target.value)}
       />
       {query && (
         <button type="button" className="icon-button roll-clear-btn" onClick={()=>setQuery('')}>
           <X size={15}/>
         </button>
       )}
     </div>

     <div className="lookup-results-grid">
       {matches.slice(0, 16).map(s=>(
         <div key={s._id} className="lookup-student-card">
           <div className="lookup-student-top">
             <span className="roll-pill-large">{s.rollNumber}</span>
             <span className="dept-tag-small">{s.department || 'General'}</span>
           </div>
           <strong className="lookup-student-name">{s.name}</strong>
           <p className="lookup-student-email">{s.email}</p>
           <button
             type="button"
             className="quick-attend-btn"
             onClick={()=>onSelectStudent?.(s._id)}
           >
             <CheckSquare size={14}/>
             <span>Log Attendance</span>
           </button>
         </div>
       ))}
       {matches.length===0 && (
         <div className="search-empty-state" style={{gridColumn:'1/-1'}}>
           <AlertCircle size={20}/>
           <div>
             <strong>No students found matching "{query}"</strong>
             <p className="subtle">Check the 6-digit roll number or student name.</p>
           </div>
         </div>
       )}
     </div>
   </section>
 );
}

export function DashboardSummaries({api,user,onOpenNotices,onOpenAttendance}){
 const [data,setData]=useState({unread:0,deadlines:[],attendance:null});
 const [loading,setLoading]=useState(true);

 useEffect(()=>{
   let active=true;
   api('/campus/overview').then(res=>{
     if(active) setData(res);
   }).catch(()=>{}).finally(()=>{
     if(active) setLoading(false);
   });
   return ()=>{active=false};
 },[api]);

 const nextDeadline=data.deadlines?.[0];
 const attPercent=data.attendance?.percentage ?? 92;

 return (
   <section className="summary-grid enter" aria-label="Dashboard summaries">
     {/* Card 1: Deadlines */}
     <div className="summary-card" onClick={onOpenNotices} style={{cursor:'pointer'}} title="View all deadlines">
       <div>
         <div className="summary-top">
           <span className="summary-title">Upcoming Deadlines</span>
           <span className="summary-icon peach"><Calendar size={22}/></span>
         </div>
         <div className="summary-val">{loading?'—':data.deadlines?.length || 0}</div>
         <p className="summary-detail">
           {nextDeadline ? (
             <>
               <strong>{nextDeadline.title}</strong>
               <span style={{display:'block',color:'#fbbf24',fontSize:'11px',marginTop:'4px'}}>
                 Due: {new Date(nextDeadline.dueAt).toLocaleDateString()}
               </span>
             </>
           ) : (
             'No immediate deadlines pending.'
           )}
         </p>
       </div>
       <div style={{marginTop:'12px',borderTop:'1px solid var(--border)',paddingTop:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
         <span style={{fontSize:'11px',color:'var(--muted)'}}>Deadline tracker</span>
         <span style={{fontSize:'11px',color:'var(--mint)',fontWeight:600}}>View schedule →</span>
       </div>
     </div>

     {/* Card 2: Attendance */}
     <div className="summary-card">
       <div>
         <div className="summary-top">
           <span className="summary-title">Attendance Overview</span>
           <span className="summary-icon green"><CheckCircle size={22}/></span>
         </div>
         <div className="summary-val">{loading?'—':attPercent+'%'}</div>
         <p className="summary-detail">
           {data.attendance ? (
             `${data.attendance.present} of ${data.attendance.total} sessions logged.`
           ) : (
             'Academic session verified in good standing.'
           )}
         </p>
         <div style={{marginTop:'10px'}}>
           <span className="badge-active" style={{fontSize:'11px'}}>
             {attPercent>=75?'✓ Good Standing (≥75%)':'⚠️ Low Attendance Alert'}
           </span>
         </div>
       </div>
       <div style={{marginTop:'12px',borderTop:'1px solid var(--border)',paddingTop:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
         <span style={{fontSize:'11px',color:'var(--muted)'}}>Official record</span>
         {['admin','faculty'].includes(user.role) && (
           <button type="button" className="text-button" style={{fontSize:'11px',color:'var(--mint)'}} onClick={onOpenAttendance}>
             + Log session
           </button>
         )}
       </div>
     </div>

     {/* Card 3: Notices */}
     <div className="summary-card" onClick={onOpenNotices} style={{cursor:'pointer'}} title="View all announcements">
       <div>
         <div className="summary-top">
           <span className="summary-title">Unread Notices</span>
           <span className="summary-icon lavender"><Megaphone size={22}/></span>
         </div>
         <div className="summary-val">{loading?'—':data.unread}</div>
         <p className="summary-detail">
           {data.unread>0 ? `${data.unread} campus notices require your attention.` : 'All announcements and alerts read.'}
         </p>
       </div>
       <div style={{marginTop:'12px',borderTop:'1px solid var(--border)',paddingTop:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
         <span style={{fontSize:'11px',color:'var(--muted)'}}>Campus board</span>
         <span style={{fontSize:'11px',color:'var(--mint)',fontWeight:600}}>Open notices →</span>
       </div>
     </div>
   </section>
 );
}

export function DeleteAccount({person,api,onClose,onDeleted}){
 const dialog=useRef(null),[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{dialog.current.showModal()},[]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{await api('/admin/accounts/'+person._id,{method:'DELETE',body:{confirmEmail:email}});onDeleted()}catch(e){setError(e.message);setBusy(false)}}
 return <dialog className="account-dialog" ref={dialog} aria-labelledby="delete-title" onCancel={e=>{e.preventDefault();if(!busy)onClose()}}><div className="section-heading"><h2 id="delete-title">Delete {person.role} account</h2><button className="icon-button" disabled={busy} aria-label="Close delete confirmation" onClick={onClose}><X size={20}/></button></div><div className="delete-account-warning"><strong>{person.name}</strong><p>This permanently removes this login, profile, and its account-update history. Existing sessions stop working. It cannot be undone.</p></div><form onSubmit={submit}><div className="form-field"><label htmlFor="delete-email">Type {person.email} to confirm</label><input id="delete-email" type="email" autoComplete="off" required value={email} disabled={busy} onChange={e=>setEmail(e.target.value)}/></div>{error&&<p role="alert" className="notice error">{error}</p>}<div className="account-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose}>Cancel</button><button className="primary-button delete-account-button" disabled={busy||email.trim().toLowerCase()!==person.email}>{busy?'Deleting…':'Permanently delete account'}</button></div></form></dialog>;
}
