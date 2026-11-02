import {sortPosts,tweetMarkup,escapeTweet as esc} from './tweet-content.js';
export function setupAdminNotes({db,getRows,requireAdmin,isAuthorised,status}){
 const $=s=>document.querySelector(s),form=$('#note-compose');let posts=[],selected=[],editing=null,saving=false,git=[];
 function materials(){return [...git,...getRows()].filter(r=>r.published!==false);}
 function chips(){
  $('#note-selected').innerHTML=selected.map(id=>`<button type="button" class="note-chip" data-detach="${esc(id)}">${esc(materials().find(r=>r.id===id)?.title||'Unavailable material')} <span aria-hidden="true">×</span><span class="sr-only">Remove attachment</span></button>`).join('');
 }
 function options(){
  const category=$('#note-category').value,subject=$('#note-subject').value;
  $('#note-choices').innerHTML=materials().filter(r=>(!category||r.category===category)&&(!subject||r.subject===subject)).map(r=>`<label class="attachment-choice"><input type="checkbox" data-attach="${esc(r.id)}" ${selected.includes(r.id)?'checked':''}><span>${esc(r.title)}<small>${esc(r.category)} · ${esc(r.subject)}</small></span></label>`).join('')||'<p>No published materials match.</p>';
 }
 function subjects(){const category=$('#note-category').value;$('#note-subject').innerHTML='<option value="">All subjects</option>'+[...new Set(materials().filter(r=>!category||r.category===category).map(r=>r.subject))].map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');options();}
 function draft(){return {id:editing||'preview',body:form.elements.body.value.trim(),material_ids:[...selected],is_pinned:form.elements.is_pinned.checked,show_announcement:form.elements.show_announcement.checked,created_at:posts.find(p=>p.id===editing)?.created_at||new Date().toISOString()};}
 function reset(){editing=null;selected=[];form.reset();$('#note-editor-title').textContent='Write a note';$('#note-publish').textContent='Publish note ↗';$('#note-preview').hidden=true;$('#note-attachment-picker').hidden=true;chips();}
 async function load(){
  const {data,error}=await db.from('bhaai_posts').select('*').order('created_at',{ascending:false});if(error)throw error;posts=sortPosts(data||[]);
  try{const response=await fetch('/catalogue.json');if(response.ok)git=await response.json();}catch{/* Supabase materials remain selectable. */}
  $('#admin-notes').innerHTML=posts.map(p=>tweetMarkup(p,materials(),{interactive:false})+`<div class="note-management"><button type="button" class="secondary" data-edit-note="${esc(p.id)}">Edit Tweet</button><button type="button" class="secondary" data-pin-note="${esc(p.id)}">${p.is_pinned?'Unpin':'Pin Tweet'}</button><button type="button" class="danger" data-remove-note="${esc(p.id)}">Delete</button></div>`).join('')||'<p>No published notes yet.</p>';chips();
 }
 $('#note-attach-open').onclick=async()=>{if(!isAuthorised()||saving)return;$('#note-attachment-picker').hidden=!$('#note-attachment-picker').hidden;subjects();};
 $('#note-category').onchange=subjects;$('#note-subject').onchange=options;
 $('#note-choices').onchange=e=>{const input=e.target.closest('[data-attach]');if(!input)return;const id=input.dataset.attach;if(input.checked){if(selected.length>=10){input.checked=false;status('Attach up to 10 materials per tweet.');return;}if(!selected.includes(id))selected.push(id);}else selected=selected.filter(x=>x!==id);chips();};
 $('#note-selected').onclick=e=>{const b=e.target.closest('[data-detach]');if(b){selected=selected.filter(id=>id!==b.dataset.detach);chips();options();}};
 $('#note-preview-button').onclick=()=>{$('#note-preview').innerHTML=tweetMarkup(draft(),materials(),{interactive:false});$('#note-preview').hidden=false;};
 $('#note-cancel-edit').onclick=()=>{if(!saving)reset();};
 form.onsubmit=async e=>{e.preventDefault();if(!isAuthorised()||saving)return;saving=true;$('#note-publish').disabled=true;try{
  await requireAdmin();const post=draft();if(!post.body||post.body.length>2000)throw Error('Write a note between 1 and 2000 characters.');
  const ids=selected.filter(id=>!id.startsWith('git:'));if(ids.length){const {data,error}=await db.from('resources').select('id,published').in('id',ids);if(error)throw error;if(ids.some(id=>!data.some(r=>r.id===id&&r.published!==false)))throw Error('An attachment is hidden or deleted. Remove it before publishing.');}
  if(selected.some(id=>!materials().some(r=>r.id===id)))throw Error('Remove unavailable attachments before publishing.');
  const record={body:post.body,material_ids:selected,is_pinned:post.is_pinned,show_announcement:post.show_announcement};
  const result=editing?await db.from('bhaai_posts').update(record).eq('id',editing):await db.from('bhaai_posts').insert(record);if(result.error)throw result.error;reset();await load();status('Tweet saved. Editing does not restart its 24-hour announcement window.');
 }catch(error){status(error.message);}finally{saving=false;$('#note-publish').disabled=false;}};
 $('#admin-notes').onclick=async e=>{
  const edit=e.target.closest('[data-edit-note]'),pin=e.target.closest('[data-pin-note]'),del=e.target.closest('[data-remove-note]');if(!isAuthorised()||saving)return;
  if(edit){const p=posts.find(p=>p.id===edit.dataset.editNote);editing=p.id;selected=[...(p.material_ids||[])];form.elements.body.value=p.body;form.elements.is_pinned.checked=!!p.is_pinned;form.elements.show_announcement.checked=!!p.show_announcement;$('#note-editor-title').textContent='Edit tweet';$('#note-publish').textContent='Save changes ↗';$('#note-preview').hidden=true;chips();subjects();form.scrollIntoView({behavior:'smooth'});return;}
  if(!pin&&!del)return;const p=posts.find(p=>p.id===(pin?.dataset.pinNote||del?.dataset.removeNote));if(del&&!confirm('Delete this note?'))return;
  saving=true;try{await requireAdmin();const result=pin?await db.from('bhaai_posts').update({is_pinned:!p.is_pinned}).eq('id',p.id):await db.from('bhaai_posts').delete().eq('id',p.id);if(result.error)throw result.error;if(del&&editing===p.id)reset();await load();status(pin?'Pin updated.':'Note deleted.');}catch(error){status(error.message);}finally{saving=false;}
 };
 return {load,reset};
}
