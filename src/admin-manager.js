import {materialTag} from './material-tag.js';
import {subjects,canonicalSubject} from './subjects.js';
import {compareMaterials} from './material-order.js';
export function setupManager({db,getRows,esc,status,requireAdmin,onEdit,onDelete}) {
 const $=s=>document.querySelector(s),root=$('#admin-files');
 const groups=[['Mid-1','Mid-1 PDFs','mid1'],['Mid-2','Mid-2 PDFs','mid2'],['Semester','Semester PDFs','semester'],['General','Other Imp Documents','other']];
 let category='',subject='',git=[],positions={},draft=null,dragged=null,saving=false,loadError=false;
 function files(){return [...git,...getRows()].filter(r=>(!category||r.category===category)&&(!subject||category==='General'||r.subject===subject)).sort((a,b)=>compareMaterials(a,b,positions));}
 function change(fn){if(saving)return;if(draft&&!confirm('Discard unsaved order changes?'))return;draft=null;fn();render();}
 function render(){
  if(!category){root.innerHTML='<div class="section-grid">'+groups.map(([id,label,img])=>`<button class="section-card" data-manage-category="${id}"><div class="cover-wrap"><img src="/covers/${img}.webp" alt=""></div><div class="section-copy"><h3>${label}</h3><p>${[...git,...getRows()].filter(r=>r.category===id).length} materials</p><span>Manage documents ↗</span></div></button>`).join('')+'</div>';return;}
  const back=`<button class="shelf-back" type="button" data-manager-back>← ${subject?'Back to subjects':'Back to categories'}</button><p class="eyebrow">${esc(category)}${subject?' / '+esc(subject):''}</p>`;
  if(!subject&&category!=='General'){
   const names=[...new Set([...subjects.map(s=>s.name),...[...git,...getRows()].filter(r=>r.category===category).map(r=>r.subject)])];
   root.innerHTML=back+'<div class="subject-grid">'+names.map(name=>`<button class="subject-card" data-manage-subject="${esc(name)}"><h3>${esc(name)}</h3><p>${[...git,...getRows()].filter(r=>r.category===category&&r.subject===name).length} materials</p></button>`).join('')+'</div>';return;
  }
  const list=draft||files();
  root.innerHTML=back+`<p class="tiny">Drag a card or use the arrow buttons, then Save Order. The same order appears in the public library.</p>${loadError?'<p>Ordering data could not load. Refresh after running the database migration.</p>':''}<div class="manager-grid">`+list.map((r,i)=>`<article class="manager-card" draggable="${!saving}" data-order-id="${esc(r.id)}"><span class="eyebrow">⠿ ${i+1} · ${r.source==='GitHub'?'GitHub':'Upload'}</span>${materialTag(r)}<h3>${esc(r.title)}</h3><p>${esc(r.subject)}</p><span class="pill">${r.published===false?'Hidden':'Published'}</span><div class="row-actions"><button class="secondary" data-move="-1" data-id="${esc(r.id)}" aria-label="Move ${esc(r.title)} up" ${i===0||saving?'disabled':''}>↑</button><button class="secondary" data-move="1" data-id="${esc(r.id)}" aria-label="Move ${esc(r.title)} down" ${i===list.length-1||saving?'disabled':''}>↓</button>${r.source==='GitHub'?'<span class="tiny">Edit/delete in GitHub</span>':`<button class="secondary" data-edit="${esc(r.id)}" ${saving?'disabled':''}>Edit</button><button class="danger" data-delete="${esc(r.id)}" ${saving?'disabled':''}>Delete</button>`}</div></article>`).join('')+`</div>${!list.length?'<p>No documents here yet.</p>':''}<div class="order-actions"><button class="primary" data-save-order ${!draft||saving||loadError?'disabled':''}>${saving?'Saving…':'Save Order'}</button><button class="secondary" data-discard-order ${!draft||saving?'disabled':''}>Discard Changes</button><span role="status">${draft?'Unsaved changes':''}</span></div>`;
 }
 function move(id,to){if(saving||loadError)return;const list=[...(draft||files())],from=list.findIndex(r=>r.id===id);if(from<0||to<0||to>=list.length)return;list.splice(to,0,list.splice(from,1)[0]);draft=list;render();}
 root.onclick=async e=>{
  const b=e.target.closest('button');if(!b||saving)return;
  if(b.dataset.manageCategory)change(()=>{category=b.dataset.manageCategory;subject='';});
  if(b.dataset.manageSubject)change(()=>{subject=b.dataset.manageSubject;});
  if(b.hasAttribute('data-manager-back'))change(()=>{if(subject)subject='';else category='';});
  if(b.dataset.move){const list=draft||files();move(b.dataset.id,list.findIndex(r=>r.id===b.dataset.id)+Number(b.dataset.move));}
  if(b.hasAttribute('data-discard-order')){draft=null;render();}
  if(b.dataset.edit){if(draft&&!confirm('Discard unsaved order changes?'))return;draft=null;onEdit(b.dataset.edit);}
  if(b.dataset.delete){if(draft&&!confirm('Discard unsaved order changes?'))return;draft=null;onDelete(b.dataset.delete);}
  if(b.hasAttribute('data-save-order')&&draft){saving=true;render();try{await requireAdmin();const ids=draft.map(r=>String(r.id));const {error}=await db.rpc('save_material_order',{ordered_ids:ids});if(error)throw error;ids.forEach((id,i)=>positions[id]=i);draft=null;status('Order saved. Visitors see it on refresh or within one minute.');}catch(error){status('Order not saved: '+error.message);}finally{saving=false;render();}}
 };
 root.ondragstart=e=>{const card=e.target.closest('[data-order-id]');if(!card||saving||loadError){e.preventDefault();return;}dragged=card.dataset.orderId;e.dataTransfer.setData('text/plain',dragged);e.dataTransfer.effectAllowed='move';};
 root.ondragover=e=>{if(e.target.closest('[data-order-id]'))e.preventDefault();};
 root.ondrop=e=>{e.preventDefault();const target=e.target.closest('[data-order-id]');if(target&&dragged)move(dragged,(draft||files()).findIndex(r=>r.id===target.dataset.orderId));dragged=null;};
 root.ondragend=()=>{dragged=null;};
 return {render,reset(){category='';subject='';git=[];positions={};draft=null;render();},async load(){
  if(draft||saving)return;
  loadError=false;
  try{const response=await fetch('/catalogue.json');if(!response.ok)throw Error('Catalogue unavailable');git=(await response.json()).map(r=>({...r,subject:canonicalSubject(r.subject)}));}catch{loadError=true;status('GitHub catalogue unavailable. Ordering is disabled until it loads.');}
  const {data,error}=await db.from('material_order').select('resource_id,position');if(error){loadError=true;status('Run supabase/material-order.sql to enable saved ordering.');}else positions=Object.fromEntries((data||[]).map(r=>[r.resource_id,r.position]));render();
 }};
}
