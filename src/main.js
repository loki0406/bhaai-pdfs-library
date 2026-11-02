import {createBrowserNavigation} from './browser-navigation.js';
import {compareMaterials} from './material-order.js';
import {downloadFilename} from './download-filename.js';
import {setupSupportSchedule} from './support-schedule.js';
import {canonicalSubject} from './subjects.js';
import {setupLibrary} from './library-navigation.js';
import {setupNotes} from './notes.js';
import {setupExtras} from './extras.js';
import './style.css';
import {createClient} from '@supabase/supabase-js';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=import.meta.env.VITE_SUPABASE_URL||import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const db=url&&key?createClient(url,key):null;
let resources=[], category='', selectedSubject='',materialPositions={};
const navigation=setupLibrary({getResources:()=>resources,onChange(value,subject){routes.go({category:value,subject,notes:false,preview:''});},onBack(value,subject){routes.go({category:value,subject,notes:false,preview:''},{back:true});}});

const toast=message=>{$('#toast').textContent=message;$('#toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').style.display='none',4500);};
const notes=setupNotes({db,esc,onNavigate(open){routes.go({notes:open,preview:''},{back:!open});}});
const routes=createBrowserNavigation({onChange:restoreView});
let previewId='';
function restoreView(view,{initial=false}={}){category=view.category;selectedSubject=view.subject;render();notes.setOpen(view.notes,{scroll:false});const resource=resources.find(r=>r.id===view.preview&&r.allow_preview!==false);if(resource){showPreview(resource);}else if($('#preview').open){$('#preview').close();resetFrame();}if(!view.preview&&(!initial||view.category||view.notes)){$(view.notes?'#notes-feed':'#library').scrollIntoView({behavior:'auto',block:'start'});}}
function resetFrame(src='about:blank'){const old=$('#pdf-frame'),frame=document.createElement('iframe');frame.id='pdf-frame';frame.title='PDF document preview';frame.src=src;old.replaceWith(frame);previewId='';}

const size=n=>n<1048576?`${Math.ceil(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`;
function fileUrl(r){return r.source==='GitHub'?r.url:db.storage.from('materials').getPublicUrl(r.storage_path).data.publicUrl;}
function safeUrl(r){const value=fileUrl(r);const u=new URL(value,location.origin);if(!['https:','http:'].includes(u.protocol))throw Error('Invalid file URL');return u.href;}
function render(){navigation.refresh(category,selectedSubject);let list=resources.filter(r=>(!category||r.category===category)&&(!selectedSubject||r.subject===selectedSubject));list.sort((a,b)=>compareMaterials(a,b,materialPositions));$('#count').textContent=`${list.length} ${list.length===1?'material':'materials'} · ready for your next revision`;
$('#catalogue').innerHTML=list.length?list.map(r=>{const ext=(r.source==='GitHub'?r.url:r.storage_path).split('.').pop().toUpperCase();return `<article class="card" id="resource-${esc(r.id)}"><div class="card-top"><div class="file-icon">${esc(ext)}</div>${r.id===[...resources].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]?.id?'<span class="new-badge">NEW</span>':''}<span class="pill">${esc(r.category)}</span></div><h3>${esc(r.title)}</h3><p class="subject">${esc(r.subject)}</p>${r.description?`<p class="description">${esc(r.description)}</p>`:''}<div class="meta"><span>${esc(r.semester)} semester</span>${r.units?`<span>Units ${esc(r.units)}</span>`:''}<span>${size(r.size)}</span></div><div class="card-actions">${r.allow_download!==false?`<button class="download" data-action="download" data-id="${esc(r.id)}">Download ↓</button>`:''}${r.allow_preview!==false&&['PDF','DOC','DOCX','PPT','PPTX','XLS','XLSX','PNG','JPG','JPEG','TXT'].includes(ext)?`<button class="text-btn" data-action="preview" data-id="${esc(r.id)}">Preview</button>`:''}<button class="text-btn share" data-action="share" data-id="${esc(r.id)}" aria-label="Share ${esc(r.title)}">Share ↗</button></div></article>`;}).join(''):'<div class="empty"><h3>No materials found, bhaai.</h3><p>Please check back soon or choose another subject.</p><button class="secondary" id="shelf-reset">Back to library</button></div>';
$('#shelf-reset')?.addEventListener('click',()=>routes.go({category:'',subject:'',preview:''},{back:true}));}
async function load(){if(db){const {data,error}=await db.from('material_order').select('resource_id,position');if(!error)materialPositions=Object.fromEntries((data||[]).map(r=>[r.resource_id,r.position]));}let git=[];try{const r=await fetch('/catalogue.json');if(!r.ok)throw Error();git=await r.json();}catch{$('#catalogue-status').textContent='The GitHub catalogue could not be loaded. Please refresh.';}git=git.map(r=>({...r,subject:canonicalSubject(r.subject)}));resources=git;render();let uploads=[];if(db){const {data,error}=await db.from('resources').select('*').order('created_at',{ascending:false}).abortSignal(AbortSignal.timeout(8000));if(error)$('#catalogue-status').textContent='Showing GitHub materials. Uploaded materials are temporarily unavailable.';else{uploads=(data||[]).filter(r=>r.published!==false).map(r=>({...r,subject:canonicalSubject(r.subject),source:'Supabase'}));$('#catalogue-status').textContent='';}}resources=[...git,...uploads];render();}
function showPreview(r){if(previewId===r.id&&$('#preview').open)return;$('#preview-title').textContent=r.title;const ext=safeUrl(r).split('.').pop().toLowerCase();const src=['doc','docx','ppt','pptx','xls','xlsx'].includes(ext)?'https://view.officeapps.live.com/op/embed.aspx?src='+encodeURIComponent(safeUrl(r)):safeUrl(r);resetFrame(src);previewId=r.id;if(!$('#preview').open)$('#preview').showModal();}
async function preview(r){routes.go({category:r.category,subject:r.subject,notes:false,preview:r.id});}
$('#catalogue').addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const r=resources.find(r=>r.id===b.dataset.id);try{if(b.dataset.action==='preview'&&r.allow_preview!==false)await preview(r);if(b.dataset.action==='share'){const u=new URL(location.origin);u.searchParams.set('resource',r.id);const text=`${r.title} — free on Bhaai PDFs\n${u.href}`;window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener');}if(b.dataset.action==='download'&&r.allow_download!==false){b.disabled=true;b.textContent='Downloading…';const response=await fetch(safeUrl(r));if(!response.ok)throw Error('Download failed. Please try again.');const blob=await response.blob(),href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=downloadFilename(r);a.click();setTimeout(()=>URL.revokeObjectURL(href),30000);}}catch(error){toast(error.message);}finally{b.disabled=false;if(b.dataset.action==='download')b.textContent='Download ↓';}});
function closePreview(){routes.go({preview:''},{back:true});}
$('#preview-close').onclick=closePreview;$('#preview').addEventListener('cancel',event=>{event.preventDefault();closePreview();});
function openAdmin(){location.href='/adda.html';}
$('#admin-open').onclick=openAdmin;

setupExtras({getResources:()=>resources,showResource(id){const r=resources.find(r=>r.id===id);if(!r)return;routes.go({category:r.category,subject:r.subject,notes:false,preview:''});$('#library').scrollIntoView({behavior:'smooth'});},openAdmin});
document.querySelectorAll('a[href="#library"],a[href="#notes-module"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();if(link.hash==='#library'){routes.go({category:'',subject:'',notes:false,preview:''});$('#library').scrollIntoView({behavior:'smooth'});}else{$('#notes-module').scrollIntoView({behavior:'smooth'});}}));
async function init(){await load();routes.sync();const shared=new URLSearchParams(location.search).get('resource');if(shared&&!routes.view.category){const r=resources.find(r=>r.id===shared);if(r){routes.go({category:r.category,subject:r.subject,notes:false,preview:''});$('#library').scrollIntoView();if(r.allow_preview!==false&&(r.source==='GitHub'?r.url:r.storage_path).toLowerCase().endsWith('.pdf'))preview(r);}else toast('This material is no longer available. Explore the library below.');}

}
setInterval(()=>{if(!document.hidden)load().catch(()=>{});},60000);
init().catch(()=>toast("The library could not finish loading. Please refresh."));

setupSupportSchedule();
