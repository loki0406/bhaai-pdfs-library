export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 const supabaseUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
 const anon=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 const appId=process.env.ONESIGNAL_APP_ID,apiKey=process.env.ONESIGNAL_REST_API_KEY;
 if(!supabaseUrl||!anon||!appId||!apiKey)return res.status(503).json({sent:false,error:'Push setup is incomplete. Check the Vercel environment variables.'});
 const token=(req.headers.authorization||'').replace(/^Bearer\\s+/i,'');
 if(!token)return res.status(401).json({error:'Admin authentication required.'});
 try{
  const userResponse=await fetch(supabaseUrl+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+token}});
  if(!userResponse.ok)return res.status(401).json({error:'Your admin session is invalid. Sign in again.'});
  const adminResponse=await fetch(supabaseUrl+'/rest/v1/rpc/is_library_admin',{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});
  if(!adminResponse.ok||await adminResponse.json()!==true)return res.status(403).json({error:'Only an authorised admin can send notifications.'});
  const {body,postId}=req.body||{};
  if(typeof body!=='string'||!body.trim()||body.length>2000||typeof postId!=='string'||!postId)return res.status(400).json({error:'Invalid published tweet.'});
  const siteUrl=process.env.PUBLIC_SITE_URL||'https://bhaai-pdfs-library.vercel.app/';
  const clickUrl=new URL('/?openTweet='+encodeURIComponent(postId)+'#notes-module',siteUrl).toString();
  const push=await fetch('https://api.onesignal.com/notifications?c=push',{method:'POST',headers:{Authorization:'Key '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({app_id:appId,included_segments:['Subscribed Users'],headings:{en:'New Bhaai PDFs Update'},contents:{en:body.trim().slice(0,180)},url:clickUrl,data:{postId},name:'Bhaai Tweet: '+postId})});
  const result=await push.json().catch(()=>({}));
  if(!push.ok){
   const details=Array.isArray(result.errors)?result.errors.map(item=>typeof item==='string'?item:JSON.stringify(item)).join('; '):result.message;
   return res.status(502).json({sent:false,error:details||'OneSignal rejected the notification.'});
  }
  const recipients=typeof result.recipients==='number'?result.recipients:null;
  if(!result.id||recipients===0){
   const details=Array.isArray(result.errors)?result.errors.map(item=>typeof item==='string'?item:JSON.stringify(item)).join('; '):'No subscribed browser/device received this notification.';
   return res.status(200).json({sent:false,id:result.id||null,recipients,reason:details});
  }
  return res.status(200).json({sent:true,id:result.id,recipients});
 }catch(error){return res.status(500).json({sent:false,error:'Notification service error: '+error.message});}
}
