import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import compress from 'astro-compress'
import tailwindcss from '@tailwindcss/vite'
import AstroPWA from '@vite-pwa/astro'

const SITE = 'https://nomojunkga.com'

export default defineConfig({
  site: SITE,

  integrations: [
    preact(),
    sitemap(),
    icon({ include: { tabler: ['*'] } }),
    AstroPWA({
      // Disabled during active dev: emit a self-destroying SW that unregisters
      // itself + clears caches on browsers that still have the old one.
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'NoMo Junk',
        short_name: 'NoMo Junk',
        description:
          'Junk removal and dumpster rentals in Middle Georgia. Less mess. Less stress.',
        theme_color: '#1e6fff',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/logo.jpg', sizes: '512x512', type: 'image/jpeg' },
          { src: '/logo.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
    compress({
      CSS: true,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: true,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
})
