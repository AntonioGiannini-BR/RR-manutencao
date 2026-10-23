import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins:[react(),tailwindcss()],
  resolve:{alias:{'@':path.resolve(root,'src')}},
  // The GitHub Pages workflow passes the repository subpath at build time.
  // Site deployments omit --base and keep the existing root URL behavior.
  base: process.env.VITE_BASE_PATH || '/',
  build:{outDir:'dist/client',emptyOutDir:true},
});
