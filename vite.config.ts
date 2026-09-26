import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'TMDB_TOKEN'],
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') defaultHandler(warning);
      },
    },
  },
});
