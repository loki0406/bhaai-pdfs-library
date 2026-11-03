import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({envPrefix:['VITE_','NEXT_PUBLIC_'],server:{allowedHosts:['terminal.local']},build:{rollupOptions:{input:{main:resolve('index.html'),adda:resolve('adda.html'),guide:resolve('guide.html'),dashboard:resolve('dashboard.html'),offline:resolve('offline.html')}}}});
