/**
 * Generates build/icon.png and public/icon.png using pure Node.js built-ins (zlib).
 * Creates a 512x512 futuristic icon for PARADOX with temporal grid and cyan/magenta chevron motifs.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height) {
  // RGBA buffer: 4 bytes per pixel + 1 filter byte per scanline
  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    rawData[rowOffset] = 0; // Filter byte: 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded app icon squircle/shield background
      const nx = Math.abs(dx) / (width * 0.44);
      const ny = Math.abs(dy) / (height * 0.44);
      const squircle = Math.pow(nx, 4) + Math.pow(ny, 4);

      if (squircle > 1.0) {
        // Outside border: transparent or outer edge glow
        if (squircle < 1.04) {
          rawData[pxOffset] = 0;     // R
          rawData[pxOffset + 1] = 229; // G (#00e5ff)
          rawData[pxOffset + 2] = 255; // B
          rawData[pxOffset + 3] = Math.floor(255 * (1.04 - squircle) / 0.04);
        } else {
          rawData[pxOffset + 3] = 0; // Transparent
        }
        continue;
      }

      // Base background: dark high-tech gradient (#070b14 -> #0d1527)
      let r = 7 + Math.floor((y / height) * 6);
      let g = 11 + Math.floor((y / height) * 10);
      let b = 20 + Math.floor((y / height) * 20);
      let a = 255;

      // Hexagonal border / circuit ring
      const ringDist = Math.abs(dist - radius * 0.78);
      if (ringDist < 6) {
        const ringAlpha = (6 - ringDist) / 6;
        r = Math.floor(r * (1 - ringAlpha) + 0 * ringAlpha);
        g = Math.floor(g * (1 - ringAlpha) + 229 * ringAlpha);
        b = Math.floor(b * (1 - ringAlpha) + 255 * ringAlpha);
      }

      // Center geometric motif: Temporal Paradox Hourglass / Dual Chevrons
      // Upper chevron (Past / Echo Cyan): apex pointing down
      const inUpperChevron = (y > cy - 140 && y < cy - 20) && (Math.abs(dx) < (cy - 20 - y) * 1.1 + 35) && (Math.abs(dx) > (cy - 20 - y) * 1.1 - 25);
      // Lower chevron (Present / Player Amber-Magenta): apex pointing up
      const inLowerChevron = (y > cy + 20 && y < cy + 140) && (Math.abs(dx) < (y - (cy + 20)) * 1.1 + 35) && (Math.abs(dx) > (y - (cy + 20)) * 1.1 - 25);
      // Core singularity cube in center
      const inCenterCore = Math.abs(dx) < 22 && Math.abs(dy) < 22;

      if (inUpperChevron) {
        r = 0;
        g = 229;
        b = 255;
      } else if (inLowerChevron) {
        r = 255;
        g = 45;
        b = 85;
      } else if (inCenterCore) {
        r = 240;
        g = 245;
        b = 255;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Specification chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0 (Deflate)
  ihdr[11] = 0; // Filter: 0 (Standard)
  ihdr[12] = 0; // Interlace: 0 (No interlace)

  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk (Compressed image data)
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }

  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcTarget = chunk.subarray(4, 8 + len);
  const crcVal = crc32(crcTarget);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

// Generate build/icon.png and public/icon.png
const buildDir = path.resolve('build');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const iconPng = createPng(512, 512);
fs.writeFileSync(path.join(buildDir, 'icon.png'), iconPng);
fs.writeFileSync(path.join(publicDir, 'icon.png'), iconPng);

console.log('Successfully generated 512x512 icons in build/icon.png and public/icon.png');
