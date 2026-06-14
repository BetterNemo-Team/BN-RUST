// vite.config.js - configure vite to copy wasm files from public to dist
export default {
  build: {
    rollupOptions: {
      input: {
        'index.html': 'index.html',
      },
    },
    output: {
      dir: 'dist/bn',
    },
    assets: [
      {
        src: 'public/wasm',
        dest: 'dist/bn/wasm',
      },
    ],
  },
};