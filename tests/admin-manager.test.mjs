import {createDownloadCounts} from '../src/download-counts.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {compareMaterials} from '../src/material-order.js';
function manager({saveError=null}={}){
 const root={innerHTML:''},messages=[],calls=[];
 const rows=[{id:'a',title:'First',category:'General',subject:'Other Important Documents',created_at:'2026-11-02'},{id:'b',title:'Second',category:'General',subject:'Other Important Documents',created_at:'2026-11-01'}];
 const db={from:()=>({select:async()=>({data:[]})}),rpc:async(name,args)=>{calls.push({name,args});return {error:saveError};}};
 const src=readFileSync(new URL('../src/admin-manager.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export function','function')+';globalThis.manager=setupManager({db,getRows:()=>rows,esc:s=>s,status:m=>messages.push(m),requireAdmin:async()=>{},onEdit:()=>{},onDelete:()=>{}});';
 const context={createDownloadCounts,db,rows,messages,materialTag:()=>'',subjects:[],canonicalSubject:s=>s,compareMaterials,document:{querySelector:()=>root},confirm:()=>true,fetch:async()=>({ok:true,json:async()=>[]})};vm.runInNewContext(src,context);
 async function click(dataset,attribute=''){await root.onclick({target:{closest:()=>({dataset,hasAttribute:a=>a===attribute})}});}
 return {root,calls,messages,load:()=>context.manager.load(),click};
}
test('General grid can reorder and save, including mixed-source IDs',async()=>{
 const m=manager();await m.load();await m.click({manageCategory:'General'});assert.match(m.root.innerHTML,/First/);
 await m.click({move:'-1',id:'b'});assert.ok(m.root.innerHTML.indexOf('Second')<m.root.innerHTML.indexOf('First'));
 await m.click({},'data-save-order');assert.equal(m.calls[0].name,'save_material_order');assert.deepEqual(Array.from(m.calls[0].args.ordered_ids),['b','a']);assert.match(m.messages.at(-1),/Order saved/);
});
test('failed order save preserves draft and reports failure',async()=>{
 const m=manager({saveError:{message:'Permission denied'}});await m.load();await m.click({manageCategory:'General'});await m.click({move:'-1',id:'b'});await m.click({},'data-save-order');assert.match(m.messages.at(-1),/Order not saved/);assert.match(m.root.innerHTML,/Unsaved changes/);
});
