const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./file_upload_contract.cjs');

const source = readFileSync('components/FileUpload.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('FileUpload validates file size without broken nested loops', () => {
  assert.match(hookSource, /for\s*\(\s*const file of files\s*\)/);
  assert.doesNotMatch(hookSource, /const invalidFileNames/);
  assert.doesNotMatch(hookSource, /errors\.push[\s\S]*const invalidFileNames/);
});

test('FileUpload uploads with multipart FormData when uploadUrl is set', () => {
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(\s*fieldName/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('FileUpload guards empty uploads and in-flight submissions', () => {
  assert.match(hookSource, /if\s*\(\s*selectedFiles\.length === 0\s*\)/);
  assert.match(source, /disabled=\{isUploading\}/);
});

test('FileUpload provides per-file remove button in multi-file mode', () => {
  assert.match(source, /handleRemoveFile/);
  assert.match(source, /multiple\s*&&\s*\(/);
  assert.match(source, /onClick=\{.*handleRemoveFile/);
});

test('FileUpload uses stable unique keys instead of array index for previews', () => {
  assert.doesNotMatch(source, /key=\{idx\}/);
  assert.doesNotMatch(source, /key=\{index\}/);
  assert.match(source, /key=\{item\.id\}/);
});

test('FileUpload revokes object URLs on single file removal', () => {
  assert.match(source, /URL\.revokeObjectURL\(itemToRemove\.previewUrl\)/);
});
