import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth':        'http://localhost:3000',
      '/companies':   'http://localhost:3000',
      '/accounting':  'http://localhost:3000',
      '/super-admin': 'http://localhost:3000',
      '/profile':     'http://localhost:3000',
    },
  },
})
