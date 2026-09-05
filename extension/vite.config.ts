import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildSync } from 'esbuild';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [
      react(),
      {
        name: 'bundle-extension-scripts-and-assets',
        closeBundle() {
          const distDir = resolve(__dirname, 'dist');
          if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true });
          }

          // 1. Copy Manifest
          copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));

          // 2. Copy Favicon & Icons
          const faviconSrc = resolve(__dirname, 'public/favicon.svg');
          if (existsSync(faviconSrc)) {
            copyFileSync(faviconSrc, resolve(distDir, 'favicon.svg'));
          }

          const iconsSrcDir = resolve(__dirname, 'public/icons');
          const iconsDistDir = resolve(distDir, 'icons');
          if (existsSync(iconsSrcDir)) {
            if (!existsSync(iconsDistDir)) {
              mkdirSync(iconsDistDir, { recursive: true });
            }
            for (const size of [16, 48, 128]) {
              const iconName = `icon${size}.png`;
              const srcIcon = resolve(iconsSrcDir, iconName);
              if (existsSync(srcIcon)) {
                copyFileSync(srcIcon, resolve(iconsDistDir, iconName));
              }
            }
          }

          // 3. Bundle Content Script as 100% Self-Contained IIFE (No ES module imports)
          buildSync({
            entryPoints: [resolve(__dirname, 'src/content/index.ts')],
            outfile: resolve(distDir, 'content.js'),
            bundle: true,
            format: 'iife',
            minify: false,
            sourcemap: isDev ? 'inline' : false,
            target: ['chrome100', 'edge100'],
            platform: 'browser',
          });

          // 4. Bundle Background Service Worker as Self-Contained ESM
          buildSync({
            entryPoints: [resolve(__dirname, 'src/background/index.ts')],
            outfile: resolve(distDir, 'background.js'),
            bundle: true,
            format: 'esm',
            minify: false,
            sourcemap: isDev ? 'inline' : false,
            target: ['chrome100', 'edge100'],
            platform: 'browser',
          });

          // 5. Clean modulepreload tags from HTML (fixes Chrome extension cross-world resource warning)
          for (const htmlFile of ['popup.html', 'dashboard.html', 'firewall.html']) {
            const htmlPath = resolve(distDir, htmlFile);
            if (existsSync(htmlPath)) {
              let htmlContent = readFileSync(htmlPath, 'utf-8');
              htmlContent = htmlContent.replace(/<link\s+rel=["']modulepreload["'][^>]*>\s*/gi, '');
              writeFileSync(htmlPath, htmlContent, 'utf-8');
            }
          }

          // 6. Mirror runtime scripts to root folder if needed
          try {
            copyFileSync(resolve(distDir, 'background.js'), resolve(__dirname, 'background.js'));
            copyFileSync(resolve(distDir, 'content.js'), resolve(__dirname, 'content.js'));
          } catch {
            // ignore
          }
        },
      },
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      modulePreload: false,
      sourcemap: isDev ? 'inline' : false,
      minify: !isDev,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'popup.html'),
          dashboard: resolve(__dirname, 'dashboard.html'),
          firewall: resolve(__dirname, 'firewall.html'),
        },
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        reporter: ['text', 'json', 'html'],
      },
    },
  };
});
