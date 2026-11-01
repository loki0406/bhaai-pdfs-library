// Explicit IST offsets keep the campaign dates identical in every time zone.
export const THANKS_START = Date.parse('2026-11-06T00:00:00+05:30');
export const THANKS_END = Date.parse('2026-11-10T00:00:00+05:30');
export const EXAMS_START = Date.parse('2026-11-15T00:00:00+05:30');
export const EXAMS_END = Date.parse('2026-11-28T00:00:00+05:30');
export const NOTES_END = Date.parse('2026-12-01T00:00:00+05:30');
export function supportPhase(now = Date.now()) {
 return now < THANKS_START ? 'fundraising' : now < THANKS_END ? 'thanks' : now < EXAMS_START ? 'hidden' : now < EXAMS_END ? 'exams' : now < NOTES_END ? 'completed' : 'hidden';
}
export function setupSupportSchedule() {
 const section=document.querySelector('#fundraiser'),link=document.querySelector('#fund-link'),button=document.querySelector('#celebrate-button');
 if(!section||!link||!button)return;
 let phase,burstLayer,observer;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 function celebrate(){
  const current=supportPhase();
  if(!['thanks','exams'].includes(current)||reduced.matches)return;
  const hearts=current==='exams';
  burstLayer?.remove();
  burstLayer=document.createElement('div');burstLayer.className=hearts?'celebration-confetti celebration-hearts':'celebration-confetti';burstLayer.setAttribute('aria-hidden','true');
  for(let i=0;i<64;i++){
   const piece=document.createElement('i');if(hearts)piece.textContent='♥';
   piece.style.cssText=`--x:${Math.random()*100}vw;--drift:${(Math.random()-.5)*260}px;--delay:${Math.random()*.45}s;--spin:${Math.random()*900-450}deg;--color:${['#ff7949','#68d6b9','#f4ca75','#f9eee1'][i%4]}`;
   burstLayer.append(piece);
  }
  document.body.append(burstLayer);const layer=burstLayer;setTimeout(()=>layer.remove(),4000);
 }
 function update(){
  const next=supportPhase();if(next===phase)return;phase=next;observer?.disconnect();burstLayer?.remove();
  section.hidden=phase==='hidden';link.hidden=phase!=='fundraising';button.hidden=!['thanks','exams'].includes(phase);
  button.textContent=phase==='exams'?'Thank you ❤️':'Celebrate 🎉';
  section.classList.toggle('support-thanks',['thanks','exams','completed'].includes(phase));
  if(phase==='thanks'){
   link.removeAttribute('href');
   section.querySelector('.eyebrow').textContent='MADE POSSIBLE BY YOU';
   section.querySelector('h2').innerHTML='You made it happen.<br>Thank you, bhaai.';
   document.querySelector('#fund-copy').textContent='Thank you to everyone who contributed! Your support made it possible to renew the ChatGPT subscription for Bhaai PDFs and keep preparing study materials for the 4-1 semester exams. This next chapter belongs to all of us.';
   observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){celebrate();observer.disconnect();}},{threshold:.2});observer.observe(section);
  }else if(phase==='exams'||phase==='completed'){
   link.removeAttribute('href');
   section.querySelector('.eyebrow').textContent=phase==='exams'?'YOU’VE GOT THIS, BHAAI':'ANOTHER MILESTONE, TOGETHER';
   section.querySelector('h2').textContent=phase==='exams'?'All the best for your 4-1 semester exams!':'Exams complete. A milestone worth smiling about.';
   document.querySelector('#fund-copy').textContent=phase==='exams'?'Trust your preparation, take one question at a time, and give it your best. Stay calm, look after yourself, and walk into every exam with confidence. Bhaai PDFs is cheering for you!':'Hope your exams went well, bhaai! Another semester completed, another milestone in your B.Tech journey. Take a well-deserved break—you’ve earned it!';
  }else if(phase==='hidden'){
   link.removeAttribute('href');observer?.disconnect();burstLayer?.remove();
  }
 }
 button.addEventListener('click',celebrate);
 update();setInterval(update,1000);
 document.addEventListener('visibilitychange',update);window.addEventListener('pageshow',update);
}
