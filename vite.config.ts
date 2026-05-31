import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react','react-dom','react-router-dom'],
          ui:      ['framer-motion','lucide-react'],
          data:    ['@tanstack/react-query','zustand','axios'],
          charts:  ['recharts'],
          dnd:     ['@hello-pangea/dnd'],
          forms:   ['react-hook-form','@hookform/resolvers','zod'],
        },
      },
    },
  },
})
