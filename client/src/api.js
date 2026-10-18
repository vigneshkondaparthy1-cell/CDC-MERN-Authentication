export async function api(path,options={}){
 const {suppressSession=false,...request}=options;
 let response;
 try{response=await fetch('/api'+path,{credentials:'include',headers:{'Content-Type':'application/json'},...request,body:request.body?JSON.stringify(request.body):undefined})}
 catch{throw Error('Cannot reach the backend. Check your connection and try again.')}
 const data=await response.json().catch(()=>({}));
 if(!response.ok){
  if(response.status===401&&path!=='/auth/login'&&!suppressSession)window.dispatchEvent(new Event('cdc-session-expired'));
  const error=Error(data.message||'Request failed');error.status=response.status;throw error;
 }
 return data;
}
