import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'http://127.0.0.1:5000',
                ws: true
            }
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    charts: ['recharts', 'lightweight-charts'],
                    icons: ['react-icons'],
                    utils: ['axios', 'date-fns']
                }
            }
        }
    }
})
