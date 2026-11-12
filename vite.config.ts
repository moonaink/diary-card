/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the project site under /<repository>/, so every asset URL needs this prefix.
export default defineConfig({
  base: '/diary-card/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
