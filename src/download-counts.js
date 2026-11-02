export function createDownloadCounts(db){
 let counts=null;
 return {
  label(id){if(!counts)return '↓ Downloads unavailable';const n=Number(counts[id]||0);return `↓ ${n.toLocaleString('en-IN')} ${n===1?'download':'downloads'}`;},
  async load(){if(!db)return;try{const {data,error}=await db.from('download_counts').select('resource_id,downloads');if(!error)counts=Object.fromEntries((data||[]).map(r=>[r.resource_id,r.downloads]));}catch{}},
  async record(id){if(!db)return;try{const {data,error}=await db.rpc('record_material_download',{material_id:id});if(!error&&Number.isFinite(Number(data))){counts||={};counts[id]=Number(data);}}catch{}}
 };
}
