const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('lib/useFileUpload.ts', 'utf8');

test('shared hook has one coherent validation loop', () => {
  const loops = source.match(/for \(const file of candidates\)/g) || [];
  assert.equal(loops.length, 1);
  assert.match(source, /const validFiles: File\[\] = \[\]/);
  assert.match(source, /const errors: string\[\] = \[\]/);
});

test('shared validator rejects oversized files before selection callbacks', () => {
  assert.match(source, /if \(maxBytes !== null && file\.size > maxBytes\)/);
  assert.match(source, /validFiles\.push\(file\)/);
  assert.match(source, /onFilesSelected\?\.\(validFiles\)/);
});

test('invalid-only selections reset state and the native input', () => {
  assert.match(source, /if \(validFiles\.length === 0\)/);
  assert.match(source, /resetSelection\(\)/);
  assert.match(source, /inputRef\.current\.value = ''/);
});

test('shared previews are created and revoked centrally', () => {
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
});
