import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local dev/preview the app calls /api/* on the same origin; Vite proxies
// those requests to the local Express API server (server/dev.js). In production
// on Vercel, /api/* is served by serverless functions and no proxy is involved.
const apiProxy = {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
