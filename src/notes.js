export function setupNotes({db,esc}){
 const $=s=>document.querySelector(s);let open=false;
 async function load(){
  if(!db){$('#notes-status').textContent='Notes will be available when the database is connected.';return;}
  const {data,error}=await db.from('bhaai_posts').select('id,body,created_at').order('created_at',{ascending:false}).limit(50);
  if(error){$('#notes-status').textContent='Notes are temporarily unavailable.';return;}
  $('#notes-status').textContent=data.length?'':'No notes yet. Bhaai will be here soon.';
  $('#tweets').innerHTML=data.map(p=>`<article class="tweet"><div class="tweet-heading"><img src="/logo.jpeg" alt=""><div><strong>Bhaai PDFs <span class="verified">✦</span></strong><span>From Bhaai’s desk · ${esc(new Date(p.created_at).toLocaleString())}</span></div></div><p class="tweet-body">${esc(p.body)}</p></article>`).join('');
 }
 $('#notes-open').onclick=()=>{open=true;$('#notes-feed').hidden=false;$('#notes-open').hidden=true;load();$('#notes-feed').scrollIntoView({behavior:'smooth'});};
 $('#notes-back').onclick=()=>{open=false;$('#notes-feed').hidden=true;$('#notes-open').hidden=false;};
 setInterval(()=>{if(open&&!document.hidden)load();},30000);
}
