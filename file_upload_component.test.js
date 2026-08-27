const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');

// Unique test: image preview URL lifecycle (not covered by components/file_upload.test.js)
test('FileUpload keeps image preview URL cleanup', () => {
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
});