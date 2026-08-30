const assert = require('node:assert/strict');

function assertValidationContract(source) {
  const validationLoops = source.match(/for\s*\(\s*const file of candidates\s*\)/g) || [];

  assert.equal(validationLoops.length, 1);
  assert.match(source, /maxSizeMB !== undefined/);
  assert.match(source, /const validFiles: File\[\] = \[\]/);
  assert.match(source, /const errors: string\[\] = \[\]/);
  assert.match(source, /if \(maxBytes !== null && file\.size > maxBytes\)/);
  assert.match(source, /validFiles\.push\(file\)/);
  assert.match(source, /validFiles\.length === 0/);
  assert.match(source, /resetSelection\(\)/);
  assert.match(source, /onFilesSelected\?\.\(validFiles\)/);
  assert.doesNotMatch(source, /onFilesSelected\?\.\(files\)/);
}

module.exports = { assertValidationContract };
