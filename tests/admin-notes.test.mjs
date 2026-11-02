import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {sortPosts,tweetMarkup,escapeTweet} from '../src/tweet-content.js';
function fixture(){
 const nodes=new Map(),writes=[],messages=[];const get=s=>{if(!nodes.has(s))nodes.set(s,{hidden:false,value:'',innerHTML:'',textContent:'',disabled:false,scrollIntoView(){}});return nodes.get(s);};
 const form=get('#note-compose');form.elements={body:{value:'New PDFs are ready'},is_pinned:{checked:true},show_announcement:{checked:true}};form.reset=()=>{form.elements.body.value='';form.elements.is_pinned.checked=false;form.elements.show_announcement.checked=false;};
 const post={id:'existing',body:'Old update',material_ids:['pdf'],created_at:'2026-11-02',is_pinned:false,show_announcement:false};
 const db={from(table){return {select(){return this;},order:async()=>({data:[post]}),in:async()=>({data:[{id:'pdf',published:true}]}),insert:async record=>{writes.push({kind:'insert',record});return {};},update(record){return {eq:async(_,id)=>{writes.push({kind:'update',record,id});return {};}};}};}};
 const src=readFileSync(new URL('../src/admin-notes.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export function','function')+';globalThis.editor=setupAdminNotes({db,getRows:()=>[{id:"pdf",title:"RL PDF",category:"Mid-2",subject:"RL"}],requireAdmin:async()=>{},isAuthorised:()=>true,status:m=>messages.push(m)});';
 const ctx={sortPosts,tweetMarkup,esc:escapeTweet,document:{querySelector:get},db,messages,fetch:async()=>({ok:true,json:async()=>[]}),confirm:()=>true};vm.runInNewContext(src,ctx);
 return {get,writes,messages,editor:ctx.editor,form};
}
test('new tweet saves selected material IDs, pin and announcement flags',async()=>{
 const f=fixture();await f.editor.load();f.get('#note-choices').onchange({target:{closest:()=>({checked:true,dataset:{attach:'pdf'}})}});
 await f.form.onsubmit({preventDefault(){}});assert.equal(f.writes[0].kind,'insert');assert.deepEqual(Array.from(f.writes[0].record.material_ids),['pdf']);assert.equal(f.writes[0].record.is_pinned,true);assert.equal(f.writes[0].record.show_announcement,true);
});
test('editing updates existing tweet and retains attachments without resetting created_at',async()=>{
 const f=fixture();await f.editor.load();await f.get('#admin-notes').onclick({target:{closest:selector=>selector==='[data-edit-note]'?{dataset:{editNote:'existing'}}:null}});f.form.elements.body.value='Edited update';await f.form.onsubmit({preventDefault(){}});
 assert.equal(f.writes[0].kind,'update');assert.equal(f.writes[0].id,'existing');assert.deepEqual(Array.from(f.writes[0].record.material_ids),['pdf']);assert.equal('created_at' in f.writes[0].record,false);
});
