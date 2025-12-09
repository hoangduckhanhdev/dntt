
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build'];
const FILE_EXT_REGEX = /\.(js|jsx|ts|tsx)$/;

const ROOT_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

function shouldSkipDir(dirPath) {
  return SKIP_DIRS.includes(path.basename(dirPath));
}

function walk(dir, list = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const f of files) {
    const full = path.join(dir, f.name);

    if (f.isDirectory()) {
      if (!shouldSkipDir(full)) walk(full, list);
    } else if (FILE_EXT_REGEX.test(f.name)) {
      list.push(full);
    }
  }
  return list;
}

function clean(file) {
  let code = fs.readFileSync(file, "utf8");
  let original = code;
  code = code.replace(/\/\*[\s\S]*?\*\//g, "");
  code = code.replace(/(^|[^:])\/\/.*$/gm, "$1");
  code = code.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
  code = code.replace(/^\s*\n/gm, "");
  if (code !== original) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ Cleaned:", file);
  }
}

console.log("🔍 Scanning:", ROOT_DIR);
const list = walk(ROOT_DIR);
console.log("📄 Found", list.length, "files");

list.forEach(clean);
console.log("🎉 Done!");
