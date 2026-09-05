import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import http from 'node:http';

function autoStartBackendPlugin(): Plugin {
  let backendProcess: ChildProcess | null = null;

  return {
    name: 'auto-start-verdict-backend',
    configureServer(server) {
      const rootDir = resolve(__dirname, '..');

      // Check if backend is already running on port 8000
      const req = http.get('http://127.0.0.1:8000/api/health', (res) => {
        if (res.statusCode === 200) {
          console.log('\x1b[32m[Verdict] Python Backend is already active on port 8000.\x1b[0m');
        }
      });

      req.on('error', () => {
        console.log('\x1b[36m[Verdict] Automatically starting Python ML Backend on port 8000...\x1b[0m');
        backendProcess = spawn(
          'python',
          ['-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', '8000'],
          {
            cwd: rootDir,
            stdio: 'inherit',
            shell: true,
          }
        );

        backendProcess.on('error', (err) => {
          console.error('\x1b[31m[Verdict] Failed to auto-start backend:\x1b[0m', err.message);
        });
      });

      const cleanup = () => {
        if (backendProcess && !backendProcess.killed) {
          console.log('\x1b[33m[Verdict] Shutting down auto-started backend...\x1b[0m');
          try {
            backendProcess.kill();
          } catch {
            // ignore
          }
          backendProcess = null;
        }
      };

      server.httpServer?.on('close', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('exit', cleanup);
    },
  };
}

export default defineConfig({
  plugins: [react(), autoStartBackendPlugin()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
});

