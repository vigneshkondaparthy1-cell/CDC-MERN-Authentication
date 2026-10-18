import {CampusObjects} from './Appearance';
import React,{useEffect,useState} from 'react';
import {Eye,EyeOff,GraduationCap,ArrowRight,ShieldCheck,BookOpen,QrCode,KeyRound,CheckCircle,ArrowLeft,MailCheck} from 'lucide-react';
import {api} from './api';

export default function LoginPage({login,sessionMessage}){
 const[view,setView]=useState('login'); // 'login' | 'forgot' | 'reset' | 'verify'
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const[resetToken,setResetToken]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState('');
 const[previewLink,setPreviewLink]=useState('');

 useEffect(()=>{
   const hash=window.location.hash||'';
   const search=window.location.search||'';
   const params=new URLSearchParams(hash.replace(/^#\/?/, '').replace(/^\?/, '') || search);
   const token=params.get('token');

   if(hash.includes('reset-password') || window.location.pathname.includes('reset-password')){
     setView('reset');
     if(token) setResetToken(token);
   } else if(hash.includes('verify-email') || window.location.pathname.includes('verify-email')){
     setView('verify');
     if(token) autoVerify(token);
   }
 },[]);

 async function autoVerify(token){
   setBusy(true);setError('');setNotice('');
   try{
     const res=await api('/recovery/verify-email',{method:'POST',body:{token}});
     setNotice(res.message || 'Email verified successfully! You can now use password recovery.');
   }catch(e){
     setError(e.message);
   }finally{
     setBusy(false);
   }
 }

 async function handleLogin(event){
   event.preventDefault();setBusy(true);setError('');setNotice('');
   try{
     await login(email,password);
   }catch(e){
     setError(e.message);
   }finally{
     setBusy(false);
   }
 }

 async function handleForgotPassword(event){
   event.preventDefault();setBusy(true);setError('');setNotice('');setPreviewLink('');
   try{
     const res=await api('/recovery/forgot-password',{method:'POST',body:{email}});
     setNotice(res.message);
     if(res.previewUrl){
       setPreviewLink(res.previewUrl);
     }
   }catch(e){
     setError(e.message);
   }finally{
     setBusy(false);
   }
 }

 async function handleResetPassword(event){
   event.preventDefault();
   if(newPassword!==confirmPassword){
     setError('Passwords do not match');
     return;
   }
   setBusy(true);setError('');setNotice('');
   try{
     const res=await api('/recovery/reset-password',{method:'POST',body:{token:resetToken,password:newPassword}});
     setNotice(res.message);
     setNewPassword('');setConfirmPassword('');
   }catch(e){
     setError(e.message);
   }finally{
     setBusy(false);
   }
 }

 return (
   <main className="login-scene" id="overview">
     <div className="login-glow glow-a"/>
     <div className="login-glow glow-b"/>
     <div className="login-layout">
       <section className="login-intro">
         <div className="brand">
           <span className="brand-symbol"><GraduationCap size={26}/></span>
           <span>CDC / Portal</span>
         </div>
         <p className="eyebrow">YOUR CAMPUS. CONNECTED.</p>
         <h1>A small space. <br/>A world of <br/><span>possibilities.</span></h1>
         <p className="subtle">Your profile, your people, your campus identity.</p>
         <div className="login-features">
           <span><ShieldCheck size={16}/>Admin</span>
           <span><BookOpen size={16}/>Faculty</span>
           <span><QrCode size={16}/>Student</span>
         </div>
         <CampusObjects/>
       </section>

       <section className="login-card">
         {view==='login' && (
           <>
             <span className="login-badge">WELCOME BACK</span>
             <h2>Make yourself<br/>at home.</h2>
             <p className="subtle">Sign in to your workspace.</p>
             {sessionMessage&&<p role="status" className="notice error">{sessionMessage}</p>}
             {notice&&<p role="status" className="notice success">{notice}</p>}
             {error&&<p role="alert" className="notice error">{error}</p>}
             <form onSubmit={handleLogin}>
               <label htmlFor="login-email">Email address</label>
               <input id="login-email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
               
               <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:'20px'}}>
                 <label htmlFor="login-password" style={{margin:0}}>Password</label>
                 <button type="button" className="text-button" style={{fontSize:'12px',color:'#9ba7b8'}} onClick={()=>{setView('forgot');setError('');setNotice('')}}>Forgot password?</button>
               </div>
               
               <div className="password-field">
                 <input id="login-password" type={visible?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/>
                 <button type="button" className="password-toggle" aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} aria-controls="login-password" onClick={()=>setVisible(v=>!v)}>
                   {visible?<EyeOff size={19}/>:<Eye size={19}/>}
                 </button>
               </div>

               <button className="primary-button login-submit" disabled={busy}>
                 {busy?'Signing in…':'Sign in'}<ArrowRight size={18}/>
               </button>
             </form>
             <p className="login-footnote">Need an account? Contact your administrator.</p>
           </>
         )}

         {view==='forgot' && (
           <>
             <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
               <button type="button" className="icon-button" aria-label="Back to login" onClick={()=>{setView('login');setError('');setNotice('')}}>
                 <ArrowLeft size={16}/>
               </button>
               <span className="login-badge">PASSWORD RECOVERY</span>
             </div>
             <h2>Recover your<br/>account.</h2>
             <p className="subtle">We'll send a single-use expiring reset link to your verified email address.</p>
             
             {notice&&<p role="status" className="notice success">{notice}</p>}
             {error&&<p role="alert" className="notice error">{error}</p>}

             {previewLink && (
               <div style={{margin:'16px 0',padding:'14px',background:'rgba(185,245,208,0.12)',border:'1px solid rgba(185,245,208,0.3)',borderRadius:'12px'}}>
                 <p style={{fontSize:'12px',margin:'0 0 8px',color:'#b9f5d0',fontWeight:600}}>Development preview link generated:</p>
                 <button type="button" className="primary-button" style={{fontSize:'12px',padding:'8px 14px',width:'100%'}} onClick={()=>{
                   const hashParts=previewLink.split('#')[1]||'';
                   const params=new URLSearchParams(hashParts);
                   setResetToken(params.get('token')||'');
                   setView('reset');
                   setNotice('Token loaded from preview. Enter your new password below.');
                 }}>
                   Open Password Reset Form <KeyRound size={15}/>
                 </button>
               </div>
             )}

             <form onSubmit={handleForgotPassword}>
               <label htmlFor="forgot-email">Account email address</label>
               <input id="forgot-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="registered@example.com"/>
               
               <button className="primary-button login-submit" disabled={busy}>
                 {busy?'Sending link…':'Send recovery link'}<ArrowRight size={18}/>
               </button>
             </form>
             <p className="login-footnote">
               Remembered your credentials? <button type="button" className="text-button" onClick={()=>{setView('login');setError('');setNotice('')}}>Return to sign in</button>
             </p>
           </>
         )}

         {view==='reset' && (
           <>
             <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
               <button type="button" className="icon-button" aria-label="Back to login" onClick={()=>{setView('login');setError('');setNotice('')}}>
                 <ArrowLeft size={16}/>
               </button>
               <span className="login-badge">SECURE RESET</span>
             </div>
             <h2>Create new<br/>password.</h2>
             <p className="subtle">Enter your recovery token and pick a strong password of at least 8 characters.</p>

             {notice&&<p role="status" className="notice success">{notice}</p>}
             {error&&<p role="alert" className="notice error">{error}</p>}

             <form onSubmit={handleResetPassword}>
               <label htmlFor="reset-token">Security token</label>
               <input id="reset-token" required value={resetToken} onChange={e=>setResetToken(e.target.value)} placeholder="64-character token from reset link"/>

               <label htmlFor="new-pass">New password</label>
               <div className="password-field">
                 <input id="new-pass" type={visible?'text':'password'} required minLength={8} maxLength={72} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Minimum 8 characters"/>
                 <button type="button" className="password-toggle" aria-label={visible?'Hide password':'Show password'} onClick={()=>setVisible(v=>!v)}>
                   {visible?<EyeOff size={19}/>:<Eye size={19}/>}
                 </button>
               </div>

               <label htmlFor="confirm-pass">Confirm new password</label>
               <input id="confirm-pass" type={visible?'text':'password'} required minLength={8} maxLength={72} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm password"/>

               <button className="primary-button login-submit" disabled={busy}>
                 {busy?'Saving…':'Update password'}<CheckCircle size={18}/>
               </button>
             </form>
             <p className="login-footnote">
               <button type="button" className="text-button" onClick={()=>{setView('login');setError('');setNotice('')}}>Back to Sign In</button>
             </p>
           </>
         )}

         {view==='verify' && (
           <>
             <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
               <button type="button" className="icon-button" aria-label="Back to login" onClick={()=>{setView('login');setError('');setNotice('')}}>
                 <ArrowLeft size={16}/>
               </button>
               <span className="login-badge">EMAIL VERIFICATION</span>
             </div>
             <h2>Verify your<br/>CDC email.</h2>
             <p className="subtle">Verification confirms your identity and unlocks self-service password recovery.</p>

             {notice&&<p role="status" className="notice success">{notice}</p>}
             {error&&<p role="alert" className="notice error">{error}</p>}

             <div style={{marginTop:'24px'}}>
               <button className="primary-button login-submit" onClick={()=>{setView('login');setError('');setNotice('')}}>
                 Continue to Sign In <ArrowRight size={18}/>
               </button>
             </div>
           </>
         )}
       </section>
     </div>
   </main>
 );
}
