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
    // Force inject PUBLIC_ variables for client-side Supabase
    // This ensures environment variables are available in browser code
    define: {
      'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(
        process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
      ),
      'import.meta.env.PUBLIC_SUPABASE_KEY': JSON.stringify(
        process.env.PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || ''
      ),
    },
    build: {
      rollupOptions: {
        output: {
          format: "esm",
        },
      },
    },
    ssr: {
      noExternal: [
        /^@astro\//,
        "astro",
        "@astrojs/react",
        "@astrojs/renderers",
        "react",
        "react-dom",
        "react-dom/server",
      ],
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: process.env.NODE_ENV !== "production",
    },
  }),
});
