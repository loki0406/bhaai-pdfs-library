import {sortPosts,tweetMarkup} from './tweet-content.js';
import {setupAnnouncement} from './note-announcement.js';
export function setupNotes({db,esc,onNavigate,getResources=()=>[],onMaterial,isHome=()=>false}){
 const $=s=>document.querySelector(s);let open=false,posts=[],pendingPost=null;
 const announcement=setupAnnouncement({isHome,onRead:openPost});
 function focusPost(){if(!pendingPost)return;const target=document.getElementById('tweet-'+pendingPost);if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.focus({preventScroll:true});pendingPost=null;}}
 function render(){ $('#tweets').innerHTML=sortPosts(posts).map(p=>tweetMarkup(p,getResources())).join('');focusPost();}
 async function load(){
  if(!db){$('#notes-status').textContent='Notes will be available when the database is connected.';return;}
  const {data,error}=await db.from('bhaai_posts').select('*').order('created_at',{ascending:false});
  if(error){$('#notes-status').textContent='Notes are temporarily unavailable.';return;}
  posts=data||[];$('#notes-status').textContent=posts.length?'':'No notes yet. Bhaai will be here soon.';if(open)render();announcement.update(posts);
 }
 function setOpen(value,{scroll=true}={}){const changed=open!==value;open=value;$('#notes-feed').hidden=!value;$('#notes-open').hidden=value;if(value){announcement.hide();render();if(changed)load();}if(scroll){$(value?'#notes-feed':'#notes-module').scrollIntoView({behavior:'smooth',block:'start'});if(!value)$('#notes-open').focus({preventScroll:true});}}
 function openPost(id){if(onNavigate)onNavigate(true);else setOpen(true);pendingPost=id;if(open)render();}
 $('#notes-open').onclick=()=>onNavigate?onNavigate(true):setOpen(true);
 $('#notes-back').onclick=()=>onNavigate?onNavigate(false):setOpen(false);
 $('#tweets').onclick=e=>{const share=e.target.closest('[data-share-tweet]');if(share){const post=posts.find(p=>p.id===share.dataset.shareTweet);if(post){const message='📢 *Bhaai PDFs — Update*\n\n'+post.body+'\n\n❤️ Keep Learning. Keep Growing.\n— Team Bhaai PDFs';if(navigator.share)navigator.share({title:'Bhaai PDFs',text:message}).catch(()=>{});else window.open('https://wa.me/?text='+encodeURIComponent(message),'_blank','noopener');}return;}const b=e.target.closest('[data-note-material]');if(b){const r=getResources().find(r=>r.id===b.dataset.noteMaterial&&r.published!==false);if(r&&onMaterial)onMaterial(r.id);else load();}};
 setInterval(()=>{if(!document.hidden)load().catch(()=>{});},30000);
 return {setOpen,refresh:load,refreshMaterials(){if(open)render();}};
}
