import { fileURLToPath, URL } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// wrangler.jsonc keeps `build` so a plain `wrangler deploy` (Workers Builds, the Deploy button) builds the app
// first. The Cloudflare Vite plugin doesn't need it and warns on every start, so hide exactly that warning.
// If the plugin warns about anything else, the whole warning is still shown.
const warn = console.warn;
console.warn = (...args: unknown[]) => {
  const onlyBuild =
    /not applicable when using Vite:\n {2}- `build` which is not relevant in the context of a Vite project\n*$/;
  if (typeof args[0] === "string" && onlyBuild.test(args[0])) return;
  warn(...args);
};

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    // Runs the Worker (API + D1) inside Vite: one `npm run dev`, one port.
    cloudflare(),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
