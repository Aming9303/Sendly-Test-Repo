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

test('upload maps friendly error messages for HTTP status codes, offline and network failures', () => {
  assert.match(source, /response\.status\s*>=\s*400\s*&&\s*response\.status\s*<\s*500/);
  assert.match(source, /response\.status\s*>=\s*500/);
  assert.match(source, /navigator\.onLine/);
  assert.match(source, /console\.error/);
  assert.doesNotMatch(source, /Upload failed with status \$\{response\.status\}/);
});
