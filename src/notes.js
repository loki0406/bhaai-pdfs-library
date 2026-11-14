import {sortPosts,tweetMarkup} from './tweet-content.js';
import {setupAnnouncement} from './note-announcement.js';
import {materialPageUrl} from './material-link.js';
export function setupNotes({db,esc,onNavigate,getResources=()=>[],onMaterial,isHome=()=>false}){
 const $=s=>document.querySelector(s);let open=false,posts=[],pendingPost=null,oneSignal=null,pushReady=false;
 const announcement=setupAnnouncement({isHome,onRead:openPost});
 async function loadSubscriberCount(){
  const label=$('#push-subscriber-count');if(!label)return;
  try{
   const response=await fetch('/api/onesignal-subscribers',{headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Subscriber count unavailable');
   const data=await response.json();
   if(Number.isFinite(data.subscribed)&&data.subscribed>=0){
    const count=new Intl.NumberFormat().format(data.subscribed);
    label.textContent=`🔔 ${count} ${data.subscribed===1?'student is':'students are'} subscribed to notifications`;
    label.hidden=false;
   }
  }catch{/* Keep the small count hidden if the service is temporarily unavailable. */}
 }
 function pushStatus(message,enabled=false){const wrap=$('#push-optin'),button=$('#push-enable');if(!wrap||!button)return;wrap.classList.toggle('is-enabled',enabled);button.textContent=enabled?'Notifications Enabled':'Enable Notifications';button.disabled=enabled;const copy=wrap.querySelector('.push-optin-copy span');if(copy&&message)copy.textContent=message;}
 async function setupPush(){
  const appId=import.meta.env.VITE_ONESIGNAL_APP_ID;
  const button=$('#push-enable');if(!button)return;
  if(!appId){pushStatus('Push notifications are almost ready. Subscription setup will be enabled shortly.');button.addEventListener('click',()=>pushStatus('Notifications are being configured. Please check back soon.'));return;}
  try{
   window.OneSignalDeferred=window.OneSignalDeferred||[];
   const script=document.createElement('script');script.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';script.defer=true;document.head.appendChild(script);
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Notification service timed out.')),12000);window.OneSignalDeferred.push(async sdk=>{try{await sdk.init({appId,serviceWorkerPath:'/OneSignalSDKWorker.js',serviceWorkerParam:{scope:'/'},notifyButton:{enable:false}});oneSignal=sdk;pushReady=true;clearTimeout(timer);resolve();}catch(error){clearTimeout(timer);reject(error);}});});
   const update=()=>{const opted=!!oneSignal?.User?.PushSubscription?.optedIn;pushStatus(opted?'You’re subscribed. We’ll let you know when a new Bhaai Tweet is published.':'Get a notification whenever Bhaai publishes a new update.',opted);};
   oneSignal.User.PushSubscription.addEventListener('change',update);update();
   button.addEventListener('click',async()=>{if(!pushReady||button.disabled)return;button.disabled=true;try{await oneSignal.Notifications.requestPermission();await oneSignal.User.PushSubscription.optIn();update();}catch(error){pushStatus(error?.message||'Could not enable notifications. Please try again.');}finally{if(!oneSignal?.User?.PushSubscription?.optedIn)button.disabled=false;}});
  }catch(error){pushStatus('Notifications could not load right now. Please refresh and try again.');button.addEventListener('click',()=>location.reload());}
 }
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
 $('#tweets').onclick=async e=>{
  const share=e.target.closest('[data-share-tweet]'),shareCards=e.target.closest('[data-share-tweet-cards]');
  if(share||shareCards){
   const post=posts.find(p=>p.id===(share||shareCards).dataset[share?'shareTweet':'shareTweetCards']);
   if(!post)return;
   const attached=(post.material_ids||[]).map(id=>getResources().find(r=>r.id===id&&r.published!==false)).filter(Boolean);
   const emoji={pdf:String.fromCodePoint(0x1F4C4),megaphone:String.fromCodePoint(0x1F4E2),link:String.fromCodePoint(0x1F517)};
   const button=share||shareCards,original=button.textContent;
   button.disabled=true;button.textContent=shareCards?'Preparing cards…':'Preparing…';
   try{
    const links=attached.map(r=>{
     let href=materialPageUrl(r.id);
     if(shareCards){const target=new URL('/',location.origin);target.searchParams.set('card',r.id);href=target.toString();}
     return emoji.pdf+' '+r.title+'\n'+href;
    });
    const unavailable=(post.material_ids||[]).length-attached.length;
    const message=emoji.megaphone+' *Bhaai PDFs — New Update*\n\n*'+post.body+'*'+(links.length?'\n\n'+emoji.link+' *PDF Attachments:*\n'+links.join('\n\n'):'')+(unavailable>0?'\n\n'+unavailable+' attachment(s) are no longer available in the library.':'')+'\n\n🔔 *Follow PDF Updates on our website to stay updated with the latest PDFs and announcements.*\n\n🆕 *NEW SECTION*\n🌐 *PDF Updates:*\nhttps://bhaai-pdfs-library.vercel.app/pdf-updates.html\n\n✨ *Keep Learning. Keep Growing!*\n— *TEAM BHAAI PDFS*';
    const isMobile=navigator.userAgentData?.mobile??/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const whatsappUrl=(isMobile?'https://wa.me/?text=':'whatsapp://send?text=')+encodeURIComponent(message);
    window.location.href=whatsappUrl;
   }catch(error){alert('Could not prepare this WhatsApp message: '+error.message);}
   finally{button.disabled=false;button.textContent=original;}
   return;
  }
  const b=e.target.closest('[data-note-material]');if(b){const r=getResources().find(r=>r.id===b.dataset.noteMaterial&&r.published!==false);if(r&&onMaterial)onMaterial(r.id);else load();}};
 setupPush();
 loadSubscriberCount();
 setInterval(()=>{if(!document.hidden){load().catch(()=>{});loadSubscriberCount();}},300000);
 return {setOpen,openTweet(id){openPost(id);},refresh:load,refreshMaterials(){if(open)render();}};
}
