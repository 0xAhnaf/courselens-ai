export default function SourceEvidence({ audit }) {
  if (!audit) return null
  return <section className="panel report-section source-evidence">
    <div className="panel__header"><div><h3>Source evidence & marks check</h3><p>Exact extracted question text · arithmetic calculated without AI</p></div></div>
    <div className={`marks-check marks-check--${audit.status}`}>
      <strong>{audit.status === 'matched' ? 'Explicit marks match' : audit.status === 'mismatch' ? 'Marks mismatch — check required' : 'Manual marks check required'}</strong>
      <span>{audit.total !== null ? `${audit.total} extracted / ${audit.expected} declared marks` : `${audit.expected} declared marks`}</span>
      <p>{audit.explanation}</p>
    </div>
    {audit.questions.length ? <div className="evidence-list">{audit.questions.map((question, index) => <details key={index}>
      <summary><strong>{question.number}</strong><span>{question.marks === null ? 'Marks unclear' : `${question.marks} explicit marks`}</span><span>View source</span></summary>
      <pre>{question.source}</pre>
    </details>)}</div> : <p className="section-empty">No clear Q1 / Question 1 numbering detected. Check the uploaded source manually.</p>}
  </section>
}
