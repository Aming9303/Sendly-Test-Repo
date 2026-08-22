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
  assert.match(source, /setFile\(event\.target\.files\?\.\[0\] \?\? null\)/);
});

test('Login upload guards empty and in-flight submissions', () => {
  assert.match(source, /if\s*\(\s*!file\s*\)/);
  assert.match(source, /disabled=\{!file \|\| isUploading\}/);
});

test('Login upload maps friendly error messages for HTTP status codes, offline and network failures', () => {
  assert.match(source, /response\.status\s*>=\s*400\s*&&\s*response\.status\s*<\s*500/);
  assert.match(source, /response\.status\s*>=\s*500/);
  assert.match(source, /navigator\.onLine/);
  assert.match(source, /console\.error/);
  assert.doesNotMatch(source, /Upload failed with status \$\{response\.status\}/);
});
