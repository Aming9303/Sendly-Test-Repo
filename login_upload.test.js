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

test('Login derives exactly one selected file from shared state', () => {
  assert.match(hookSource, /file: selectedFiles\[0\] \?\? null/);
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
