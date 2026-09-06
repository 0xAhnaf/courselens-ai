const { test } = require('node:test');
const assert = require('node:assert/strict');
const { auditQuestionPaper: audit } = require('../src/services/assessmentEvidence');

test('marks check preserves original evidence and adds explicit marks', () => {
  const result = audit('Q1. Explain sorting. [10]\nQ2. Analyze graphs. [15 marks]', 25);
  assert.equal(result.status, 'matched');
  assert.equal(result.total, 25);
  assert.equal(result.questions[0].source, 'Q1. Explain sorting. [10]');
});
test('marks check detects mismatch without changing declared marks', () => {
  assert.equal(audit('Q1. Explain sorting. [10]', 50).status, 'mismatch');
});
test('marks check withholds totals for missing marks, choices and subquestions', () => {
  for (const text of ['Q1. Explain sorting.', 'Answer any two\nQ1. Sort. [10]', 'Q1. Sort. [10]\nOR\nQ2. Graph. [10]', 'Q1. Sort\n(a) Explain. [10]', 'No numbering [50]', 'Q1. Sort [5] [10]', 'Q1. Sort [10]\nQ1. Graph [10]']) {
    assert.equal(audit(text, 50).total, null, text);
  }
});
