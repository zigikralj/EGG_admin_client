import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { execSync } from "node:child_process";
import pkg from "./package.json" with { type: "json" };

const appVersion = process.env.VITE_APP_VERSION || pkg.version || "1.0.0";
let commitHash = process.env.VITE_COMMIT_SHA || process.env.GITHUB_SHA || "";
if (!commitHash) {
  try {
    commitHash = execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    commitHash = "dev";
  }
} else {
  commitHash = commitHash.substring(0, 7);
}

const buildTime = new Date().toISOString();
const versionData = {
  version: appVersion,
  commit: commitHash,
  buildTime,
};

function versionPlugin(): Plugin {
  return {
    name: "vite-plugin-version-generator",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/version.json")) {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(versionData));
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify(versionData, null, 2),
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "./",
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [
    react(),
    versionPlugin(),
    visualizer({ filename: "bundle-stats.html" }),
  ],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks(id: string) {
          if (id.includes("@mui/x-charts")) {
            return "vendor-mui-charts";
          }
          if (id.includes("@mui/icons-material")) {
            return "vendor-mui-icons";
          }
          if (id.includes("@mui/material") || id.includes("@emotion")) {
            return "vendor-mui";
          }
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
        },
      },
    },
  },
});
