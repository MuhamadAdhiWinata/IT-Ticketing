
// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path';

export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2026-09-15',
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@vite-pwa/nuxt"],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'IT Ticketing & Work Monitoring',
      short_name: 'IT Ticketing',
      description: 'Aplikasi tracking tiket IT & work monitoring',
      start_url: '/login',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#b10202',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/login',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,png,svg,ico}'],
      additionalManifestEntries: [{ url: '/login', revision: Date.now().toString() }],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
          handler: 'CacheFirst',
          options: { cacheName: 'static-assets', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 } },
        },
        {
          urlPattern: /^\/api\/.*/i,
          handler: 'NetworkOnly',
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },
  alias: {
    '~': resolve(__dirname, '.'),
    '@': resolve(__dirname, '.'),
  },
  tailwindcss: {
    cssPath: "~/assets/css/main.css",
    configPath: "tailwind.config",
  },
  runtimeConfig: {
    public: {
      appBuild: process.env.APP_BUILD || 'dev',
      appCommit: process.env.APP_COMMIT || '',
    },
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
