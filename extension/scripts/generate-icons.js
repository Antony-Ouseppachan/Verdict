import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([length, body, crc]);
}

// CRC32 table & calculation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createBigShieldPNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdr);

  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;

    const ny = (y - cy) / cy; // Normalized Y from -1.0 to +1.0

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const nx = (x - cx) / cx; // Normalized X from -1.0 to +1.0

      // Define prominent shield contour that fills 95% of space
      const absX = Math.abs(nx);
      let maxAllowedX = 0;

      if (ny < -0.85) {
        // Top cap
        maxAllowedX = 0;
      } else if (ny <= -0.1) {
        // Upper body: wide shield with slight taper
        maxAllowedX = 0.94 - (ny + 0.85) * 0.08;
      } else {
        // Lower tapering point
        const t = (ny + 0.1) / 1.05; // 0 to 1
        maxAllowedX = 0.88 * Math.max(0, 1 - Math.pow(t, 1.3));
      }

      if (absX <= maxAllowedX && ny >= -0.92 && ny <= 0.95) {
        // Inside shield
        const isBorder =
          absX > maxAllowedX - 0.22 || ny < -0.82 || ny > 0.82;

        if (isBorder) {
          // Vibrant bright emerald border (#10b981 / #34d399)
          rawData[pixelOffset] = 52; // #34d399
          rawData[pixelOffset + 1] = 211;
          rawData[pixelOffset + 2] = 153;
          rawData[pixelOffset + 3] = 255;
        } else {
          // Bold Inner V-Emblem
          const vLeft = absX;
          const expectedV = (ny + 0.5) * 0.65;
          const isV =
            ny >= -0.4 &&
            ny <= 0.45 &&
            Math.abs(vLeft - expectedV) <= 0.18;

          if (isV) {
            // Bright solid emerald V
            rawData[pixelOffset] = 16; // #10b981
            rawData[pixelOffset + 1] = 185;
            rawData[pixelOffset + 2] = 129;
            rawData[pixelOffset + 3] = 255;
          } else {
            // Deep obsidian background (#090e1a)
            rawData[pixelOffset] = 9;
            rawData[pixelOffset + 1] = 14;
            rawData[pixelOffset + 2] = 26;
            rawData[pixelOffset + 3] = 255;
          }
        }
      } else {
        // Transparent outside
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const compressedData = deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = resolve(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

writeFileSync(resolve(iconsDir, 'icon16.png'), createBigShieldPNG(16, 16));
writeFileSync(resolve(iconsDir, 'icon48.png'), createBigShieldPNG(48, 48));
writeFileSync(resolve(iconsDir, 'icon128.png'), createBigShieldPNG(128, 128));

console.log('Successfully generated bold prominent icons (16, 48, 128) in public/icons/');
