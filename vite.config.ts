import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { findAvailablePort } from './server/port';

const PREFERRED_WEB_PORT = Number(process.env.VITE_PORT) || 8080;
const API_PORT = Number(process.env.API_PORT) || Number(process.env.PORT) || 3001;

export default defineConfig(async () => {
  const assignedWebPort = Number(process.env.VITE_PORT);
  const port =
    assignedWebPort > 0 ? assignedWebPort : await findAvailablePort(PREFERRED_WEB_PORT);

  if (!assignedWebPort && port !== PREFERRED_WEB_PORT) {
    console.log(`Porta ${PREFERRED_WEB_PORT} occupata: avvio su http://localhost:${port}`);
  }

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${API_PORT}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      strictPort: true,
    },
  };
});
