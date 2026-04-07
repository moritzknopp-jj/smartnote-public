const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const standaloneRoot = path.join(root, '.next', 'standalone');
const standaloneDist = path.join(standaloneRoot, '.next');
const srcStatic = path.join(root, '.next', 'static');
const dstStatic = path.join(standaloneDist, 'static');
const srcPublic = path.join(root, 'public');
const dstPublic = path.join(standaloneRoot, 'public');

function ensureExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

function copyDir(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
}

function main() {
  ensureExists(standaloneRoot, 'Standalone output');
  ensureExists(srcStatic, 'Next static assets');

  copyDir(srcStatic, dstStatic);

  if (fs.existsSync(srcPublic)) {
    copyDir(srcPublic, dstPublic);
  }

  console.log(`Copied static assets to ${dstStatic}`);
  if (fs.existsSync(srcPublic)) {
    console.log(`Copied public assets to ${dstPublic}`);
  }
}

main();
