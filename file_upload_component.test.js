const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./components/file_upload_contract.cjs');

const source = readFileSync('lib/useFileUpload.ts', 'utf8');

test('FileUpload follows the shared file validation contract', () => {
  assertValidationContract(source);
});

test('FileUpload resets invalid selections and only reports valid files', () => {
  assert.match(source, /inputRef\.current\.value = ''/);
  assert.match(source, /setSelectedFiles\(validFiles\)/);
  assert.match(source, /onFilesSelected\?\.\(validFiles\)/);
  assert.doesNotMatch(source, /onFilesSelected\?\.\(files\)/);
});

test('FileUpload keeps image preview URL cleanup', () => {
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
});
