// Explicit IST offsets keep the campaign dates identical in every time zone.
export const THANKS_START = Date.parse('2026-11-06T00:00:00+05:30');
export const THANKS_END = Date.parse('2026-11-10T00:00:00+05:30');
export function supportPhase(now = Date.now()) {
 return now < THANKS_START ? 'fundraising' : now < THANKS_END ? 'thanks' : 'hidden';
}
export function setupSupportSchedule() {
 const section=document.querySelector('#fundraiser'),link=document.querySelector('#fund-link'),button=document.querySelector('#celebrate-button');
 if(!section||!link||!button)return;
 let phase,burstLayer,observer;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 function celebrate(){
  if(supportPhase()!=='thanks'||reduced.matches)return;
  burstLayer?.remove();
  burstLayer=document.createElement('div');burstLayer.className='celebration-confetti';burstLayer.setAttribute('aria-hidden','true');
  for(let i=0;i<64;i++){
   const piece=document.createElement('i');
   piece.style.cssText=`--x:${Math.random()*100}vw;--drift:${(Math.random()-.5)*260}px;--delay:${Math.random()*.45}s;--spin:${Math.random()*900-450}deg;--color:${['#ff7949','#68d6b9','#f4ca75','#f9eee1'][i%4]}`;
   burstLayer.append(piece);
  }
  document.body.append(burstLayer);const layer=burstLayer;setTimeout(()=>layer.remove(),4000);
 }
 function update(){
  const next=supportPhase();if(next===phase)return;phase=next;
  section.hidden=phase==='hidden';link.hidden=phase!=='fundraising';button.hidden=phase!=='thanks';
  section.classList.toggle('support-thanks',phase==='thanks');
  if(phase==='thanks'){
   link.removeAttribute('href');
   section.querySelector('.eyebrow').textContent='MADE POSSIBLE BY YOU';
   section.querySelector('h2').innerHTML='You made it happen.<br>Thank you, bhaai.';
   document.querySelector('#fund-copy').textContent='Thank you to everyone who contributed! Your support made it possible to renew the ChatGPT subscription for Bhaai PDFs and keep preparing study materials for the 4-1 semester exams. This next chapter belongs to all of us.';
   observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){celebrate();observer.disconnect();}},{threshold:.2});observer.observe(section);
  }else if(phase==='hidden'){
   link.removeAttribute('href');observer?.disconnect();burstLayer?.remove();
  }
 }
 button.addEventListener('click',celebrate);
 update();setInterval(update,1000);
 document.addEventListener('visibilitychange',update);window.addEventListener('pageshow',update);
}
