export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
 const anon=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 const appId=process.env.ONESIGNAL_APP_ID,apiKey=process.env.ONESIGNAL_REST_API_KEY;
 if(!url||!anon||!appId||!apiKey)return res.status(200).json({sent:false,reason:'Push provider is not configured.'});
 const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!token)return res.status(401).json({error:'Admin authentication required.'});
 try{
  const userResponse=await fetch(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+token}});
  if(!userResponse.ok)return res.status(401).json({error:'Your admin session is invalid. Sign in again.'});
  const adminResponse=await fetch(url+'/rest/v1/rpc/is_library_admin',{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});
  if(!adminResponse.ok||await adminResponse.json()!==true)return res.status(403).json({error:'Only an authorised admin can send notifications.'});
  const {body,postId}=req.body||{};
  if(typeof body!=='string'||!body.trim()||body.length>2000||typeof postId!=='string')return res.status(400).json({error:'Invalid published tweet.'});
  const push=await fetch('https://api.onesignal.com/notifications?c=push',{method:'POST',headers:{Authorization:'Key '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({app_id:appId,included_segments:['All'],headings:{en:'Bhaai PDFs'},contents:{en:body.trim().slice(0,180)},url:(process.env.PUBLIC_SITE_URL||'https://bhaai-pdfs-library.vercel.app/').replace(/\\/$/,'')+'/?openTweet='+encodeURIComponent(postId)+'#notes-module',data:{postId}})});
  const result=await push.json().catch(()=>({}));
  if(!push.ok)return res.status(502).json({error:result.errors?.[0]||result.message||'OneSignal rejected the notification.'});
  return res.status(200).json({sent:true,id:result.id||null,recipients:result.recipients??null});
 }catch(error){return res.status(500).json({error:'Notification service error: '+error.message});}
}
