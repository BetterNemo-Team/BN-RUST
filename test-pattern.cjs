const fs = require('fs');
const b = fs.readFileSync('D:/dev/better-nemo-main/public/bn/workspace.bundle.106e91c62fadbbb3c3b7.js', 'utf8');

// The module boundary pattern is:
// /***/ "./src/common/redux/index.ts":
// /*!**!*** ... */
// /***/ (function(

// Let's find all occurrences of the pattern
const pattern = /\*\/\s*"\.\/([\s\S]*?)":\s*\n/g;
let count = 0;
let match;
const samples = [];

while ((match = pattern.exec(b)) !== null) {
  count++;
  if (count <= 5) {
    samples.push(match[1]);
  }
}

console.log(`Pattern matches: ${count}`);
console.log(`First 5 modules:`, samples);

// Try to find the actual module boundary
const idx = b.indexOf('"./src/common/redux/index.ts"');
console.log('\nDirect search for "./src/common/redux/index.ts":', idx);

// Get context around it
if (idx > 0) {
  const context = b.substring(idx - 50, idx + 100);
  console.log('Context:', JSON.stringify(context));
}
