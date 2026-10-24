import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Konfigurace Vite serveru.
 * Přesměrovává API požadavky na FastAPI backend.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})