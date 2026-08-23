const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('Login.tsx', 'utf8');

test('Login upload sends binary data as multipart FormData', () => {
  assert.match(source, /new\s+FormData\s*\(/);
  assert.match(source, /\.append\(\s*['"]file['"],\s*file,\s*file\.name\s*\)/);
  assert.doesNotMatch(source, /JSON\.stringify/);
  assert.doesNotMatch(source, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('Login upload stores exactly one selected File in state', () => {
  assert.match(source, /useState<File \| null>\(null\)/);
  assert.match(source, /setFile\(event\.target\.files\?\.\[0\] \?\? null\)/);
});

test('Login upload guards empty and in-flight submissions', () => {
  assert.match(source, /if\s*\(\s*!file\s*\)/);
  assert.match(source, /disabled=\{!file \|\| isUploading\}/);
});

test('Login file input has a unique label and linked feedback regions', () => {
  assert.match(source, /const inputId = useId\(\)/);
  assert.match(source, /<label htmlFor=\{inputId\}>Select a file<\/label>/);
  assert.match(source, /id=\{inputId\}/);
  assert.match(source, /aria-describedby=\{describedBy\}/);
  assert.match(source, /<p id=\{statusId\} role="status">/);
  assert.match(source, /<p id=\{errorId\} role="alert">/);
});

test('Login upload button exposes its busy state with discernible text', () => {
  assert.match(source, /aria-busy=\{isUploading\}/);
  assert.match(source, /\{isUploading \? "Uploading\.\.\." : "Upload"\}/);
});
