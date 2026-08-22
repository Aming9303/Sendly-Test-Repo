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

test('upload has accessible label and ARIA attributes', () => {
  assert.match(source, /<label\s+htmlFor=/);
  assert.match(source, /aria-label=/);
  assert.match(source, /aria-describedby=/);
  assert.match(source, /id="upload-file-error"/);
  assert.match(source, /id="upload-file-status"/);
  assert.match(source, /aria-busy=\{isUploading\}/);
});
