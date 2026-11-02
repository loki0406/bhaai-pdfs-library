import test from 'node:test';
import assert from 'node:assert/strict';
import {createDownloadCounts} from '../src/download-counts.js';
test('shared counts load, successful RPC updates totals, failures preserve counts',async()=>{
 let fail=false;
 const counts=createDownloadCounts({from:()=>({select:async()=>({data:[{resource_id:'pdf',downloads:12}]})}),rpc:async(name,args)=>{assert.equal(name,'record_material_download');assert.equal(args.material_id,'pdf');return fail?{error:{message:'Unavailable'}}:{data:13};}});
 assert.match(counts.label('pdf'),/unavailable/);await counts.load();assert.equal(counts.label('pdf'),'↓ 12 downloads');assert.equal(counts.label('new'),'↓ 0 downloads');await counts.record('pdf');assert.equal(counts.label('pdf'),'↓ 13 downloads');fail=true;await counts.record('pdf');assert.equal(counts.label('pdf'),'↓ 13 downloads');
});
