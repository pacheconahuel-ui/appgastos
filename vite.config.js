import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    outDir: 'dist',
  },
  base: '/AppGastos/',
})
