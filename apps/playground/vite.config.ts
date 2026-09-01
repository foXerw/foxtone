import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages 部署在 /foxtone/ 子路径下
  base: '/foxtone/',
  plugins: [react()],
});
