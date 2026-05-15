import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  server: {
    port: 5173,
    // Cho phép truy cập qua bất kỳ host nào (ngrok forward về Vite cần option này
    // vì Vite 5+ chặn host lạ theo cơ chế chống DNS rebinding).
    // Khi production hãy giới hạn cụ thể bằng mảng host name.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        // Forward X-Forwarded-Host / -Proto để BE biết host gốc khi
        // ngrok → Vite → BE (cần thiết cho VNPay return redirect về đúng FE).
        xfwd: true,
      },
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  }
})
