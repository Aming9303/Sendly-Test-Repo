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

test('Login upload uses a configurable endpoint and rejects empty configuration', () => {
  assert.match(source, /uploadUrl\?: string/);
  assert.match(source, /uploadUrl = getDefaultUploadUrl\(\)/);
  assert.match(source, /SENDLY_UPLOAD_URL/);
  assert.match(source, /const endpoint = uploadUrl\.trim\(\)/);
  assert.match(source, /if \(!endpoint\)/);
  assert.match(source, /Upload URL is not configured\./);
  assert.match(source, /fetch\(endpoint/);
  assert.doesNotMatch(source, /https:\/\/example\.com/);
});
