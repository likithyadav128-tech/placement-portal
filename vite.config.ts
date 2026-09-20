import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(),
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^\.prisma\/client\/default$/,
        replacement: path.resolve(__dirname, "node_modules/.prisma/client/wasm.js"),
      },
      {
        find: /^#main-entry-point$/,
        replacement: path.resolve(__dirname, "node_modules/.prisma/client/wasm.js"),
      },
    ],
  },
});
