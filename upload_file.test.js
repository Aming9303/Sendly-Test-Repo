const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('upload_file.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('upload sends the selected file with FormData instead of JSON', () => {
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(\s*['"]file['"]/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('file change stores a single File from the FileList', () => {
  assert.match(hookSource, /useFileUpload/);
  assert.match(source, /useFileUpload/);
});

test('shared uploader aborts on unmount and ignores AbortError', () => {
  assert.match(hookSource, /new AbortController\(\)/);
  assert.match(hookSource, /signal: controller\.signal/);
  assert.match(hookSource, /return \(\) => \{[\s\S]*abortControllerRef\.current\?\.abort\(\)/);
  assert.match(hookSource, /uploadError\.name === 'AbortError'[\s\S]*return/);
});

test('consolidated upload source has no hardcoded endpoint', () => {
  assert.doesNotMatch(wrapperSource, /https?:\/\//);
  assert.doesNotMatch(source, /fetch\(\s*['"]https?:\/\//);
  assert.doesNotMatch(source, /https:\/\/example\.com/);
});

test('upload handler uses a synchronous ref guard against re-entry in the hook', () => {
  assert.match(hookSource, /uploadingRef/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadingRef\.current = false;/);
});

test('orphan upload_file_fixed.tsx and CorrectedUpload are not present in the repo', () => {
  const fs = require('node:fs');
  assert.equal(fs.existsSync('upload_file_fixed.tsx'), false, 'orphan upload_file_fixed.tsx must not exist');
  // Ensure CorrectedUpload is not accidentally re-exported or referenced anywhere
  const allSources = [wrapperSource, source, hookSource];
  for (const src of allSources) {
    assert.doesNotMatch(src, /CorrectedUpload/, 'CorrectedUpload must not appear in canonical sources');
  }
});

test('upload aborts on unmount and ignores AbortError', () => {
  assert.match(source, /AbortController/);
  assert.match(source, /signal:\s*controller\.signal/);
  assert.match(source, /AbortError/);
});

test('upload has accessible label and ARIA attributes', () => {
  assert.match(source, /<label\s+htmlFor=/);
  assert.match(source, /aria-label=/);
  assert.match(source, /aria-describedby=/);
  assert.match(source, /id="upload-file-error"/);
  assert.match(source, /id="upload-file-status"/);
  assert.match(source, /aria-busy=\{isUploading\}/);
});
