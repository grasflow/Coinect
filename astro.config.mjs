// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://my.coinect.pl",
  output: "server",
  integrations: [react(), sitemap()],
  server: {
    port: 3000,
    // @ts-expect-error This option is experimental and not yet typed in Astro's config types (more than 10 chars).
    chromeDevtoolsWorkspace: true,
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/noop",
    },
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL || ""),
      "import.meta.env.SUPABASE_KEY": JSON.stringify(process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ""),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    ssr: {
      noExternal: ["@astrojs/react", "@astrojs/renderers"],
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: process.env.NODE_ENV !== "production",
    },
  }),
});
