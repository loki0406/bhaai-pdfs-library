import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {downloadFilename} from '../src/download-filename.js';

// Resolve published materials server-side; never proxy a visitor-supplied URL.
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method))return res.status(405).end();
 const id=req.query.resource;
 if(typeof id!=='string'||! /^[0-9a-f-]{36}$/i.test(id))return res.status(400).end('Invalid material');
 const base=process.env.VITE_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!base||!key)return res.status(503).end('Preview temporarily unavailable');
 try{
  const lookup=new URL('/rest/v1/resources',base);
  lookup.search=new URLSearchParams({id:'eq.'+id,select:'*',limit:'1'});
  const recordResponse=await fetch(lookup,{headers:{apikey:key},signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!recordResponse.ok)throw Error('Lookup failed');
  const [record]=await recordResponse.json();
  if(!record||record.published===false||record.allow_preview===false)return res.status(404).end('Material unavailable');
  const parts=String(record.storage_path||'').split('/');
  if(!parts.length||parts.some(p=>!p||p==='.'||p==='..')||!parts.at(-1).toLowerCase().endsWith('.pdf'))return res.status(404).end('PDF unavailable');
  const source=new URL('/storage/v1/object/public/materials/'+parts.map(encodeURIComponent).join('/'),base);
  const headers={};
  if(req.headers.range)headers.Range=req.headers.range;
  if(req.headers['if-range'])headers['If-Range']=req.headers['if-range'];
  const upstream=await fetch(source,{method:req.method,headers,redirect:'error',signal:AbortSignal.timeout(60000)});
  if(!upstream.ok&&upstream.status!==416)throw Error('File unavailable');
  const filename=downloadFilename(record);
  const ascii=filename.replace(/[^\x20-\x7e]|["\\]/g,'_');
  const encoded=encodeURIComponent(filename).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
  res.status(upstream.status);
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`inline; filename="${ascii}"; filename*=UTF-8''${encoded}`);
  res.setHeader('Cache-Control','private, no-store');
  for(const name of ['content-length','content-range','accept-ranges','etag','last-modified']){const value=upstream.headers.get(name);if(value)res.setHeader(name,value);}
  if(req.method==='HEAD'||!upstream.body)return res.end();
  await pipeline(Readable.fromWeb(upstream.body),res);
 }catch{if(!res.headersSent)return res.status(502).end('Unable to open PDF. Please try downloading from the library.');res.destroy();}
}
