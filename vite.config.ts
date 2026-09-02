import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import pkg from './package.json' with { type: 'json' };

const baseVersion = pkg.version ? pkg.version.split('.').slice(0, 2).join('.') : '1.0';
const appVersion =
  process.env.VITE_APP_VERSION ||
  (process.env.GITHUB_RUN_NUMBER ? `${baseVersion}.${process.env.GITHUB_RUN_NUMBER}` : pkg.version || '1.0.0');
const buildTime = new Date().toISOString();

function versionPlugin(): Plugin {
  return {
    name: 'vite-plugin-version-generator',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/version.json')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ version: appVersion, buildTime }));
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: appVersion, buildTime }, null, 2),
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [
    react(),
    versionPlugin(),
    visualizer({ filename: 'bundle-stats.html' }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id: string) {
          if (id.includes('@mui/x-charts')) {
            return 'vendor-mui-charts';
          }
          if (id.includes('@mui/icons-material')) {
            return 'vendor-mui-icons';
          }
          if (id.includes('@mui/material') || id.includes('@emotion')) {
            return 'vendor-mui';
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
});
