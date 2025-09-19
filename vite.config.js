import { defineConfig } from 'vite';
import { resolve } from 'path';
import pug from 'vite-plugin-pug';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true
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
    }
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
          src: 'src/manifest.json',
          dest: ''
        }
      ]
    }),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ]
});