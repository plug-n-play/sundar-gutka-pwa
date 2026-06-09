import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const swPath = path.join(distDir, 'sw.js');
const assetsDir = path.join(distDir, 'assets');

try {
  // Find index-*.js and index-*.css files in dist/assets
  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  const cssFile = files.find(f => f.startsWith('index-') && f.endsWith('.css'));

  if (!jsFile || !cssFile) {
    console.error('SW Injection Error: Could not find build assets in dist/assets');
    process.exit(1);
  }

  const jsAsset = `./assets/${jsFile}`;
  const cssAsset = `./assets/${cssFile}`;

  console.log(`SW Injection: Found build assets: ${jsAsset}, ${cssAsset}`);

  // Read dist/sw.js
  let swContent = fs.readFileSync(swPath, 'utf8');

  // We want to insert these files into ASSETS_TO_CACHE.
  const targetPattern = 'const ASSETS_TO_CACHE = [';
  if (!swContent.includes(targetPattern)) {
    console.error('SW Injection Error: Could not find ASSETS_TO_CACHE in sw.js');
    process.exit(1);
  }

  const replacement = `${targetPattern}\n  '${jsAsset}',\n  '${cssAsset}',`;
  swContent = swContent.replace(targetPattern, replacement);

  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log('SW Injection: sw.js updated successfully with dynamic build assets.');
} catch (err) {
  console.error('SW Injection failed:', err);
  process.exit(1);
}
