export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');
 const appId=process.env.ONESIGNAL_APP_ID,apiKey=process.env.ONESIGNAL_REST_API_KEY;
 if(!appId||!apiKey)return res.status(503).json({error:'Subscriber count is not configured.'});
 try{
  const response=await fetch('https://api.onesignal.com/apps/'+encodeURIComponent(appId),{
   headers:{Authorization:'Key '+apiKey,Accept:'application/json'}
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.errors?.join?.(', ')||data.message||'OneSignal app details request failed (HTTP '+response.status+').');
  const count=Number(data.messageable_players);
  if(!Number.isFinite(count)||count<0)throw Error('OneSignal did not return a valid subscriber count.');
  return res.status(200).json({subscribed:count});
 }catch(error){return res.status(502).json({error:'Could not load subscriber count: '+error.message});}
}