export const demoUser = { id: 1, name: 'Dr. Faculty Member', email: 'faculty@university.edu' }

export const demoAnalyses = [
  {
    id: 'demo-1', courseCode: 'CSE 3101', courseTitle: 'Design and Analysis of Algorithms',
    examType: 'Final examination', semester: 'Spring 2026', createdAt: '2026-09-05T10:30:00Z',
    overallScore: 88, coveragePercentage: 84, status: 'completed',
  },
  {
    id: 'demo-2', courseCode: 'CSE 2203', courseTitle: 'Data Structures',
    examType: 'Midterm examination', semester: 'Spring 2026', createdAt: '2026-09-03T08:10:00Z',
    overallScore: 72, coveragePercentage: 68, status: 'needs review',
  },
]

export const demoResult = {
  ...demoAnalyses[0],
  totalMarks: 100,
  summary: 'The paper demonstrates strong course alignment with a balanced range of cognitive skills. One learning outcome is underrepresented and two questions would benefit from clearer wording.',
  bloomBalance: 'Balanced',
  difficultyBalance: 'Balanced',
  similarityRisk: 'Low',
  cloCoverage: [
    { code: 'CLO 1', title: 'Analyze algorithm complexity', marks: 25, status: 'covered' },
    { code: 'CLO 2', title: 'Design efficient algorithmic solutions', marks: 30, status: 'covered' },
    { code: 'CLO 3', title: 'Apply dynamic programming techniques', marks: 10, status: 'partial' },
    { code: 'CLO 4', title: 'Evaluate graph algorithms', marks: 35, status: 'covered' },
  ],
  difficultyDistribution: { easy: 25, medium: 50, hard: 25 },
  bloomDistribution: { remember: 10, understand: 15, apply: 30, analyze: 30, evaluate: 15, create: 0 },
  duplicateQuestions: [
    { currentQuestion: 'Question 4(b)', previousQuestion: 'Fall 2024 — Question 3(a)', similarity: 78, evidence: 'Both ask for the same dynamic-programming recurrence and complexity analysis.' },
  ],
  detectedIssues: [
    { severity: 'high', question: 'Question 4(b)', title: 'CLO 3 is underrepresented', evidence: 'Only 10% of marks assess CLO 3.', recommendation: 'Add a short application-focused sub-question for CLO 3.' },
    { severity: 'warning', question: 'Question 2(a)', title: 'Wording may be ambiguous', evidence: 'The expected input constraints are not stated.', recommendation: 'Specify the input range and expected output format.' },
  ],
  recommendations: [
    'Increase application-level coverage for CLO 3.',
    'Clarify the constraints in Question 2(a).',
    'Review Question 4(b) against the Fall 2024 paper before approval.',
  ],
}
