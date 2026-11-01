export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try {const response=await fetch('https://bhaai-pdfs-support.vercel.app/api/campaign',{signal:AbortSignal.timeout(7000)});if(!response.ok)throw Error('Unavailable');const data=await response.json();if(!Number.isFinite(data.raised)||!Number.isFinite(data.goal)||data.goal<=0)throw Error('Invalid campaign');res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=120');return res.status(200).json({completed:data.mode==='live'&&data.raised>=data.goal});}catch{return res.status(503).json({error:'Campaign status unavailable'});}
}
