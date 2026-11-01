import {readdir,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root='public/materials', result=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else if(!entry.name.startsWith('.')){const rel=path.relative(root,file).split(path.sep);if(rel.length<4)throw Error('Use materials/semester/subject/category/file');const s=await stat(file);if(s.size>10*1024*1024)throw Error(`${file}: exceeds 10 MB`);result.push({id:'git:'+rel.join('/'),title:path.parse(entry.name).name.replaceAll('-',' '),semester:rel[0],subject:rel[1].replaceAll('-',' '),category:rel[2],units:'',description:'',size:s.size,url:'/materials/'+rel.map(encodeURIComponent).join('/'),created_at:s.mtime.toISOString(),source:'GitHub'});}}}
await walk(root);await writeFile('public/catalogue.json',JSON.stringify(result,null,2));console.log(`Indexed ${result.length} material(s)`);
