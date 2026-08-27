const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');

test('FileUpload validates file size without broken nested loops', () => {
  assert.match(source, /for\s*\(\s*const file of files\s*\)/);
  assert.doesNotMatch(source, /const invalidFileNames/);
  assert.doesNotMatch(source, /errors\.push[\s\S]*const invalidFileNames/);
});

test('FileUpload uploads with multipart FormData when uploadUrl is set', () => {
  assert.match(source, /new\s+FormData\s*\(/);
  assert.match(source, /\.append\(\s*fieldName/);
  assert.doesNotMatch(source, /JSON\.stringify/);
  assert.doesNotMatch(source, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('FileUpload guards empty uploads and in-flight submissions', () => {
  assert.match(source, /if\s*\(\s*selectedFiles\.length === 0\s*\)/);
  assert.match(source, /disabled=\{isUploading\}/);
  assert.match(source, /const uploadInFlightRef = useRef\(false\)/);
  assert.match(
    source,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
});

test('FileUpload uses a real form submit path for keyboard activation', () => {
  assert.match(source, /<form onSubmit=\{handleSubmit\}>/);
  assert.match(source, /<button type="submit" disabled=\{isUploading\}>/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /void handleUpload\(\)/);
});

test('form submit is guarded when empty or already in flight', () => {
  assert.match(
    source,
    /if \(selectedFiles\.length === 0 \|\| uploadInFlightRef\.current\) \{[\s\S]*?return;/,
  );
  assert.match(source, /finally \{[\s\S]*uploadInFlightRef\.current = false;/);
  assert.doesNotMatch(source, /type="submit" onClick=/);
});
