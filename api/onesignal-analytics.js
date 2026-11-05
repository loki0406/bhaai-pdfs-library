export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 const supabaseUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
 const anon=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 const appId=process.env.ONESIGNAL_APP_ID,apiKey=process.env.ONESIGNAL_REST_API_KEY;
 if(!supabaseUrl||!anon||!appId||!apiKey)return res.status(503).json({error:'OneSignal analytics setup is incomplete. Check the Vercel environment variables.'});
 const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!token)return res.status(401).json({error:'Admin authentication required.'});
 try{
  const user=await fetch(supabaseUrl+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+token}});
  if(!user.ok)return res.status(401).json({error:'Your admin session is invalid. Sign in again.'});
  const admin=await fetch(supabaseUrl+'/rest/v1/rpc/is_library_admin',{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});
  if(!admin.ok||await admin.json()!==true)return res.status(403).json({error:'Only an authorised admin can view OneSignal analytics.'});
  const headers={Authorization:'Key '+apiKey,Accept:'application/json'};
  const notifications=[];
  for(let offset=0;offset<1000;offset+=50){
   const url='https://api.onesignal.com/notifications?app_id='+encodeURIComponent(appId)+'&limit=50&offset='+offset+'&kind=1';
   const response=await fetch(url,{headers});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.errors?.join?.(', ')||data.message||'OneSignal notification analytics request failed (HTTP '+response.status+').');
   const page=Array.isArray(data.notifications)?data.notifications:[];
   notifications.push(...page.filter(item=>String(item.name||'').startsWith('Bhaai Tweet:')));
   if(page.length<50)break;
  }
  let subscribed=null;
  try{
   const app=await fetch('https://onesignal.com/api/v1/apps/'+encodeURIComponent(appId),{headers:{Authorization:'Basic '+apiKey,Accept:'application/json'}});
   if(app.ok){const data=await app.json();const count=data.messageable_players??data.players;if(Number.isFinite(Number(count)))subscribed=Number(count);}
  }catch{/* Subscriber total is optional when this endpoint is unavailable for the account. */}
  if(subscribed===null){
   try{
    const app=await fetch('https://api.onesignal.com/apps/'+encodeURIComponent(appId),{headers});
    if(app.ok){const data=await app.json();const count=data.messageable_players??data.players;if(Number.isFinite(Number(count)))subscribed=Number(count);}
   }catch{/* Keep subscriber total unavailable rather than showing an estimate. */}
  }
  notifications.sort((a,b)=>Number(b.queued_at||0)-Number(a.queued_at||0));
  return res.status(200).json({subscribed,notifications:notifications.slice(0,1000),truncated:notifications.length>=1000});
 }catch(error){return res.status(502).json({error:'Could not retrieve OneSignal analytics: '+error.message});}
}
