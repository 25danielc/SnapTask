import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const svgPath = join(process.cwd(), 'public', 'icon.svg');
const svg = readFileSync(svgPath);

// Generate different icon sizes
const sizes = [
  { name: 'icon-light-32x32.png', size: 32 },
  { name: 'icon-dark-32x32.png', size: 32 },
  { name: 'apple-icon.png', size: 180 },
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    const outputPath = join(process.cwd(), 'public', name);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${name}`);
  }
}

generateIcons().catch(console.error);

