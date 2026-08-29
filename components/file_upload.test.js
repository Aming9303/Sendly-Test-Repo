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
  assert.match(source, /const uploadInFlightRef = useRef\(false\)/);
  assert.match(
    source,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
  assert.match(source, /finally \{[\s\S]*uploadInFlightRef\.current = false;/);
});

test('FileUpload has valid a11y attributes without duplicate id or aria-describedby', () => {
  assert.match(source, /<label\s+htmlFor="file-upload-input"/);
  assert.doesNotMatch(source, /id=\{inputId\}/);
  assert.doesNotMatch(source, /aria-describedby=\{describedBy\}/);

  const inputMatches = source.match(/<input[\s\S]*?\/>/);
  assert.ok(inputMatches, 'input element should exist');
  const inputTag = inputMatches[0];

  const idMatches = inputTag.match(/\bid=/g) || [];
  assert.equal(idMatches.length, 1, 'input should have exactly one id attribute');

  const ariaDescribedByMatches = inputTag.match(/\baria-describedby=/g) || [];
  assert.equal(ariaDescribedByMatches.length, 1, 'input should have exactly one aria-describedby attribute');

  assert.match(source, /<p\s+id="file-upload-error"\s+role="alert"/);
  assert.match(source, /<p\s+id="file-upload-status"\s+role="status"/);
});

