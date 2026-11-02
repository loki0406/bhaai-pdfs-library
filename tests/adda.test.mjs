import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const adminSource=readFileSync(new URL('../src/adda.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace(/import\.meta\.env\.[A-Z_]+/g,"'test'");
function environment({admin=false,user=null,resources=[],posts=[]}={}){
 const elements=new Map();const names=['title','subject','semester','category','units','description','file','published','allow_preview','allow_download'];
 function element(){return {hidden:false,value:'',checked:true,textContent:'',innerHTML:'',disabled:false,options:[],classList:{toggle(){}},replaceChildren(){this.innerHTML='';},scrollIntoView(){},focus(){},reset(){},querySelector(){return element();}};}
 const get=s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s);};get('#resource-form').elements=Object.fromEntries(names.map(n=>[n,element()]));
 const calls=[];
 const db={rpc:async()=>({data:admin}),auth:{getUser:async()=>({data:{user}}),onAuthStateChange(){},signOut:async()=>({})},from(table){calls.push(table);return {select(){return this;},order(){return this;},limit(){return Promise.resolve({data:posts});},then(resolve){resolve({data:resources});}}}};
 const context={setupAdminNotes:()=>({reset(){},async load(){}}),setupManager:()=>({render(){},reset(){},async load(){}}),document:{documentElement:{dataset:{},style:{}},querySelector:get,querySelectorAll:()=>[]},createClient:()=>db,subjects:[],canonicalSubject:s=>s,Option:class{},console,confirm:()=>false,FormData:class{}};
 vm.runInNewContext(adminSource,context);return {get,calls};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('signed-out visitors cannot open management tools or query admin data',async()=>{const e=environment();await tick();assert.equal(e.get('#workspace').hidden,true);assert.equal(e.get('#gate').hidden,false);assert.deepEqual(e.calls,[]);});
test('signed-in non-admin cannot query management tables',async()=>{const e=environment({user:{email:'visitor@example.com'}});await tick();assert.equal(e.get('#workspace').hidden,true);assert.deepEqual(e.calls,[]);assert.match(e.get('#adda-status').textContent,/authorised/);});
test('verified admin sees stored materials and publishing totals',async()=>{const e=environment({admin:true,user:{email:'admin@example.com'},resources:[{id:'one',title:'<script>bad</script>',subject:'RL',category:'Mid-2',published:false}]});await tick();assert.equal(e.get('#workspace').hidden,false);assert.match(e.get('#adda-stats').innerHTML,/Hidden/);assert.match(e.get('#adda-stats').innerHTML,/Uploaded materials/);});
test('public notes read without obtaining an identity or rendering reaction actions',async()=>{const nodes=new Map();const get=s=>{if(!nodes.has(s))nodes.set(s,{hidden:false,textContent:'',innerHTML:'',scrollIntoView(){}});return nodes.get(s);};let calls=0;const db={from(table){assert.equal(table,'bhaai_posts');calls++;return {select(){return this;},order:async()=>({data:[{id:'note',body:'Read freely',created_at:'2026-11-01'}]})};}};const src=readFileSync(new URL('../src/notes.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export function','function')+';setupNotes({db,esc:s=>s});';vm.runInNewContext(src,{db,document:{querySelector:get,getElementById:()=>null},sortPosts:p=>p,tweetMarkup:p=>'<article>'+p.body+'</article>',setupAnnouncement:()=>({hide(){},update(){}}),setInterval(){}});get('#notes-open').onclick();await tick();assert.equal(calls,1);assert.match(get('#tweets').innerHTML,/Read freely/);assert.doesNotMatch(get('#tweets').innerHTML,/data-like|data-comment|<form|<button/);});
