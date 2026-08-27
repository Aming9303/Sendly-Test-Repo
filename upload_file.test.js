const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const wrapperSource = readFileSync('upload_file.tsx', 'utf8');
const source = readFileSync('Login.tsx', 'utf8');

test('upload_file re-exports the shared Login implementation', () => {
  assert.match(
    wrapperSource,
    /export \{ IncorrectUpload \} from ['"]\.\/Login['"]/,
  );
  assert.doesNotMatch(wrapperSource, /useState|fetch\(|new\s+FormData/);
});

test('upload_file consumes the shared multipart uploader', () => {
  assert.match(source, /useFileUpload\s*\(/);
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(fieldName, file, file\.name\)/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
});

test('upload_file is a thin wrapper around shared file selection state', () => {
  assert.match(hookSource, /file: selectedFiles\[0\] \?\? null/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /new\s+FormData\s*\(/);
  assert.doesNotMatch(source, /useState/);
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
  assert.match(source, /fetch\(endpoint/);
});
