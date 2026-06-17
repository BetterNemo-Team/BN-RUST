const fs = require('fs');
const path = require('path');

const bundle = fs.readFileSync('D:/dev/better-nemo-main/public/bn/workspace.bundle.106e91c62fadbbb3c3b7.js', 'utf8');
const outDir = 'D:/dev/better-nemo-main/decompiled';
fs.mkdirSync(outDir, { recursive: true });

console.log(`Bundle: ${(bundle.length / 1024 / 1024).toFixed(1)}MB`);

// 模块边界：/***/ "./path/to/file.ts":
const pattern = /\/\*\*\*\/\s*"\.\/([\s\S]*?)":\s*\n/g;
let match;
let count = 0;
const modules = [];

while ((match = pattern.exec(bundle)) !== null) {
  const moduleName = match[1];
  const start = match.index;
  
  // 找模块结尾：下一个 /***/ 或文件末尾
  const nextModStart = bundle.indexOf('/***/', start + 50);
  const end = nextModStart > 0 ? nextModStart : bundle.length;
  const moduleCode = bundle.substring(start, end);
  
  // 只提取项目模块
  if (moduleName.startsWith('src/') || 
      moduleName === 'node_modules/dsbridge/index.js' ||
      moduleName.startsWith('node_modules/@crc/')) {
    modules.push({ name: moduleName, code: moduleCode });
  }
}

console.log(`Project modules: ${modules.length}`);

// 写入文件
for (const mod of modules) {
  const safeName = mod.name.replace(/[\/\\:]/g, '_');
  fs.writeFileSync(path.join(outDir, safeName + '.js'), mod.code);
}

// 索引
const index = modules.map(m => `${m.name} (${(m.code.length / 1024).toFixed(1)}KB)`).join('\n');
fs.writeFileSync(path.join(outDir, '_INDEX.txt'), `Workspace Bundle - ${modules.length} modules\n${'='.repeat(60)}\n${index}`);

console.log(`Done: ${modules.length} modules → ${outDir}/`);
