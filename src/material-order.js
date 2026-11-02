export function compareMaterials(a,b,positions={}) {
 const ap=positions[a.id],bp=positions[b.id];
 if(ap!==undefined||bp!==undefined)return (ap??Number.MAX_SAFE_INTEGER)-(bp??Number.MAX_SAFE_INTEGER)||a.id.localeCompare(b.id);
 return new Date(b.created_at)-new Date(a.created_at)||a.id.localeCompare(b.id);
}
