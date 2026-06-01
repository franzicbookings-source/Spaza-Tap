const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const https = require('https');

const LOGO_URL = 'https://i.ibb.co/xqtKGV2G/Chat-GPT-Image-Jun-2-2026-01-21-59-AM-removebg-preview.png';

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        reject(new Error(`Failed with status code: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function generateAll() {
  try {
    const imageBuffer = await downloadImage(LOGO_URL);
    const sourceImage = await loadImage(imageBuffer);

    const iconsDir = path.join(__dirname, 'public', 'icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    function createIcon(size, isMaskable) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Use the burgundy background (#3B1A1A) if maskable or as a base, 
      // but if the logo has a transparent bg we can just fill it.
      ctx.fillStyle = '#3B1A1A';
      ctx.fillRect(0, 0, size, size);

      // Calculate safe area for maskable: center 80% usually
      const padding = isMaskable ? size * 0.2 : size * 0.1;
      const drawSize = size - (padding * 2);

      // Draw the image centered
      ctx.drawImage(sourceImage, padding, padding, drawSize, drawSize);

      return canvas.toBuffer('image/png');
    }

    fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createIcon(192, false));
    fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createIcon(512, false));
    fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192x192.png'), createIcon(192, true));
    fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), createIcon(512, true));
    fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createIcon(180, false));
    fs.writeFileSync(path.join(iconsDir, 'spaza-tap-logo.png'), createIcon(512, false));

    const favCanvas = createCanvas(32, 32);
    const fctx = favCanvas.getContext('2d');
    fctx.fillStyle = '#3B1A1A';
    fctx.fillRect(0, 0, 32, 32);
    fctx.drawImage(sourceImage, 2, 2, 28, 28);
    fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), favCanvas.toBuffer('image/png'));

    console.log('Successfully generated icons from the provided logo url.');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateAll();
