import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'vendor-react';
          }

          if (id.includes('/@mui/') || id.includes('/@emotion/')) {
            return 'vendor-mui';
          }

          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'vendor-charts';
          }

          if (id.includes('/@radix-ui/')) {
            return 'vendor-radix';
          }

          if (id.includes('/lucide-react/') || id.includes('/motion/')) {
            return 'vendor-ui';
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
})
