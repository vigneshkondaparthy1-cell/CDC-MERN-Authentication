import React,{createContext,useContext,useEffect,useState} from 'react';
import {Navigate,Route,Routes} from 'react-router-dom';
import {AppearanceProvider} from './Appearance';
import LoginPage from './LoginPage';
import {AdminDashboard,ProfileDashboard} from './Dashboards';
import {api} from './api';
const Auth=createContext(null);
const useAuth=()=>useContext(Auth);
const remember=value=>{try{if(value)sessionStorage.setItem('cdc-session','active');else sessionStorage.removeItem('cdc-session')}catch{}};
const remembered=()=>{try{return sessionStorage.getItem('cdc-session')==='active'}catch{return false}};
function AuthProvider({children}){
 const[user,setUser]=useState(null),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
 useEffect(()=>{
  let active=true;
  function expired(){setUser(null);setMessage('Your session expired or your credentials changed. Please sign in again.');remember(false)}
  window.addEventListener('cdc-session-expired',expired);
  api('/auth/me',{suppressSession:true}).then(data=>{if(active){setUser(data.user);remember(true)}}).catch(error=>{if(active){if(error.status===401&&remembered())expired();else if(error.status!==401)setMessage(error.message)}}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false;window.removeEventListener('cdc-session-expired',expired)};
 },[]);
 useEffect(()=>{
  if(!user)return;
  let active=true;
  const check=()=>{if(document.visibilityState==='visible')api('/auth/me').then(data=>{if(active)setUser(data.user)}).catch(()=>{})};
  const timer=setInterval(check,60000);window.addEventListener('focus',check);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',check)};
 },[user?._id]);
 async function login(email,password){const data=await api('/auth/login',{method:'POST',body:{email,password}});setUser(data.user);setMessage('');remember(true)}
 async function logout(){await api('/auth/logout',{method:'POST'});setUser(null);setMessage('');remember(false)}
 return <Auth.Provider value={{user,loading,login,logout,message,setUser}}>{children}</Auth.Provider>;
}
const pathFor=role=>role==='admin'?'/admin':role==='faculty'?'/faculty':'/student';
function Guard({role,children}){const{user,loading}=useAuth();if(loading)return <div className="p-12 text-center muted">Loading your session…</div>;if(!user)return <Navigate to="/login" replace/>;if(role&&user.role!==role)return <Navigate to={pathFor(user.role)} replace/>;return children}
function Login(){const{user,login,message,loading}=useAuth();if(loading)return <div className="p-12 text-center muted">Loading your session…</div>;return user?<Navigate to={pathFor(user.role)} replace/>:<LoginPage login={login} sessionMessage={message}/>}
function Admin(){const{user,logout}=useAuth();return <AdminDashboard user={user} logout={logout} api={api}/>}
function Profile({student=false}){const{user,logout,setUser}=useAuth();return <ProfileDashboard user={user} logout={logout} student={student} api={api} onUserUpdated={setUser}/>}
function Home(){const{user}=useAuth();return <Navigate to={pathFor(user.role)} replace/>}
export default function App(){return <AppearanceProvider><AuthProvider><Routes><Route path="/login" element={<Login/>}/><Route path="/reset-password" element={<Login/>}/><Route path="/verify-email" element={<Login/>}/><Route path="/admin" element={<Guard role="admin"><Admin/></Guard>}/><Route path="/faculty" element={<Guard role="faculty"><Profile/></Guard>}/><Route path="/student" element={<Guard role="student"><Profile student/></Guard>}/><Route path="*" element={<Guard><Home/></Guard>}/></Routes></AuthProvider></AppearanceProvider>}
