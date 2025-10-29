// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: {
    port: 3000,
    // @ts-expect-error This option is experimental and not yet typed in Astro's config types (more than 10 chars).
    chromeDevtoolsWorkspace: true,
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL || ""),
      "import.meta.env.SUPABASE_KEY": JSON.stringify(process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ""),
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
