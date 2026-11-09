import {sveltekit} from '@sveltejs/kit/vite';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import {defineConfig} from 'vite';
import node from '@sveltejs/adapter-node';
import vercel from '@sveltejs/adapter-vercel';
import staticAdapter from '@sveltejs/adapter-static';
const adapter=process.env.VERCEL?vercel():process.env.NETLIFY?staticAdapter({fallback:'index.html'}):node();
export default defineConfig({
 plugins:[sveltekit({adapter,preprocess:vitePreprocess()})],
 server:{port:5173,proxy:{'/api':{target:'http://localhost:10000',changeOrigin:true}}}
});
