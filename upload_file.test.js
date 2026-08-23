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

test('upload aborts on unmount and treats AbortError as cancellation', () => {
  assert.match(source, /new AbortController\(\)/);
  assert.match(source, /signal: controller\.signal/);
  assert.match(source, /return \(\) => \{[\s\S]*abortControllerRef\.current\?\.abort\(\)/);
  assert.match(source, /err\.name === ["']AbortError["'][\s\S]*return/);
  assert.match(source, /if \(isMountedRef\.current\)[\s\S]*setIsUploading\(false\)/);
});
