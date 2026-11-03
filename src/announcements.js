export function setupAnnouncements({db}){
 const root=document.querySelector('#scheduled-announcements');if(!root||!db)return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function load(){const {data,error}=await db.from('scheduled_announcements').select('id,title,message,starts_at,ends_at').order('starts_at',{ascending:true});if(error){root.hidden=true;return;}const now=Date.now(),items=(data||[]).filter(x=>new Date(x.starts_at).getTime()<=now&&new Date(x.ends_at).getTime()>now);root.innerHTML=items.map(x=>'<article class="scheduled-announcement"><span class="eyebrow">📢 BHAAI NOTICE</span><h2>'+esc(x.title)+'</h2><p>'+esc(x.message)+'</p><small>Until '+new Date(x.ends_at).toLocaleString('en-IN')+'</small></article>').join('');root.hidden=!items.length;}
 load();setInterval(load,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
}