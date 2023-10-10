import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import packageConfig from "./package.json";

import * as child from "child_process";
const commitHash = child.execSync("git rev-parse --short HEAD").toString();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageConfig.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  plugins: [react()],
  server: {
    proxyDOnt: {
      "/ws": {
        target:
          "wss://336vzkhb85.execute-api.us-east-1.amazonaws.com/production",
        secure: false,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
  },
});
