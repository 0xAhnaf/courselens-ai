// Conservative arithmetic, not an AI judgement. Never infer missing marks.
exports.auditQuestionPaper = (text = '', expectedMarks) => {
  const matches = [...text.matchAll(/^\s*(?:Q(?:uestion)?\s*)(\d+)[.):\s]+/gim)];
  const questions = matches.map((match, index) => {
    const source = text.slice(match.index, matches[index + 1]?.index ?? text.length).trim();
    const marks = [...source.matchAll(/\[(\d+(?:\.\d+)?)\s*(?:marks?)?\]/gi)];
    return { number: `Q${match[1]}`, source, marks: marks.length === 1 ? Number(marks[0][1]) : null };
  });
  const ambiguous = /\b(?:answer|attempt)\s+(?:any|only)|\bOR\b|\b(?:either|optional)\b|^\s*\(?[a-z]\)\s/im.test(text);
  const unique = new Set(questions.map(q => q.number)).size === questions.length;
  const complete = questions.length > 0 && unique && !ambiguous && questions.every(q => q.marks !== null);
  const total = complete ? questions.reduce((sum, q) => sum + q.marks, 0) : null;
  return { questions, total, expected: Number(expectedMarks), status: !complete ? 'manual_check' : total === Number(expectedMarks) ? 'matched' : 'mismatch',
    explanation: complete ? 'Sum of explicit bracketed marks in numbered questions. Verify the extracted source below.' : 'Automatic totals withheld: numbering, marks or question-choice rules need faculty verification.' };
};
