import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserNavigation} from '../src/browser-navigation.js';
function fixture(){
 const entries=[{state:null,url:'https://library.example/'}];let index=0;const listeners={};const views=[];
 const browser={location:{href:entries[0].url},addEventListener:(name,fn)=>listeners[name]=fn};
 browser.history={get state(){return entries[index].state;},replaceState(state,_,url){entries[index]={state:structuredClone(state),url:String(url)};browser.location.href=String(url);},pushState(state,_,url){entries.splice(index+1);entries.push({state:structuredClone(state),url:String(url)});index++;browser.location.href=String(url);},back(){if(index){index--;browser.location.href=entries[index].url;listeners.popstate();}},forward(){if(index<entries.length-1){index++;browser.location.href=entries[index].url;listeners.popstate();}}};
 const router=createBrowserNavigation({browser,onChange:view=>views.push({...view})});return {router,browser,entries,views};
}
test('Back closes preview then returns through subject and category; Forward restores',()=>{
 const f=fixture();f.router.go({category:'Mid-2'});f.router.go({subject:'RL'});f.router.go({preview:'pdf-id'});
 f.browser.history.back();assert.equal(f.router.view.preview,'');assert.equal(f.router.view.subject,'RL');
 f.browser.history.back();assert.equal(f.router.view.subject,'');assert.equal(f.router.view.category,'Mid-2');
 f.browser.history.back();assert.equal(f.router.view.category,'');assert.equal(f.entries.length,4);
 f.browser.history.forward();f.browser.history.forward();f.browser.history.forward();assert.equal(f.router.view.preview,'pdf-id');
});
test('on-screen Back uses previous entry instead of creating a loop',()=>{
 const f=fixture();f.router.go({category:'General'});f.router.go({category:'',subject:''},{back:true});assert.equal(f.router.view.category,'');assert.equal(f.entries.length,2);
 f.browser.history.forward();assert.equal(f.router.view.category,'General');
});
test('notes close via browser Back and reopen via Forward',()=>{
 const f=fixture();f.router.go({notes:true});f.browser.history.back();assert.equal(f.router.view.notes,false);f.browser.history.forward();assert.equal(f.router.view.notes,true);
 f.router.go({notes:false},{back:true});assert.equal(f.router.view.notes,false);
});
test('refresh retains selected view and duplicate navigation adds no entry',()=>{
 const f=fixture();f.router.go({category:'Mid-1',subject:'RL'});f.router.go({subject:'RL'});assert.equal(f.entries.length,2);
 const restored=createBrowserNavigation({browser:f.browser,onChange(){}});assert.equal(restored.view.subject,'RL');
});
