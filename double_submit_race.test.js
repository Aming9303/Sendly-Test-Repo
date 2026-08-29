const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

test('Login.tsx has a synchronous ref guard to prevent re-entry', () => {
  const source = readFileSync('Login.tsx', 'utf8');
  assert.match(source, /uploadInFlightRef\s*=\s*useRef\(false\)/);
  assert.match(source, /if\s*\(uploadInFlightRef\.current\)/);
  assert.match(source, /uploadInFlightRef\.current\s*=\s*true/);
  assert.match(source, /uploadInFlightRef\.current\s*=\s*false/);
  assert.match(source, /disabled=\{!file\s*\|\|\s*isUploading\}/);
});

test('upload_file.tsx has a synchronous ref guard to prevent re-entry', () => {
  const source = readFileSync('upload_file.tsx', 'utf8');
  assert.match(source, /uploadInFlightRef\s*=\s*useRef\(false\)/);
  assert.match(source, /if\s*\(uploadInFlightRef\.current\)/);
  assert.match(source, /uploadInFlightRef\.current\s*=\s*true/);
  assert.match(source, /uploadInFlightRef\.current\s*=\s*false/);
  assert.match(source, /disabled=\{!file\s*\|\|\s*isUploading\}/);
});

test('FileUpload.tsx has a synchronous ref guard to prevent re-entry', () => {
  const source = readFileSync('components/FileUpload.tsx', 'utf8');
  assert.match(source, /uploadInFlightRef\s*=\s*useRef\(false\)/);
  assert.match(source, /if\s*\(uploadInFlightRef\.current\)/);
  assert.match(source, /uploadInFlightRef\.current\s*=\s*true/);
  assert.match(source, /uploadInFlightRef\.current\s*=\s*false/);
  assert.match(source, /disabled=\{isUploading\}/);
});