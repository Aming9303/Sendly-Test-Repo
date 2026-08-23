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

test('file input has a unique label and linked feedback regions', () => {
  assert.match(source, /const inputId = useId\(\)/);
  assert.match(source, /<label htmlFor=\{inputId\}>Select a file<\/label>/);
  assert.match(source, /id=\{inputId\}/);
  assert.match(source, /aria-describedby=\{describedBy\}/);
  assert.match(source, /<p id=\{statusId\} role="status">/);
  assert.match(source, /<p id=\{errorId\} role="alert"/);
});

test('upload button exposes its busy state with discernible text', () => {
  assert.match(source, /aria-busy=\{isUploading\}/);
  assert.match(source, /\{isUploading \? 'Uploading\.\.\.' : 'Upload'\}/);
});
