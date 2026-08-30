const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('Login.tsx delegates upload re-entry guard to useFileUpload', () => {
  const source = readFileSync('Login.tsx', 'utf8');
  assert.match(source, /useFileUpload\s*\(/);
  assert.doesNotMatch(source, /uploadingRef\s*=\s*useRef/);
  assert.match(hookSource, /uploadInFlightRef/);
  assert.match(
    hookSource,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
});

test('upload_file.tsx delegates upload re-entry guard to Login/useFileUpload', () => {
  const source = readFileSync('upload_file.tsx', 'utf8');
  assert.match(source, /export \{ IncorrectUpload \} from ['"]\.\/Login['"]/);
  assert.doesNotMatch(source, /uploadingRef\s*=\s*useRef/);
  assert.match(hookSource, /uploadInFlightRef/);
});

test('FileUpload.tsx delegates upload re-entry guard to useFileUpload', () => {
  const source = readFileSync('components/FileUpload.tsx', 'utf8');
  const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');
  assert.match(source, /useFileUpload\s*\(/);
  assert.doesNotMatch(source, /uploadingRef\s*=\s*useRef/);
  assert.match(hookSource, /uploadInFlightRef/);
  assert.match(source, /disabled=\{isUploading\}/);
});