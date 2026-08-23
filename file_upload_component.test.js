const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');

test('FileUpload has one coherent validation loop for selected files', () => {
  assert.equal((source.match(/for \(const file of files\)/g) || []).length, 1);
  assert.match(source, /const validFiles: File\[\] = \[\]/);
  assert.match(source, /const errors: string\[\] = \[\]/);
  assert.doesNotMatch(source, /const invalidFileNames/);
});

test('FileUpload preserves size validation before type validation', () => {
  const sizeCheck = source.indexOf('if (file.size > maxSizeMB * 1024 * 1024)');
  const typeCheck = source.indexOf('if (!isFileTypeAccepted(file, accept))');

  assert.notEqual(sizeCheck, -1);
  assert.notEqual(typeCheck, -1);
  assert.ok(sizeCheck < typeCheck);
  assert.match(source, /File \"\$\{file\.name\}\" exceeds \$\{maxSizeMB\}MB limit\./);
  assert.match(source, /validFiles\.push\(file\)/);
  assert.match(source, /onFilesSelected\?\.\(validFiles\)/);
});

test('FileUpload validates MIME and extension rules from accept', () => {
  assert.match(source, /acceptedType\.startsWith\('\.'\)/);
  assert.match(source, /acceptedType\.endsWith\('\/\*'\)/);
  assert.match(source, /mimeType === acceptedType/);
  assert.match(source, /Allowed types: \$\{accept\}/);
});

test('FileUpload resets invalid-only selections', () => {
  assert.match(source, /validFiles\.length === 0/);
  assert.match(source, /setSelectedFiles\(\[\]\)/);
  assert.match(source, /setPreviews\(\[\]\)/);
  assert.match(source, /inputRef\.current\.value = ''/);
});

test('FileUpload keeps image preview URL cleanup', () => {
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
});
