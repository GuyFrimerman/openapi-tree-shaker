import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/cli.ts',
      formats: ['es'],
      fileName: 'cli'
    },
    rollupOptions: {
      external: [
        'fs',
        'path',
        'js-yaml'
      ]
    }
  }
});