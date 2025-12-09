// clean-comments.js
const fs = require('fs');
const path = require('path');

// Những folder sẽ bỏ qua
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build'];

// Định dạng file cần xử lý
const FILE_EXT_REGEX = /\.(js|jsx|ts|tsx)$/;

// Lấy thư mục gốc để quét (mặc định: thư mục hiện tại)
const ROOT_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

function shouldSkipDir(dirPath) {
  const name = path.basename(dirPath);
  return SKIP_DIRS.includes(name);
}

function walkDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!shouldSkipDir(fullPath)) {
        walkDir(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      if (FILE_EXT_REGEX.test(entry.name)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

function cleanFile(filePath) {
  // Không tự sửa chính script này
  if (path.basename(filePath) === 'clean-comments.js') return;

  const original = fs.readFileSync(filePath, 'utf8');

  let cleaned = original;

  // 1) Xoá comment block /* ... */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // 2) Xoá comment dòng //..., nhưng bỏ qua http://, https:// (có '://')
  //    Giữ lại ký tự phía trước (group 1), bỏ phần sau //
  cleaned = cleaned.replace(/(^|[^:])\/\/.*$/gm, '$1');

  // 3) Xoá dòng trống thừa
  cleaned = cleaned.replace(/^\s*\n/gm, '');

  if (cleaned !== original) {
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log('✅ Cleaned:', filePath);
  }
}

console.log('🔍 Scanning folder:', ROOT_DIR);
const files = walkDir(ROOT_DIR);
console.log('📄 Found', files.length, 'files (.js/.jsx/.ts/.tsx)');
files.forEach(cleanFile);
console.log('🎉 Done!');
