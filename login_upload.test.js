const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('Login.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('Login sends binary data through the shared multipart uploader', () => {
  assert.match(source, /useFileUpload\s*\(/);
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(fieldName, file, file\.name\)/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
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
});

test('shared upload guard is synchronous rather than state-timing dependent', () => {
  assert.match(hookSource, /const uploadInFlightRef = useRef\(false\)/);
  assert.match(
    hookSource,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadInFlightRef\.current = false;/);
});

test('Login is a presentation wrapper with no duplicated upload implementation', () => {
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /new\s+FormData\s*\(/);
  assert.doesNotMatch(source, /useState/);
});
