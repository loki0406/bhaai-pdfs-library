export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, max-age=0');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 const base=process.env.VITE_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
 const anon=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
 const managementToken=process.env.SUPABASE_MANAGEMENT_TOKEN;
 const projectRef=process.env.SUPABASE_PROJECT_REF||(base?new URL(base).hostname.split('.')[0]:null);
 const bearer=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!base||!anon)return res.status(503).json({error:'Supabase server URL and publishable key are not configured.'});
 if(!bearer)return res.status(401).json({error:'Admin session required.'});
 try{
  const userRes=await fetch(base+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+bearer},signal:AbortSignal.timeout(10000)});
  if(!userRes.ok)return res.status(401).json({error:'Session expired. Sign in again.'});
  const adminRes=await fetch(base+'/rest/v1/rpc/is_library_admin',{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
  if(!adminRes.ok||await adminRes.json()!==true)return res.status(403).json({error:'Admin permission required.'});
  const supabase={configured:Boolean(managementToken&&projectRef),projectRef:projectRef||null,requestCount:null,serviceCounts:null,updatedAt:null,error:null};
  if(!managementToken||!projectRef){supabase.error='Add SUPABASE_MANAGEMENT_TOKEN in Vercel environment variables to enable automatic Management API usage data. The project reference is detected from the Supabase URL.';}
  else{
   const headers={Authorization:'Bearer '+managementToken,Accept:'application/json'};
   const [breakdownRes,totalRes]=await Promise.all([
    fetch('https://api.supabase.com/v1/projects/'+encodeURIComponent(projectRef)+'/analytics/endpoints/usage.api-counts?interval=1day',{headers,signal:AbortSignal.timeout(15000)}),
    fetch('https://api.supabase.com/v1/projects/'+encodeURIComponent(projectRef)+'/analytics/endpoints/usage.api-requests-count',{headers,signal:AbortSignal.timeout(15000)})
   ]);
   if(!breakdownRes.ok||!totalRes.ok){
    const failed=!breakdownRes.ok?breakdownRes:totalRes;
    supabase.error=failed.status===401||failed.status===403?'Management API token is invalid or lacks analytics usage permission.':'Supabase Management API returned HTTP '+failed.status+'.';
   }else{
    const breakdown=await breakdownRes.json(),total=await totalRes.json();
    const latest=Array.isArray(breakdown.result)&&breakdown.result.length?breakdown.result[breakdown.result.length-1]:null;
    supabase.serviceCounts=latest?{timestamp:latest.timestamp,auth:Number(latest.total_auth_requests||0),realtime:Number(latest.total_realtime_requests||0),rest:Number(latest.total_rest_requests||0),storage:Number(latest.total_storage_requests||0)}:null;
    supabase.requestCount=Array.isArray(total.result)&&total.result.length&&Number.isFinite(Number(total.result[0].count))?Number(total.result[0].count):null;
    supabase.updatedAt=new Date().toISOString();
   }
  }
  return res.status(200).json({updatedAt:new Date().toISOString(),supabase,quotas:{supabase:{egressGb:5,cachedEgressGb:5,storageGb:1,databaseMb:500,mau:50000},vercel:{fastDataTransferGb:100,fastOriginTransferGb:10,cdnRequests:1000000,functionInvocations:1000000}},vercel:{automaticUsageAvailable:false,reason:'Exact Hobby quota meters are not available through a documented public usage API for this dashboard. Use the Vercel Usage page for authoritative readings.'}});
 }catch(error){return res.status(502).json({error:'Infrastructure monitoring request failed: '+(error?.name==='TimeoutError'?'provider request timed out':'provider connection failed')});}
}