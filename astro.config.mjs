import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://codex-blog-6v6.pages.dev',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
