import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',       // SSR mode
  adapter: cloudflare(),  // Cloudflare Workers
  site: 'https://mmsppg-docs.themainhost.co.uk', 
  integrations: [tailwind()],
});
