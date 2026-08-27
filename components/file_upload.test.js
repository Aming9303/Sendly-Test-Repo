const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./file_upload_contract.cjs');

const source = readFileSync('components/FileUpload.tsx', 'utf8');

test('FileUpload follows the shared file validation contract', () => {
  assertValidationContract(source);
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

test('FileUpload gives every file its own remove control only in multiple mode', () => {
  assert.match(source, /const handleRemoveFile/);
  assert.match(source, /if\s*\(\s*!multiple\s*\)/);
  assert.match(source, /multiple\s*&&\s*\(/);
  assert.match(source, /onClick=\{\(\) => handleRemoveFile\(item\.id\)\}/);
  assert.match(source, /Remove \{item\.file\.name\}/);
});

test('FileUpload keys previews by stable file identity instead of position', () => {
  assert.match(
    source,
    /id: `\$\{file\.name\}:\$\{file\.size\}:\$\{file\.lastModified\}:\$\{nextFileId\.current\+\+\}`/,
  );
  assert.match(source, /key=\{item\.id\}/);
  assert.doesNotMatch(source, /key=\{(?:idx|index)\}/);
});

test('FileUpload revokes only the removed preview and cleans current URLs on unmount', () => {
  assert.match(source, /revokePreview\(fileToRemove\)/);
  assert.match(source, /selectedFilesRef\.current\.forEach\(revokePreview\)/);
  assert.match(source, /useEffect\([\s\S]*?\}, \[\]\);/);
  assert.doesNotMatch(source, /\}, \[selectedFiles\]\);/);
});

test('FileUpload keeps the single-file remove label unchanged', () => {
  assert.match(source, /\{multiple \? 'Remove all' : 'Remove'\}/);
});
