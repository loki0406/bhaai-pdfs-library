import './style.css';
import './how-to-use.css';
const image=document.querySelector('#guide-poster'), opener=document.querySelector('#poster-open'), dialog=document.querySelector('#poster-dialog');
let zoom=100;
function setZoom(value){zoom=Math.min(300,Math.max(100,value));opener.style.width=zoom+'%';document.querySelector('#zoom-level').textContent=zoom+'%';document.querySelector('#zoom-out').disabled=zoom===100;document.querySelector('#zoom-in').disabled=zoom===300;}
document.querySelector('#zoom-in').onclick=()=>setZoom(zoom+25);
document.querySelector('#zoom-out').onclick=()=>setZoom(zoom-25);
document.querySelector('#zoom-reset').onclick=()=>setZoom(100);
opener.onclick=()=>dialog.showModal();
document.querySelector('#poster-close').onclick=()=>dialog.close();
function unavailable(){opener.hidden=true;document.querySelector('#poster-missing').hidden=false;document.querySelector('.guide-tools').hidden=true;}
image.addEventListener('error',unavailable);
if(image.complete&&!image.naturalWidth)unavailable();
setZoom(100);
