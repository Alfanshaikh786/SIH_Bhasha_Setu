import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    host: true,
    watch: {
      ignored: ['**/*.csv', '**/.system_generated/**']
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/sql.js')) {
            return 'vendor-sql';
          }
          if (id.includes('node_modules/tesseract.js')) {
            return 'vendor-ocr';
          }
          if (id.includes('src/data/santaliDataset')) {
            return 'santali-dataset';
          }
        }
      }
    }
  }
});
