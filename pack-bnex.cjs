// pack-bnex.js — 将扩展目录打包为 .bnex 文件
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function pack(dirPath, outputPath) {
  const zip = new JSZip();

  const manifestPath = path.join(dirPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('manifest.json not found in', dirPath);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file === 'manifest.json') continue;
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) continue;
    zip.file(file, fs.readFileSync(filePath));
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, buffer);
  console.log(`Packed ${dirPath} → ${outputPath} (${buffer.length} bytes)`);
}

const [,, dir, out] = process.argv;
if (!dir || !out) {
  console.log('Usage: node pack-bnex.js <dir> <output.bnex>');
  process.exit(1);
}
pack(path.resolve(dir), path.resolve(out));
