import { defineConfig } from "vite";
import { runAction, uxp, uxpSetup } from "vite-uxp-plugin";
import vue from "@vitejs/plugin-vue"; 

import { config } from "./uxp.config";

const action = process.env.BOLT_ACTION;
const mode = process.env.MODE;
process.env.VITE_BOLT_MODE = mode;

if (action) runAction(config, action);

const shouldNotEmptyDir =
  mode === "dev" && config.manifest.requiredPermissions?.enableAddon;

export default defineConfig({
  plugins: [
    uxp(config, mode),
    vue(), 
  ],
  build: {
    sourcemap: mode && ["dev", "build"].includes(mode) ? true : false,
    minify: false,
    emptyOutDir: !shouldNotEmptyDir,
    rollupOptions: {
      external: [
        "premierepro", 
        "uxp",
        "fs",
        "os",
        "path",
        "process",
        "shell",
      ],
      output: {
        // format: "cjs",
        format: "iife", // Needed for Webview UI in Vue to prevent global overrides
      },
    },
  },
  publicDir: "public",
});
