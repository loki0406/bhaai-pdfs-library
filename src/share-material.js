export function createMaterialSharing({db,getUrl,getFilename,onMessage=()=>{}}){
 let totals={};
 return {
  label(id){return Number(totals[id]||0).toLocaleString('en-IN');},
  async load(){if(!db)return;const {data,error}=await db.from('whatsapp_share_counts').select('resource_id,shares');if(!error)totals=Object.fromEntries((data||[]).map(row=>[row.resource_id,Number(row.shares)||0]));},
  async share(resource){
   if(!navigator.share||!navigator.canShare)throw Error('This browser cannot attach files directly. Download the PDF and attach it manually in WhatsApp.');
   const response=await fetch(getUrl(resource));
   if(!response.ok)throw Error('Could not retrieve this PDF. Please try again.');
   const blob=await response.blob();
   const file=new File([blob],getFilename(resource),{type:blob.type||'application/pdf'});
   if(!navigator.canShare({files:[file]}))throw Error('This device cannot share PDF attachments from the browser. Download the PDF and attach it manually in WhatsApp.');
   await navigator.share({files:[file],title:resource.title,text:'Shared from Bhaai PDFs'});
   if(db){
    const {data,error}=await db.rpc('record_material_whatsapp_share',{material_id:resource.id});
    if(!error&&Number.isFinite(Number(data)))totals[resource.id]=Number(data);
   }
   return true;
  }
 };
}
