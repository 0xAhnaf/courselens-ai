const { generateCompletion } = require("./aiProvider");

exports.analyzeAssessment = async (data) => {
  const { course_title, course_code, total_marks, syllabus_text, question_paper_text, previous_papers_text } = data;

  const prompt = `
You are CourseLens AI, an expert academic quality auditor for university question papers.
Analyze the following course details, syllabus/CLOs, current question paper, and optional previous exam papers.

COURSE DETAILS:
- Title: ${course_title}
- Code: ${course_code}
- Total Marks: ${total_marks}

SYLLABUS & CLOs:
${syllabus_text}

CURRENT QUESTION PAPER:
${question_paper_text}

PREVIOUS QUESTION PAPERS (IF ANY):
${previous_papers_text || "None provided"}

TASK INSTRUCTIONS:
1. Audit syllabus & CLO coverage percentage and pinpoint unaddressed topics.
2. Evaluate cognitive complexity distribution (Bloom's Taxonomy: Remember, Understand, Apply, Analyze, Evaluate, Create).
3. Evaluate difficulty distribution (Easy, Medium, Hard).
4. Detect duplicate or heavily similar questions from previous papers if provided.
5. Identify specific issues with question phrasing, mark distributions, or syllabus mismatches. Cite exact question numbers and provide evidence.
6. Provide overall score (0-100) and structured recommendations. Do NOT invent non-existent CLOs.

You MUST respond strictly with valid JSON conforming to this exact structure:
{
  "overall_score": 85,
  "summary": "Brief overall narrative of the quality check",
  "coverage_percentage": 80,
  "clo_coverage": [
    { "clo": "CLO1", "covered": true, "question_numbers": ["Q1a", "Q2"] }
  ],
  "topic_coverage": [
    { "topic": "Topic Name", "covered": true }
  ],
  "bloom_distribution": {
    "remember": 20,
    "understand": 30,
    "apply": 30,
    "analyze": 10,
    "evaluate": 10,
    "create": 0
  },
  "difficulty_distribution": {
    "easy": 30,
    "medium": 50,
    "hard": 20
  },
  "duplicate_questions": [
    {
      "current_question": "Q1a",
      "matched_previous_question": "2023 Fall Q2b",
      "similarity_score": 85,
      "recommendation": "Slightly modify parameters"
    }
  ],
  "detected_issues": [
    {
      "related_question": "Q3",
      "issue_type": "Mark Mismatch",
      "severity": "high",
      "evidence": "Total marks listed on header do not match sum of individual questions",
      "recommendation": "Adjust marks for Q3b to total 10"
    }
  ],
  "recommendations": [
    "Add more higher-order cognitive level questions"
  ]
}
`;

  return await generateCompletion(prompt);
};