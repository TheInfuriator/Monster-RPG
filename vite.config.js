import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so a production build works from any sub-folder
  // (GitHub Pages, itch.io, a plain file server) without reconfiguration.
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    rollupOptions: {
      output: {
        // Phaser is by far the largest thing we ship and it almost never
        // changes. Giving it its own file means a browser can keep it cached
        // while your game code updates.
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
    // Phaser alone is ~1.5MB unminified-equivalent; this keeps the build log
    // quiet about a chunk size we already understand and have accounted for.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    // Game logic under test is plain JavaScript with no DOM dependency,
    // so the fast Node environment is all we need.
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
