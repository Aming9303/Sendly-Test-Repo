const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./components/file_upload_contract.cjs');

const source = readFileSync('lib/useFileUpload.ts', 'utf8');

// Validation, upload, and empty-selection behavior is covered by
// components/file_upload.test.js. Keep this suite focused on the preview URL
// lifecycle so the two files do not encode competing versions of the same
// contract.
test('FileUpload keeps image preview URL cleanup', () => {
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
});
