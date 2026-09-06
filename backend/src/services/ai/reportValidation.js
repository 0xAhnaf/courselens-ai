const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const percent = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

const aliases = {
  overall_score: ['overallScore', 'score'],
  coverage_percentage: ['coveragePercentage', 'coverage'],
  clo_coverage: ['cloCoverage'],
  topic_coverage: ['topicCoverage'],
  bloom_distribution: ['bloomDistribution', 'blooms_distribution'],
  difficulty_distribution: ['difficultyDistribution'],
  duplicate_questions: ['duplicateQuestions', 'duplicates'],
  detected_issues: ['detectedIssues', 'issues'],
  recommendations: ['suggestions', 'actionable_recommendations']
};

const number = (value) => {
  const candidate = typeof value === 'object' && value !== null ? value.percentage ?? value.percent ?? value.value : value;
  const parsed = typeof candidate === 'string' ? Number(candidate.replace('%', '').trim()) : Number(candidate);
  return Number.isFinite(parsed) ? parsed : candidate;
};

const covered = (value, status) => typeof value === 'boolean'
  ? value
  : ['true', 'yes', 'covered'].includes(String(value ?? status ?? '').toLowerCase());

const normalizeDistribution = (source, categories) => {
  if (Array.isArray(source)) source = Object.fromEntries(source.map((item) => [item?.category ?? item?.level ?? item?.name, item?.percentage ?? item?.value]));
  if (!object(source)) return source;
  const lower = Object.fromEntries(Object.entries(source).map(([key, value]) => [key.toLowerCase().replace(/[^a-z]/g, ''), number(value)]));
  const result = Object.fromEntries(categories.map((category) => [category, lower[category] ?? 0]));
  if (!Object.values(result).every((value) => typeof value === 'number' && value >= 0)) return result;
  const total = Object.values(result).reduce((sum, value) => sum + value, 0);
  if (!total) return result;
  const normalized = {};
  let used = 0;
  categories.forEach((category, index) => {
    normalized[category] = index === categories.length - 1 ? Number((100 - used).toFixed(2)) : Number((result[category] * 100 / total).toFixed(2));
    used += normalized[category];
  });
  return normalized;
};

exports.normalizeReport = (input) => {
  if (!object(input)) return input;
  const report = { ...input };
  for (const [target, alternatives] of Object.entries(aliases)) {
    if (report[target] === undefined) report[target] = alternatives.map((key) => report[key]).find((value) => value !== undefined);
  }
  report.overall_score = number(report.overall_score);
  report.coverage_percentage = number(report.coverage_percentage);
  report.bloom_distribution = normalizeDistribution(report.bloom_distribution, ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']);
  report.difficulty_distribution = normalizeDistribution(report.difficulty_distribution, ['easy', 'medium', 'hard']);
  if (text(report.recommendations)) report.recommendations = [report.recommendations.trim()];
  if (Array.isArray(report.recommendations)) report.recommendations = report.recommendations.map((item) => typeof item === 'string' ? item : item?.recommendation ?? item?.text ?? item?.action).filter(Boolean);
  for (const key of ['duplicate_questions', 'detected_issues']) {
    if (object(report[key])) report[key] = [report[key]];
    else if (text(report[key]) && /^(?:none|no\b.*(?:found|detected|identified))\.?$/i.test(report[key].trim())) report[key] = [];
  }
  if (Array.isArray(report.clo_coverage)) report.clo_coverage = report.clo_coverage.map((item) => {
    const questions = item?.question_numbers ?? item?.questions ?? [];
    return { ...item, clo: item?.clo ?? item?.code,
      covered: covered(item?.covered, item?.status),
      question_numbers: Array.isArray(questions) ? questions.map(String) : questions ? [String(questions)] : [] };
  });
  if (Array.isArray(report.topic_coverage)) report.topic_coverage = report.topic_coverage.map((item) => ({ ...item,
    topic: item?.topic ?? item?.name, covered: covered(item?.covered, item?.status) }));
  if (Array.isArray(report.duplicate_questions)) report.duplicate_questions = report.duplicate_questions.map((item) => ({ ...item,
    current_question: item?.current_question ?? item?.currentQuestion ?? item?.current, matched_previous_question: item?.matched_previous_question ?? item?.previous_question ?? item?.previousQuestion ?? item?.matchedQuestion,
    similarity_score: number(item?.similarity_score ?? item?.similarity), recommendation: item?.recommendation ?? item?.suggestion ?? item?.action }));
  if (Array.isArray(report.detected_issues)) report.detected_issues = report.detected_issues.map((item) => ({ ...item,
    related_question: String(item?.related_question ?? item?.question ?? item?.question_number ?? 'Assessment'), issue_type: item?.issue_type ?? item?.type ?? item?.title ?? item?.issue,
    severity: ['low', 'medium', 'high'].includes(String(item?.severity).toLowerCase()) ? String(item.severity).toLowerCase() : 'medium',
    evidence: item?.evidence ?? item?.description ?? item?.reason, recommendation: item?.recommendation ?? item?.suggestion ?? item?.action ?? item?.suggested_fix }));
  return report;
};

exports.validateReport = (report, syllabus = '') => {
  const errors = [];
  if (!object(report)) return ['Report must be a JSON object'];
  for (const key of ['overall_score', 'coverage_percentage']) if (!percent(report[key])) errors.push(`${key} must be a number from 0 to 100`);
  if (!text(report.summary)) errors.push('summary is required');
  for (const [key, categories] of Object.entries({
    bloom_distribution: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
    difficulty_distribution: ['easy', 'medium', 'hard']
  })) {
    const distribution = report[key];
    if (!object(distribution) || !categories.every((category) => percent(distribution[category]))) errors.push(`${key} must include numeric percentages for ${categories.join(', ')}`);
    else if (Math.abs(categories.reduce((sum, category) => sum + distribution[category], 0) - 100) > 1) errors.push(`${key} must total 100 percent`);
  }
  const validators = {
    clo_coverage: (item) => object(item) && text(item.clo) && typeof item.covered === 'boolean' && Array.isArray(item.question_numbers) && item.question_numbers.every(text),
    topic_coverage: (item) => object(item) && text(item.topic) && typeof item.covered === 'boolean',
    duplicate_questions: (item) => object(item) && text(item.current_question) && text(item.matched_previous_question) && percent(item.similarity_score) && text(item.recommendation),
    detected_issues: (item) => object(item) && text(item.related_question) && text(item.issue_type) && ['low', 'medium', 'high'].includes(item.severity) && text(item.evidence) && text(item.recommendation),
    recommendations: text
  };
  for (const [key, validate] of Object.entries(validators)) {
    if (!Array.isArray(report[key]) || !report[key].every(validate)) errors.push(`${key} is missing or has invalid entries`);
  }
  if (Array.isArray(report.topic_coverage) && !report.topic_coverage.length) errors.push('topic_coverage cannot be empty');
  if (Array.isArray(report.recommendations) && !report.recommendations.length) errors.push('Provide at least one actionable recommendation');
  const suppliedClos = [...new Set((String(syllabus).match(/\bCLO\s*\d+\b/gi) || []).map((clo) => clo.replace(/\s/g, '').toUpperCase()))];
  const returnedClos = Array.isArray(report.clo_coverage) ? report.clo_coverage.map((item) => String(item?.clo || '').replace(/\s/g, '').toUpperCase()) : [];
  if (suppliedClos.some((clo) => !returnedClos.includes(clo))) errors.push('Include all supplied CLOs, even when uncovered');
  return errors;
};
