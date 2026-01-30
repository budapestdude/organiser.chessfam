import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
// Force rebuild: 2026-01-13 22:49
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analyzer (only in analyze mode)
    ...(process.env.ANALYZE ? [visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })] : []),
    // Custom plugin to set cache headers based on file type
    {
      name: 'cache-control-headers',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          // Never cache index.html
          if (req.url === '/' || req.url?.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
          // Cache hashed assets forever
          else if (req.url?.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
          next();
        });
      },
    },
  ],
  build: {
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Optimize dependencies
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': [
            'framer-motion',
            'react-helmet-async',
          ],

          // Utility libraries
          'utils-vendor': [
            'axios',
            'zustand',
            'uuid',
          ],

          // Chess-specific
          'chess-vendor': [
            'chess.js',
            'cm-chessboard',
          ],

          // Icons
          'icons-vendor': ['lucide-react'],
        },

        // Generate readable chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Minification (esbuild is faster than terser)
    minify: 'esbuild',

    // Source maps for production debugging (optional)
    sourcemap: false,
  },

  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: true,
    allowedHosts: ['chessfam.com', 'www.chessfam.com', 'chessfam-findagame-homepage-production.up.railway.app', '.railway.app'],
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'zustand',
      'framer-motion',
    ],
  },
})
