import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), TanStackRouterVite()],
  server: {
    port: 3000,
    proxy: {
      '/ws': {
        target: 'http://host.docker.internal:8081',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://host.docker.internal:8081',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://host.docker.internal:8081',
        changeOrigin: true,
      },
    },
  },
})