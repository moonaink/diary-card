/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the project site under /<repository>/, so every asset URL needs this prefix.
export default defineConfig({
  base: '/diary-card/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Дневниковая карточка',
        short_name: 'Дневник',
        description: 'Дневниковая карточка ДБТ',
        lang: 'ru',
        display: 'standalone',
        theme_color: '#ffd0de',
        background_color: '#fff0f5',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The PDF fonts and the UI font must be cached too: the app has to work fully offline.
        // Only woff2 of the UI font: every browser that installs the app reads woff2.
        globPatterns: ['**/*.{js,css,html,ttf,woff2,png,svg,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
