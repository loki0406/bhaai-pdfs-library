const normalize=value=>({category:['Mid-1','Mid-2','Semester','General'].includes(value?.category)?value.category:'',subject:typeof value?.subject==='string'?value.subject:'',notes:value?.notes===true,preview:typeof value?.preview==='string'?value.preview:''});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// One entry per screen; popstate restores UI without adding another entry.
export function createBrowserNavigation({browser=window,onChange}) {
 const history=browser.history;
 let current=normalize(history.state?.bhaaiView),previous=history.state?.bhaaiPrevious?normalize(history.state.bhaaiPrevious):null;
 function write(view,replace=false){
  const url=new URL(browser.location.href);url.hash=view.notes?'notes-module':'library';
  history[replace?'replaceState':'pushState']({...history.state,bhaaiView:view,bhaaiPrevious:replace?previous:current},'',url);
 }
 history.replaceState({...history.state,bhaaiView:current,bhaaiPrevious:previous},'',browser.location.href);
 browser.addEventListener('popstate',()=>{current=normalize(history.state?.bhaaiView);previous=history.state?.bhaaiPrevious?normalize(history.state.bhaaiPrevious):null;onChange(current);});
 return {get view(){return {...current};},sync(){onChange(current,{initial:true});},go(patch,{back=false}={}){
  const next=normalize({...current,...patch});if(same(next,current))return;
  if(back&&previous&&same(next,previous)){history.back();return;}
  write(next);previous=current;current=next;onChange(current);
 }};
}
