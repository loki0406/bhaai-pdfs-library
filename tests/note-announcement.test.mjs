import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {announcementPost,escapeTweet} from '../src/tweet-content.js';
test('announcement appears once, pauses on interaction and supports manual close',()=>{
 let card,interval,next=0;const timers=new Map(),storage=new Map();
 const context={announcementPost,esc:escapeTweet,document:{hidden:false,body:{append(){}},createElement(){return card={hidden:true,classList:{add(){},remove(){}},setAttribute(){},matches:()=>false};},addEventListener(){}},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},setInterval:fn=>{interval=fn;},setTimeout:(fn,delay)=>{timers.set(++next,{fn,delay});return next;},clearTimeout:id=>timers.delete(id)};
 const src=readFileSync(new URL('../src/note-announcement.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export function','function')+';globalThis.popup=setupAnnouncement({isHome:()=>true,onRead(){}});';vm.runInNewContext(src,context);
 context.popup.update([{id:'p',body:'Fresh PDFs',created_at:new Date().toISOString(),show_announcement:true}]);assert.equal(card.hidden,false);assert.equal([...timers.values()][0].delay,10000);
 card.onpointerenter();assert.equal(timers.size,0);card.onpointerleave();assert.equal(timers.size,1);
 card.onclick({target:{closest:selector=>selector==='[data-dismiss-note]'?{}:null}});const fade=[...timers.values()].find(t=>t.delay===250);fade.fn();assert.equal(card.hidden,true);interval();assert.equal(card.hidden,true);assert.equal(storage.get('bhaai-note-seen:p'),'1');
});
