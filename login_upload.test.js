const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('Login.tsx', 'utf8');

test('Login upload sends binary data as multipart FormData', () => {
  assert.match(source, /new\s+FormData\s*\(/);
  assert.match(source, /\.append\(\s*['"]file['"],\s*file,\s*file\.name\s*\)/);
  assert.doesNotMatch(source, /JSON\.stringify/);
  assert.doesNotMatch(source, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('Login upload stores exactly one selected File in state', () => {
  assert.match(source, /useState<File \| null>\(null\)/);
  assert.match(source, /selectedFile/);
});

test('Login upload validates file size against maxSizeMB limit', () => {
  assert.match(source, /maxSizeMB\s*=\s*5/);
  assert.match(source, /selectedFile\.size\s*>\s*maxSizeMB\s*\*\s*1024\s*\*\s*1024/);
  assert.match(source, /exceeds\s*\$\{maxSizeMB\}MB\s*limit/);
});

test('Login upload guards empty and in-flight submissions', () => {
  assert.match(source, /if\s*\(\s*!file\s*\)/);
  assert.match(source, /disabled=\{!file \|\| isUploading\}/);
});
