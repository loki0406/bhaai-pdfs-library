export function materialPageUrl(id,origin=location.origin){
 const url=new URL(origin);
 url.searchParams.set('resource',String(id));
 return url.href;
}
