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
});

test('FileUpload falls back safely for invalid maxSizeMB values', () => {
  assert.match(source, /const DEFAULT_MAX_SIZE_MB = 5/);
  assert.match(source, /Number\.isFinite\(value\) && value > 0/);
  assert.match(source, /const safeMaxSizeMB = useMemo/);
  assert.match(source, /file\.size > safeMaxSizeMB \* 1024 \* 1024/);
  assert.match(source, /exceeds \$\{safeMaxSizeMB\}MB limit/);
});

test('invalid maxSizeMB warning is descriptive in development and silent in production', () => {
  assert.match(source, /process\.env\.NODE_ENV !== 'production'/);
  assert.match(
    source,
    /console\.warn\([\s\S]*Invalid maxSizeMB value \$\{String\(value\)\}[\s\S]*falling back to \$\{DEFAULT_MAX_SIZE_MB\}MB/,
  );
});
