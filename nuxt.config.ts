
// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path';

export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2026-09-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],
  $fetch: {
    credentials: 'include'
  },
  alias: {
    '~': resolve(__dirname, '.'),
    '@': resolve(__dirname, '.'),
  },
  tailwindcss: {
    cssPath: "~/assets/css/main.css",
    configPath: "tailwind.config",
  },
  css: ["~/app/globals.css", "~/assets/css/main.css"],
  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
        },
      ],
    },
  },
});
