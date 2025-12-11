// Stub module for 'tap' - used in test files that get bundled
// This prevents build errors when dependencies include test files
module.exports = {
  test: () => {},
  plan: () => {},
  pass: () => {},
  fail: () => {},
  ok: () => {},
  notOk: () => {},
  equal: () => {},
  notEqual: () => {},
  same: () => {},
  notSame: () => {},
  strictSame: () => {},
  strictNotSame: () => {},
  throws: () => {},
  doesNotThrow: () => {},
  match: () => {},
  notMatch: () => {},
  type: () => {},
  end: () => {},
  comment: () => {},
};

