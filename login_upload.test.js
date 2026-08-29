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
  assert.match(source, /const selectedFile = event\.target\.files\?\.\[0\] \?\? null/);
  assert.match(source, /setFile\(selectedFile\)/);
});

test('Login rejects files larger than the default 5 MB before upload', () => {
  assert.match(source, /maxSizeMB\s*=\s*5/);
  assert.match(
    source,
    /selectedFile\.size\s*>\s*maxSizeMB\s*\*\s*1024\s*\*\s*1024/,
  );
  assert.match(source, /The maximum size is \$\{maxSizeMB\} MB/);

  const sizeGuard = source.indexOf('selectedFile.size > maxSizeMB * 1024 * 1024');
  const fetchCall = source.indexOf('fetch(');
  assert.ok(sizeGuard >= 0 && sizeGuard < fetchCall);

  const rejectedSelection = source.slice(sizeGuard, source.indexOf('setFile(selectedFile)'));
  assert.match(rejectedSelection, /setFile\(null\)/);
  assert.match(rejectedSelection, /event\.target\.value = ""/);
  assert.match(rejectedSelection, /return;/);
  assert.doesNotMatch(rejectedSelection, /fetch\(/);
});

test('Login upload guards empty and in-flight submissions', () => {
  assert.match(source, /if\s*\(\s*!file\s*\)/);
  assert.match(source, /disabled=\{!file \|\| isUploading\}/);
  assert.match(source, /const uploadInFlightRef = useRef\(false\)/);
  assert.match(
    source,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
  assert.match(source, /finally \{[\s\S]*uploadInFlightRef\.current = false;/);
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
