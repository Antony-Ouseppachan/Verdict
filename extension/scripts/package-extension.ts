import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function packageExtension(): Promise<void> {
  const distDir = resolve(__dirname, '../dist');
  const releaseDir = resolve(__dirname, '../release');
  const outputFile = resolve(releaseDir, 'verdict-extension.zip');

  if (!existsSync(distDir)) {
    console.error('Error: "dist/" directory does not exist. Please run "npm run build" first.');
    process.exit(1);
  }

  if (!existsSync(releaseDir)) {
    mkdirSync(releaseDir, { recursive: true });
  }

  const output = createWriteStream(outputFile);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  return new Promise((resolvePromise, rejectPromise) => {
    output.on('close', () => {
      const sizeKb = (archive.pointer() / 1024).toFixed(2);
      console.log(`\nSuccessfully packaged Verdict Extension:`);
      console.log(`Output: ${outputFile} (${sizeKb} KB)`);
      console.log(`To test unpacked in Chrome: Navigate to chrome://extensions, enable "Developer mode", and click "Load unpacked" targeting the "dist/" folder.\n`);
      resolvePromise();
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        rejectPromise(err);
      }
    });

    archive.on('error', (err) => {
      rejectPromise(err);
    });

    archive.pipe(output);
    archive.directory(distDir, false);
    archive.finalize();
  });
}

packageExtension().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
