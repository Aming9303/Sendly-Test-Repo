const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const wrapperSource = readFileSync('upload_file.tsx', 'utf8');
const source = readFileSync('Login.tsx', 'utf8');

test('upload_file re-exports the shared Login implementation', () => {
  assert.match(
    wrapperSource,
    /export \{ IncorrectUpload \} from ['"].\/Login['"]/,
  );
  assert.doesNotMatch(wrapperSource, /useState|fetch\(|new\s+FormData/);
});

test('upload sends the selected file with FormData instead of JSON', () => {
  assert.match(source, /new\s+FormData\s*\(/);
  assert.match(source, /\.append\(\s*['"]file['"]/);
  assert.doesNotMatch(source, /JSON\.stringify/);
  assert.doesNotMatch(source, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('file change stores a single File from the FileList', () => {
  assert.match(source, /setFile\(\s*event\.target\.files\??\.\[0\]/);
});

test('consolidated upload source has no hardcoded endpoint', () => {
  assert.doesNotMatch(wrapperSource, /https?:\/\//);
  assert.doesNotMatch(source, /fetch\(\s*['"]https?:\/\//);
  assert.match(source, /fetch\(endpoint/);
});

test('upload handler uses a synchronous ref guard against re-entry', () => {
  assert.match(source, /const uploadInFlightRef = useRef\(false\)/);
  assert.match(
    source,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
  assert.match(source, /finally \{[\s\S]*uploadInFlightRef\.current = false;/);
});
