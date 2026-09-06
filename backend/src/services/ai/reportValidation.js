const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const percent = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

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
