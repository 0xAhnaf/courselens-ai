const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateReport, normalizeReport } = require('../src/services/ai/reportValidation');
const valid = () => ({
  overall_score: 80, coverage_percentage: 75, summary: 'One CLO is not assessed.',
  clo_coverage: [{ clo: 'CLO1', covered: false, question_numbers: [] }],
  topic_coverage: [{ topic: 'Complexity', covered: true }],
  difficulty_distribution: { easy: 20, medium: 60, hard: 20 },
  bloom_distribution: { remember: 10, understand: 10, apply: 30, analyze: 30, evaluate: 20, create: 0 },
  duplicate_questions: [], detected_issues: [], recommendations: ['Include the missing CLO.']
});

test('accepts complete reports with meaningful empty findings', () => assert.deepEqual(validateReport(valid()), []));
test('does not silently omit uncovered CLOs', () => assert.ok(validateReport(valid(), 'CLO1: Analyze. CLO2: Evaluate.').some((error) => error.includes('all supplied CLOs'))));
test('rejects partial JSON instead of manufacturing a successful report', () => assert.ok(validateReport({ overall_score: 80 }).length >= 7));
test('rejects malformed distribution values and totals', () => {
  const report = valid(); report.difficulty_distribution.easy = '20%';
  assert.ok(validateReport(report).length);
  report.difficulty_distribution.easy = 60;
  assert.ok(validateReport(report).some((error) => error.includes('total')));
});
test('rejects unsafe array shapes and missing recommendations', () => {
  const report = valid(); report.detected_issues = {}; report.recommendations = [];
  assert.equal(validateReport(report).length, 2);
});
test('normalizes common model schema and percentage variations without inventing findings', () => {
  const normalized = normalizeReport({
    overallScore: '80', coverage: '75%', summary: 'Review completed.',
    cloCoverage: [{ code: 'CLO1', status: 'covered', questions: 'Q1' }],
    topicCoverage: [{ name: 'Complexity', status: 'covered' }],
    bloomDistribution: { Remember: '10%', Understand: 10, Apply: 30, Analyze: 30, Evaluate: 20 },
    difficultyDistribution: [{ level: 'Easy', percentage: 2 }, { level: 'Medium', percentage: 6 }, { level: 'Hard', percentage: 2 }],
    duplicates: [], issues: [], suggestions: [{ action: 'Verify the final paper.' }]
  });
  assert.deepEqual(validateReport(normalized, 'CLO1: Analyze'), []);
  assert.equal(normalized.bloom_distribution.create, 0);
  assert.equal(normalized.difficulty_distribution.medium, 60);
});
test('normalizes explicit no-findings text and a single recommendation', () => {
  const report = valid();
  report.duplicate_questions = 'No duplicates found';
  report.detected_issues = 'None';
  report.recommendations = 'Verify the final paper.';
  const normalized = normalizeReport(report);
  assert.deepEqual(normalized.duplicate_questions, []);
  assert.deepEqual(normalized.detected_issues, []);
  assert.deepEqual(normalized.recommendations, ['Verify the final paper.']);
  assert.deepEqual(validateReport(normalized), []);
});
test('regenerates incomplete reports using original course evidence', async () => {
  const provider = require('../src/services/ai/aiProvider');
  const original = provider.generateCompletion;
  let calls = 0;
  provider.generateCompletion = async (prompt) => {
    calls += 1;
    if (calls === 1) assert.match(prompt, /Original syllabus evidence/);
    else { assert.match(prompt, /Report to repair/); assert.ok(prompt.length < 2500); }
    return calls === 1 ? { summary: 'Incomplete' } : valid();
  };
  delete require.cache[require.resolve('../src/services/ai/assessmentAgent')];
  try {
    const result = await require('../src/services/ai/assessmentAgent').analyzeAssessment({ syllabus_text: 'Original syllabus evidence', question_paper_text: 'Q1 complexity', course_title: 'Algorithms', course_code: 'CSE', total_marks: 50 });
    assert.equal(calls, 2); assert.equal(result.schema_version, 1);
  } finally { provider.generateCompletion = original; }
});
test('does not save a report that remains incomplete after regeneration', async () => {
  const provider = require('../src/services/ai/aiProvider');
  const original = provider.generateCompletion;
  provider.generateCompletion = async () => ({ overall_score: 90 });
  delete require.cache[require.resolve('../src/services/ai/assessmentAgent')];
  try {
    await assert.rejects(require('../src/services/ai/assessmentAgent').analyzeAssessment({}), /incomplete report/);
  } finally { provider.generateCompletion = original; }
});
test('adds a grounded marks issue when the model omits issues and recommendations', async () => {
  const provider = require('../src/services/ai/aiProvider');
  const original = provider.generateCompletion;
  let calls = 0;
  const modelReport = valid();
  delete modelReport.detected_issues;
  delete modelReport.recommendations;
  provider.generateCompletion = async () => { calls += 1; return modelReport; };
  delete require.cache[require.resolve('../src/services/ai/assessmentAgent')];
  try {
    const result = await require('../src/services/ai/assessmentAgent').analyzeAssessment({
      syllabus_text: 'CLO1: Analyze.', question_paper_text: 'Q1. Analyze. [50]',
      previous_papers_text: '', course_title: 'Algorithms', course_code: 'CSE', total_marks: 100
    });
    assert.equal(calls, 1);
    assert.equal(result.detected_issues[0].issue_type, 'Mark Mismatch');
    assert.match(result.detected_issues[0].evidence, /total 50.*declares 100/);
    assert.ok(result.recommendations.length);
  } finally { provider.generateCompletion = original; }
});
