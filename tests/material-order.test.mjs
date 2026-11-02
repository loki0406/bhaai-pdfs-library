import test from 'node:test';
import assert from 'node:assert/strict';
import {compareMaterials} from '../src/material-order.js';
test('saved positions override dates for both upload and GitHub cards',()=>{
 const files=[{id:'git:path',created_at:'2026-11-02'},{id:'upload',created_at:'2026-10-01'},{id:'new',created_at:'2026-11-03'}];
 assert.deepEqual(files.sort((a,b)=>compareMaterials(a,b,{'upload':0,'git:path':1})).map(r=>r.id),['upload','git:path','new']);
});
test('unsorted materials retain newest-first ordering',()=>{
 const files=[{id:'old',created_at:'2026-10-01'},{id:'new',created_at:'2026-11-03'}];
 assert.deepEqual(files.sort(compareMaterials).map(r=>r.id),['new','old']);
});
