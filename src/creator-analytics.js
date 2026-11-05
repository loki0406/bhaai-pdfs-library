const supabaseUrl=import.meta.env.VITE_SUPABASE_URL||import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const allowed=new Set(['creators_note','linkedin_lokesh','linkedin_ramakrishna']);
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-creator-event]');
 if(!link)return;
 const eventType=link.dataset.creatorEvent;
 if(!allowed.has(eventType)||!supabaseUrl||!publishableKey)return;
 fetch(supabaseUrl.replace(/\/$/,'')+'/rest/v1/creator_link_analytics',{
  method:'POST',keepalive:true,
  headers:{apikey:publishableKey,'Content-Type':'application/json',Prefer:'return=minimal'},
  body:JSON.stringify({event_type:eventType})
 }).catch(()=>{});
},true);
