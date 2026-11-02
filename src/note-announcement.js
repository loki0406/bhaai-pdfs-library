import {announcementPost,escapeTweet as esc} from './tweet-content.js';
export function setupAnnouncement({isHome,onRead}){
 let current=null,timer=null,remaining=10000,started=0,posts=[];const seen=new Set();
 const card=document.createElement('aside');card.className='note-announcement';card.hidden=true;card.setAttribute('aria-label','New from Bhaai');card.setAttribute('aria-live','polite');document.body.append(card);
 function wasSeen(id){try{return seen.has(id)||localStorage.getItem('bhaai-note-seen:'+id)==='1';}catch{return seen.has(id);}}
 function pause(){if(timer){clearTimeout(timer);timer=null;remaining=Math.max(0,remaining-(Date.now()-started));}}
 function hide(){pause();card.hidden=true;current=null;}
 function dismiss(){pause();card.classList.add('announcement-leaving');setTimeout(hide,250);}
 function resume(){if(card.hidden||!current||document.hidden||card.matches(':hover, :focus-within'))return;pause();started=Date.now();timer=setTimeout(dismiss,remaining);}
 card.onpointerenter=pause;card.onpointerleave=resume;card.onfocusin=pause;card.onfocusout=()=>setTimeout(resume,0);
 card.onclick=e=>{if(e.target.closest('[data-dismiss-note]'))dismiss();if(e.target.closest('[data-read-note]')&&current){const id=current.id;hide();onRead(id);}};
 document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
 function check(){
  if(!card.hidden){if(!isHome()||!announcementPost([current]))hide();return;}
  if(!isHome()||document.hidden)return;const post=announcementPost(posts);if(!post||wasSeen(post.id))return;
  current=post;remaining=10000;seen.add(post.id);try{localStorage.setItem('bhaai-note-seen:'+post.id,'1');}catch{}
  card.classList.remove('announcement-leaving');card.innerHTML=`<button type="button" class="announcement-close" data-dismiss-note aria-label="Close announcement">×</button><div class="announcement-brand"><img src="/logo.jpeg" alt=""><strong>New from Bhaai</strong></div><p>${esc(post.body.slice(0,160))}${post.body.length>160?'…':''}</p><button type="button" class="text-btn" data-read-note>Read Update ↗</button>`;card.hidden=false;resume();
 }
 setInterval(check,1000);return {update(value){posts=value;check();},hide};
}
