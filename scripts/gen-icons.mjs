/**
 * Genera íconos PNG para el PWA manifest.
 * Usa sharp (SVG → PNG). Correr con: node scripts/gen-icons.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';

const PURPLE = '#7C5CFA';
const BG_DARK = '#0B0814';

// SVG base para ícono estándar (contenido llena el 80% — safe zone para maskable)
function iconSVG(size, padding = 0.12) {
  const pad = Math.round(size * padding);
  const inner = size - pad * 2;
  const rx = Math.round(size * 0.22);  // radio de esquinas
  const fontSize = Math.round(inner * 0.72);
  const textX = Math.round(pad + inner * 0.07);
  const textY = Math.round(pad + inner * 0.84);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG_DARK}"/>
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${rx}" fill="${PURPLE}"/>
  <text x="${textX}" y="${textY}" font-size="${fontSize}" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">💸</text>
</svg>`;
}

// Maskable: fondo llena todo el cuadrado (sin radio de esquinas en el outer rect)
function maskableSVG(size) {
  const rx = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.54);
  const textX = Math.round(size * 0.08);
  const textY = Math.round(size * 0.78);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="${PURPLE}"/>
  <text x="${textX}" y="${textY}" font-size="${fontSize}" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">💸</text>
</svg>`;
}

async function gen(svgStr, outPath) {
  await sharp(Buffer.from(svgStr))
    .png()
    .toFile(outPath);
  console.log('✅', outPath);
}

await gen(iconSVG(192),        'public/icons/icon-192.png');
await gen(iconSVG(512),        'public/icons/icon-512.png');
await gen(maskableSVG(192),    'public/icons/icon-maskable-192.png');
await gen(maskableSVG(512),    'public/icons/icon-maskable-512.png');
// Apple touch icon (180x180, PNG requerido por iOS)
await gen(maskableSVG(180),    'public/icons/apple-touch-icon.png');

console.log('\n🎉 Íconos generados en public/icons/');
