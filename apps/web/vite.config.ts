import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@terrabuilder/engine': resolve(__dirname, '../../packages/engine/src/index.ts'),
      '@terrabuilder/schemas': resolve(__dirname, '../../packages/schemas/src/index.ts'),
      '@terrabuilder/emitters': resolve(__dirname, '../../packages/emitters/src/index.ts'),
      '@terrabuilder/security': resolve(__dirname, '../../packages/security/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@xyflow/react', 'zustand', 'immer'],
  },
});
