import React,{createContext,useContext,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Sun,Moon,BookOpen,Pencil,GraduationCap,NotebookPen,Lightbulb,Zap,ZapOff} from 'lucide-react';

const AppearanceContext=createContext(null);
const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback}catch{return fallback}};
export function AppearanceProvider({children}){
 const[theme,setTheme]=useState(()=>read('cdc-theme','dark'));
 const[paused,setPaused]=useState(()=>read('cdc-motion','running')==='paused');
 useLayoutEffect(()=>{
   document.documentElement.dataset.theme=theme;
   document.documentElement.dataset.motion=paused?'paused':'running';
   try{
     localStorage.setItem('cdc-theme',theme);
     localStorage.setItem('cdc-motion',paused?'paused':'running');
   }catch{}
 },[theme,paused]);
 return <AppearanceContext.Provider value={{paused,setPaused}}><a href="#overview" className="skip-link">Skip to main content</a><div className="app-frame"><FloatingBackground/><div className="appearance-controls"><button type="button" className="appearance-button" aria-label={paused?'Enable motion':'Reduce motion for floating objects'} title={paused?'Enable motion':'Reduce motion for floating objects'} aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused?<ZapOff size={18}/>:<Zap size={18}/>}</button><button type="button" className="appearance-button" aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} title={theme==='dark'?'Switch to light mode':'Switch to dark mode'} onClick={()=>setTheme(v=>v==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={20}/>:<Moon size={20}/>}</button></div>{children}<footer className="designer-footer"><span>CDC / PORTAL</span><span>Designed by <strong>Vignesh Kondaparthy</strong></span></footer></div></AppearanceContext.Provider>;
}
const objects=[{name:'book',Icon:BookOpen,color:'violet',word:'Turn a new page.'},{name:'pen',Icon:Pencil,color:'peach',word:'Write your next chapter.'},{name:'graduation cap',Icon:GraduationCap,color:'mint',word:'Keep reaching higher.'},{name:'notebook',Icon:NotebookPen,color:'blue',word:'Make room for ideas.'},{name:'light bulb',Icon:Lightbulb,color:'yellow',word:'A bright idea!'}];
export function CampusObjects({compact=false}){
 const[active,setActive]=useState(null),[message,setMessage]=useState('');
 const timer=useRef(null);const{paused}=useContext(AppearanceContext);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 function animate(object){clearTimeout(timer.current);setActive(object.name);setMessage(object.word);timer.current=setTimeout(()=>setActive(null),900)}
 return <div className={'campus-playground '+(compact?'compact':'')}><div className="campus-objects" aria-label="Interactive campus objects">{objects.map(({name,Icon,color,word},index)=><div className={'campus-float object-'+index} key={name} style={{'--delay':`${index*-.8}s`}}><button type="button" className={`campus-object ${color} ${active===name&&!paused?'object-pop':''}`} aria-label={'Animate '+name} title={word} onClick={()=>animate({name,word})}><Icon strokeWidth={1.5}/><span className="object-spark" aria-hidden="true">✦</span></button></div>)}</div><p className="campus-hint" aria-live="polite">{message||'A little curiosity goes a long way. Tap an object.'}</p></div>;
}

function FloatingBackground(){
 const [particles]=useState(()=>Array.from({length:15},(_,i)=>({
  Icon:objects[i%objects.length].Icon,
  x:5+(i%5)*19+Math.random()*6,y:5+Math.floor(i/5)*29+Math.random()*12,
  size:28+Math.random()*32,duration:22+Math.random()*24,delay:-Math.random()*45,
  dx:(Math.random()-.5)*20,dy:(Math.random()-.5)*24,rotation:(Math.random()-.5)*60,
 })));
 return <div className="floating-campus-background" aria-hidden="true">{particles.map(({Icon,x,y,size,duration,delay,dx,dy,rotation},i)=><span key={i} style={{left:`${x}%`,top:`${y}%`,width:size,height:size,'--float-time':`${duration}s`,'--float-delay':`${delay}s`,'--float-x':`${dx}vw`,'--float-y':`${dy}vh`,'--float-rotation':`${rotation}deg`}}><Icon strokeWidth={1.3}/></span>)}</div>;
}