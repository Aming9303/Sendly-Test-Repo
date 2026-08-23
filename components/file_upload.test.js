const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');
const loginSource = readFileSync('Login.tsx', 'utf8');
const simpleSource = readFileSync('upload_file.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('shared hook validates size and accepted type in one selection pass', () => {
  assert.match(hookSource, /for\s*\(\s*const file of candidates\s*\)/);
  assert.match(hookSource, /file\.size > maxBytes/);
  assert.match(hookSource, /isAcceptedFile\(file, accept\)/);
  assert.match(hookSource, /validFiles\.push\(file\)/);
});

test('shared hook uploads with multipart FormData', () => {
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(fieldName, file, file\.name\)/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('shared hook owns empty and in-flight guards', () => {
  assert.match(hookSource, /if\s*\(\s*selectedFiles\.length === 0\s*\)/);
  assert.match(hookSource, /const uploadInFlightRef = useRef\(false\)/);
  assert.match(source, /disabled=\{isUploading\}/);
});

test('all three upload components delegate logic to useFileUpload', () => {
  for (const componentSource of [source, loginSource, simpleSource]) {
    assert.match(componentSource, /useFileUpload\s*\(/);
    assert.doesNotMatch(componentSource, /\bfetch\s*\(/);
    assert.doesNotMatch(componentSource, /new\s+FormData\s*\(/);
  }
});

test('FileUpload keeps its public props and callback API unchanged', () => {
  for (const prop of [
    'accept?: string',
    'maxSizeMB?: number',
    'multiple?: boolean',
    'uploadUrl?: string',
    'onFilesSelected?: (files: File[]) => void',
    'onUploadSuccess?: () => void',
    'onUploadError?: (message: string) => void',
  ]) {
    assert.ok(source.includes(prop), `missing public prop: ${prop}`);
  }
});
