import { defineConfig } from 'vite';
import { resolve } from 'path';
import pug from 'vite-plugin-pug';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import legacy from '@vitejs/plugin-legacy';
// import { viteImagemin as ViteImageOptimize } from 'vite-plugin-imagemin';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['canvas-confetti', 'axios'],
          // Split Halloween theme into separate chunk
          halloween: ['@js/api']
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(mp3|wav|ogg|webm)$/i.test(assetInfo.name)) {
            return `assets/sound/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Enable compression
    reportCompressedSize: true,
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 8888,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@js': resolve(__dirname, 'src/assets/js'),
      '@styles': resolve(__dirname, 'src/assets/scss'),
      '@images': resolve(__dirname, 'src/assets/images'),
      '@fonts': resolve(__dirname, 'src/assets/fonts')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {}
    },
    devSourcemap: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['canvas-confetti', 'axios']
  },
  plugins: [
    pug({
      pugLocals: {
        APP_META_TITLE: process.env.APP_META_TITLE || 'Random Name Picker',
        APP_NONCE: Buffer.from(require('uuid').v4(), 'binary').toString('base64'),
        ...process.env
      }
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/images/og/*',
          dest: 'assets/images/og'
        },
        {
          src: 'src/assets/images/touch-icons/*',
          dest: 'assets/images/touch-icons'
        },
        {
          src: 'src/assets/images/favicon.ico',
          dest: 'assets/images'
        },
        {
          src: 'src/assets/images/halloween/*',
          dest: 'assets/images/halloween'
        },
        {
          src: 'src/assets/images/*.svg',
          dest: 'assets/images'
        },
        {
          src: 'src/manifest.json',
          dest: ''
        },
        {
          src: 'src/assets/sound/**/*',
          dest: 'assets/sound'
        }
      ]
    }),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
    // TODO: Add image optimization plugin when compatible version is available
  ]
});