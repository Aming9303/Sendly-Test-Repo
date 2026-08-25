const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('upload_file.tsx', 'utf8');

test('upload sends the selected file with FormData instead of JSON', () => {
  assert.match(source, /new\s+FormData\s*\(/);
  assert.match(source, /\.append\(\s*['"]file['"]/);
  assert.doesNotMatch(source, /JSON\.stringify/);
  assert.doesNotMatch(source, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('file change stores a single File from the FileList', () => {
  assert.match(source, /setFile\(\s*event\.target\.files\??\.\[0\]/);
});

test('upload has synchronous ref-based guard against double submit', () => {
  assert.match(source, /isUploadingRef\s*=\s*useRef\(\s*false\s*\)/);
  assert.match(source, /if\s*\(\s*isUploadingRef\.current\s*\)\s*\{\s*return;?\s*\}/);
  assert.match(source, /isUploadingRef\.current\s*=\s*true/);
  assert.match(source, /isUploadingRef\.current\s*=\s*false/);
});
