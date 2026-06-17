const fs = require('fs');
const path = require('path');

const bundle = fs.readFileSync('D:/dev/better-nemo-main/public/bn/workspace.bundle.106e91c62fadbbb3c3b7.js', 'utf8');
const outDir = 'D:/dev/better-nemo-main/decompiled';
fs.mkdirSync(outDir, { recursive: true });

// Key modules to extract
const modules = [
  { name: 'redux/index', search: '"./src/common/redux/index.ts":' },
  { name: 'redux/utils', search: '"./src/common/redux/utils.ts":' },
  { name: 'bridge/index', search: '"./src/webview/bridge/index.ts":' },
  { name: 'dsbridge/index', search: '"./node_modules/dsbridge/index.js":' },
  { name: 'redux/sages/index', search: '"./src/webview/redux/sages/index.ts":' },
  { name: 'utils/log', search: '"./src/common/utils/log.ts":' },
  { name: 'bcm/saga', search: 'load_bcm_from_source' },
  { name: 'message_handler', search: "window.addEventListener('message'" },
];

let count = 0;
for (const mod of modules) {
  const idx = bundle.indexOf(mod.search);
  if (idx < 0) continue;
  
  // Find the module boundary (webpack comment markers)
  let start = bundle.lastIndexOf('/***/', idx);
  if (start < 0) start = Math.max(0, idx - 200);
  
  // Extract a reasonable chunk
  const chunk = bundle.substring(start, Math.min(start + 8000, bundle.length));
  const safeName = mod.name.replace(/[\/\\]/g, '_');
  fs.writeFileSync(path.join(outDir, safeName + '.js'), chunk);
  count++;
  console.log('Extracted:', mod.name, 'at offset', start, 'size:', chunk.length);
}

console.log('Done. Extracted', count, 'modules');
