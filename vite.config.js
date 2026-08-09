import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:5000'

// Fixture paths participants explore live on the API server, so proxy them in dev too.
const proxiedPrefixes = [
  '/api',
  '/docs',
  '/health',
  '/countries',
  '/v6',
  '/agify',
  '/genderize',
  '/nationalize',
]

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: Object.fromEntries(
      proxiedPrefixes.map((prefix) => [prefix, { target: API_TARGET, changeOrigin: true }])
    ),
  },
})
