import sharp from 'sharp';
import { readFileSync } from 'fs';

const sizes = [192, 512];
const svgBuffer = readFileSync('./static/icon.svg');

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`./static/icon-${size}.png`);
    
    console.log(`✅ Создана иконка ${size}x${size}`);
  }
}

generateIcons().catch(console.error);
