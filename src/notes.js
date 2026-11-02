export function setupNotes({db,esc,onNavigate}){
 const $=s=>document.querySelector(s);let open=false;
 async function load(){
  if(!db){$('#notes-status').textContent='Notes will be available when the database is connected.';return;}
  const {data,error}=await db.from('bhaai_posts').select('id,body,created_at').order('created_at',{ascending:false}).limit(50);
  if(error){$('#notes-status').textContent='Notes are temporarily unavailable.';return;}
  $('#notes-status').textContent=data.length?'':'No notes yet. Bhaai will be here soon.';
  $('#tweets').innerHTML=data.map(p=>`<article class="tweet"><div class="tweet-heading"><img src="/logo.jpeg" alt=""><div><strong>Bhaai PDFs <span class="verified">✦</span></strong><span>From Bhaai’s desk · ${esc(new Date(p.created_at).toLocaleString())}</span></div></div><p class="tweet-body">${esc(p.body)}</p></article>`).join('');
 }
 function setOpen(value,{scroll=true}={}){const changed=open!==value;open=value;$('#notes-feed').hidden=!value;$('#notes-open').hidden=value;if(value&&changed)load();if(scroll){$(value?'#notes-feed':'#notes-module').scrollIntoView({behavior:'smooth',block:'start'});if(!value)$('#notes-open').focus({preventScroll:true});}}
 $('#notes-open').onclick=()=>onNavigate?onNavigate(true):setOpen(true);
 $('#notes-back').onclick=()=>onNavigate?onNavigate(false):setOpen(false);
 setInterval(()=>{if(open&&!document.hidden)load();},30000);
 return {setOpen};
}
