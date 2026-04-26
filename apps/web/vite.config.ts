import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:7001';
  
  const tokensLess = path.resolve(__dirname, 'src/styles/tokens.less').replace(/\\/g, '/');

  return {
    plugins: [react()],
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          additionalData(content: string, filepath: string) {
            const norm = filepath.replace(/\\/g, '/');
            if (norm.endsWith('/styles/tokens.less')) return content;
            return `@import "${tokensLess}";\n${content}`;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
