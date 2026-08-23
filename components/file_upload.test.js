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

test('picker and drop paths both use the same size, type, and count validator', () => {
  assert.match(source, /const validateAndSelectFiles = useCallback/);
  assert.match(source, /validateAndSelectFiles\(Array\.from\(event\.target\.files/);
  assert.match(source, /validateAndSelectFiles\(Array\.from\(event\.dataTransfer\.files/);
  assert.match(source, /file\.size > maxSizeMB \* 1024 \* 1024/);
  assert.match(source, /matchesAcceptedType\(file, accept\)/);
  assert.match(source, /!multiple && incomingFiles\.length > 1/);
  assert.doesNotMatch(source, /setSelectedFiles\(event\.dataTransfer\.files/);
});

test('dropzone prevents browser navigation and shows dragover affordance', () => {
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /onDragOver=\{handleDragOver\}/);
  assert.match(source, /onDrop=\{handleDrop\}/);
  assert.match(source, /data-drag-active=\{isDragging \? 'true' : 'false'\}/);
  assert.match(source, /isDragging \? 'Drop files here\.'/);
});
