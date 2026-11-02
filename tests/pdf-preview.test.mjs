import test from 'node:test';
import assert from 'node:assert/strict';
import {Writable} from 'node:stream';
import handler from '../api/pdf.js';

test('PDF preview streams ranges with original filename, and rejects hidden materials',async()=>{
 const oldFetch=globalThis.fetch;
 const oldBase=process.env.VITE_SUPABASE_URL,oldKey=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 process.env.VITE_SUPABASE_URL='https://example.supabase.co';process.env.VITE_SUPABASE_PUBLISHABLE_KEY='public-key';
 let hidden=false,calls=[];
 globalThis.fetch=async(url,options)=>{
  calls.push({url:String(url),options});
  if(String(url).includes('/rest/'))return Response.json([{storage_path:'admin/random.pdf',original_filename:'HRPM Mid 2 — Notes.pdf',published:!hidden}]);
  return new Response('%PDF',{status:206,headers:{'content-range':'bytes 0-3/100','accept-ranges':'bytes'}});
 };
 function response(){const r=new Writable({write(chunk,enc,done){this.data=(this.data||'')+chunk;done();}});r.headers={};r.status=n=>(r.statusCode=n,r);r.setHeader=(k,v)=>r.headers[k.toLowerCase()]=v;return r;}
 try{
  const req={method:'GET',query:{resource:'12345678-1234-1234-1234-123456789012'},headers:{range:'bytes=0-3'}};
  const res=response();await handler(req,res);
  assert.equal(res.statusCode,206);assert.equal(res.data,'%PDF');assert.equal(calls[1].options.headers.Range,'bytes=0-3');
  assert.match(res.headers['content-disposition'],/^inline;/);assert.ok(res.headers['content-disposition'].includes(encodeURIComponent('HRPM Mid 2 — Notes.pdf')));
  assert.equal(res.headers['content-range'],'bytes 0-3/100');assert.equal(new URL(calls[1].url).hostname,'example.supabase.co');
  hidden=true;calls=[];const denied=response();await handler(req,denied);assert.equal(denied.statusCode,404);assert.equal(calls.length,1);
 }finally{globalThis.fetch=oldFetch;if(oldBase===undefined)delete process.env.VITE_SUPABASE_URL;else process.env.VITE_SUPABASE_URL=oldBase;if(oldKey===undefined)delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;else process.env.VITE_SUPABASE_PUBLISHABLE_KEY=oldKey;}
});
