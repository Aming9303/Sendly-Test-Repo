const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const uploadFileSource = readFileSync('upload_file.tsx', 'utf8');
const loginSource = readFileSync('Login.tsx', 'utf8');

test('upload_file.tsx consolidates and re-exports shared Login implementation', () => {
  assert.match(uploadFileSource, /export\s+\{\s*IncorrectUpload\s*\}\s+from\s+['"]\.\/Login['"]/);
});

test('consolidated source sends the selected file with FormData instead of JSON', () => {
  assert.match(loginSource, /new\s+FormData\s*\(/);
  assert.match(loginSource, /\.append\(\s*['"]file['"],\s*file,\s*file\.name\s*\)/);
  assert.doesNotMatch(loginSource, /JSON\.stringify/);
  assert.doesNotMatch(loginSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('consolidated source stores a single File from the FileList', () => {
  assert.match(loginSource, /setFile\(\s*event\.target\.files\??\.\[0\]\s*\?\?\s*null\)/);
});

test('no hardcoded endpoint remains in upload_file.tsx or Login.tsx', () => {
  assert.doesNotMatch(uploadFileSource, /https?:\/\//);
  assert.doesNotMatch(loginSource, /fetch\(\s*['"]https?:\/\//);
});

test('upload has synchronous ref-based guard against double submit', () => {
  assert.match(source, /isUploadingRef\s*=\s*useRef\(\s*false\s*\)/);
  assert.match(source, /if\s*\(\s*isUploadingRef\.current\s*\)\s*\{\s*return;?\s*\}/);
  assert.match(source, /isUploadingRef\.current\s*=\s*true/);
  assert.match(source, /isUploadingRef\.current\s*=\s*false/);
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

test('upload maps HTTP and network failures to friendly messages', () => {
  assert.match(source, /response\.status >= 400 && response\.status < 500/);
  assert.match(source, /response\.status >= 500/);
  assert.match(source, /navigator\.onLine === false/);
  assert.match(source, /err instanceof TypeError/);
  assert.match(source, /console\.error\('Upload request failed:'/);
  assert.doesNotMatch(source, /Upload failed with status/);
  assert.doesNotMatch(source, /setError\([^)]*err\.message/);
});
