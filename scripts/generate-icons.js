import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
const publicDir = path.join(process.cwd(), 'public');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Maskable icon with safe-zone margin (512x512 with delicate padding)
  await sharp(svgBuffer)
    .resize(430, 430)
    .extend({
      top: 41,
      bottom: 41,
      left: 41,
      right: 41,
      background: { r: 254, g: 242, b: 244, alpha: 1 } // #FEF2F4
    })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));
  console.log('Generated icon-maskable.png');

  // Favicon PNG (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));
  console.log('Generated favicon-32.png');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
