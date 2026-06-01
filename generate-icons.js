const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size, isMaskable) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3B1A1A';
  ctx.fillRect(0, 0, size, size);

  // For maskable icons, we need to ensure content is in safe zone (center 0.8)
  // Which actually is fine given we just center text

  // Outer border / accent
  ctx.strokeStyle = '#D94F12';
  ctx.lineWidth = size * 0.05;
  ctx.strokeRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);

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

console.log('Icons generated successfully.');
