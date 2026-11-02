// Storage IDs remain internal; downloads get a readable, platform-safe filename.
export function downloadFilename(resource) {
 const path=resource.source==='GitHub'?resource.url:resource.storage_path;
 let stored='';
 try { stored=decodeURIComponent(new URL(path,'https://library.invalid').pathname.split('/').pop()); } catch { stored=String(path||'').split('/').pop(); }
 const ext=stored.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()||'pdf';
 const original=resource.original_filename||(resource.source==='GitHub'?stored:'');
 const name=String(original||resource.title||'Bhaai PDF').replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g,' ').trim().replace(/[. ]+$/g,'')||'Bhaai PDF';
 return name.toLowerCase().endsWith('.'+ext)?name:name+'.'+ext;
}
