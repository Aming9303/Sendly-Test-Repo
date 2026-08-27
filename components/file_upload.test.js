const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');

test('FileUpload validates file size without broken nested loops', () => {
  assert.match(source, /for\s*\(\s*const file of files\s*\)/);
  assert.doesNotMatch(source, /const invalidFileNames/);
  assert.doesNotMatch(source, /errors\.push[\s\S]*const invalidFileNames/);
});

test('FileUpload uploads with multipart FormData when uploadUrl is set', () => {
  assert.match(source, /new\s+FormData\s*\(/);
  assert.match(source, /\.append\(\s*fieldName/);
  assert.doesNotMatch(source, /JSON\.stringify/);
  assert.doesNotMatch(source, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('FileUpload guards empty uploads and in-flight submissions', () => {
  assert.match(source, /if\s*\(\s*selectedFiles\.length === 0\s*\)/);
  assert.match(source, /disabled=\{isUploading\}/);
});

test('FileUpload maps HTTP and network failures to friendly messages', () => {
  assert.match(source, /response\.status >= 400 && response\.status < 500/);
  assert.match(source, /response\.status >= 500/);
  assert.match(source, /navigator\.onLine === false/);
  assert.match(source, /err instanceof TypeError/);
  assert.match(source, /console\.error\('Upload request failed:'/);
  assert.doesNotMatch(source, /Upload failed with status/);
  assert.doesNotMatch(source, /setError\([^)]*err\.message/);
});
