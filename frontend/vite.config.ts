import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    watch: {
      // Tells Vite to stop reloading the page when Python drops new JSON files here!
      ignored: ['**/public/races/**'] 
    }
  }
});