import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {copyFileSync} from 'node:fs';
export default defineConfig({plugins:[{name:'bhaai-offline-assets',closeBundle(){copyFileSync(resolve('sw.js'),resolve('dist/sw.js'));}}],envPrefix:['VITE_','NEXT_PUBLIC_'],server:{allowedHosts:['terminal.local']},build:{rollupOptions:{input:{main:resolve('index.html'),adda:resolve('adda.html'),guide:resolve('guide.html'),dashboard:resolve('dashboard.html'),offline:resolve('offline.html'),offlineFallback:resolve('offline-fallback.html'),creatorsNote:resolve('creators-note.html'),pdfUpdates:resolve('pdf-updates.html')}}}});
