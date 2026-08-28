const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const {
  UploadHttpError,
  getFriendlyUploadErrorMessage,
} = require('./lib/mapUploadError.cjs');

test('maps 4xx HTTP failures to a friendly client message', () => {
  assert.equal(
    getFriendlyUploadErrorMessage(new UploadHttpError(400)),
    'Upload failed. Please check your file and try again.',
  );
  assert.equal(
    getFriendlyUploadErrorMessage(new UploadHttpError(404)),
    'Upload failed. Please check your file and try again.',
  );
});

test('maps 5xx HTTP failures to a friendly server message', () => {
  assert.equal(
    getFriendlyUploadErrorMessage(new UploadHttpError(500)),
    'Upload service is temporarily unavailable. Please try again later.',
  );
  assert.equal(
    getFriendlyUploadErrorMessage(new UploadHttpError(503)),
    'Upload service is temporarily unavailable. Please try again later.',
  );
});

test('maps network and offline fetch failures to a friendly network message', () => {
  assert.equal(
    getFriendlyUploadErrorMessage(new TypeError('Failed to fetch')),
    'Network error. Please check your connection and try again.',
  );
  assert.equal(
    getFriendlyUploadErrorMessage(new Error('NetworkError when attempting to fetch resource.')),
    'Network error. Please check your connection and try again.',
  );
});

test('useFileUpload throws UploadHttpError and maps errors before setError', () => {
  const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

  assert.match(hookSource, /throw new UploadHttpError\(response\.status\)/);
  assert.match(hookSource, /getFriendlyUploadErrorMessage\(uploadError\)/);
  assert.doesNotMatch(hookSource, /setError\(uploadError\.message\)/);
  assert.match(hookSource, /uploadError\.name === 'AbortError'[\s\S]*return/);
  assert.match(hookSource, /console\.error\('Upload error:', uploadError\)/);
});
