const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

test('useFileUpload.ts has a synchronous ref guard to prevent re-entry', () => {
  const source = readFileSync('lib/useFileUpload.ts', 'utf8');
  assert.match(source, /uploadInFlightRef\s*=\s*useRef\(false\)/);
  assert.match(
    source,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
  assert.match(source, /finally \{[\s\S]*uploadInFlightRef\.current = false;/);
});

test('FileUpload.tsx has a synchronous ref guard to prevent re-entry', () => {
  const source = readFileSync('components/FileUpload.tsx', 'utf8');
  assert.match(source, /uploadInFlightRef\s*=\s*useRef\(false\)/);
  assert.match(
    source,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
  assert.match(source, /finally \{[\s\S]*uploadInFlightRef\.current = false;/);
  assert.match(source, /disabled=\{isUploading\}/);
});