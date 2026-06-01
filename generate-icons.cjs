const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size, isMaskable) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3B1A1A';
  ctx.fillRect(0, 0, size, size);

  // Outer border / accent
  ctx.strokeStyle = '#D94F12';
  ctx.lineWidth = size * 0.05;
  
  if (isMaskable) {
    // Keep everything well within the safe zone (center 0.8)
    ctx.strokeRect(size * 0.15, size * 0.15, size * 0.7, size * 0.7);
  } else {
    ctx.strokeRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9);
  }

  // Text
  ctx.fillStyle = '#FBF5EC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Font size relative to size
  ctx.font = `bold ${size * 0.4}px sans-serif`;
  ctx.fillText('ST', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate files
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), drawIcon(192, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), drawIcon(512, false));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192x192.png'), drawIcon(192, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), drawIcon(512, true));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), drawIcon(180, false));
fs.writeFileSync(path.join(iconsDir, 'spaza-tap-logo.png'), drawIcon(512, false));

const favCanvas = createCanvas(32, 32);
const fctx = favCanvas.getContext('2d');
fctx.fillStyle = '#3B1A1A';
fctx.fillRect(0, 0, 32, 32);
fctx.fillStyle = '#FBF5EC';
fctx.textAlign = 'center';
fctx.textBaseline = 'middle';
fctx.font = 'bold 16px sans-serif';
fctx.fillText('ST', 16, 16);
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), favCanvas.toBuffer('image/png'));
console.log('Icons generated successfully.');
