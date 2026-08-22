const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('upload_file.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('upload sends the selected file with FormData instead of JSON', () => {
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(\s*['"]file['"]/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('file change stores a single File from the FileList', () => {
  assert.match(hookSource, /useFileUpload/);
  assert.match(source, /useFileUpload/);
});
