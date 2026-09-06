import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../components/FeedbackState'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { api } from '../services/api'
import { displayScore, formatDate } from '../utils/format'

const pick = (object, camel, snake, fallback) => object?.[camel] ?? object?.[snake] ?? fallback

function DistributionBar({ values }) {
  const entries = Object.entries(values || {}).filter(([, value]) => Number(value) > 0)
  if (!entries.length) return <p className="muted">Distribution data is not available.</p>
  return <div className="distribution"><div className="distribution__bar">{entries.map(([key, value]) => <span key={key} style={{ width: `${value}%` }} title={`${key}: ${value}%`} />)}</div><div className="distribution__legend">{entries.map(([key, value]) => <span key={key}><i /> {key} <strong>{value}%</strong></span>)}</div></div>
}

export default function AnalysisResultPage() {
  const { id } = useParams()
  const location = useLocation()
  const [analysis, setAnalysis] = useState(location.state?.analysis || null)
  const [loading, setLoading] = useState(!location.state?.analysis)
  const [error, setError] = useState('')
  const [openIssue, setOpenIssue] = useState(0)
  const analysisStatus = String(analysis?.status || '').toLowerCase()
  const retry = async () => {
    setLoading(true); setError('')
    try { const next = await api.analyses.retry(id); setAnalysis((current) => ({ ...current, ...next, result: null, result_json: null })) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setAnalysis(await api.analyses.get(id)) }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => {
    if (analysis && analysisStatus !== 'processing') return undefined
    let active = true
    let timer
    const poll = async () => {
      try {
        const item = await api.analyses.get(id)
        if (!active) return
        setAnalysis(item)
        setLoading(false)
        if (String(item.status).toLowerCase() === 'processing') timer = setTimeout(poll, 1400)
      } catch (requestError) {
        if (active) { setError(requestError.message); setLoading(false) }
      }
    }
    timer = setTimeout(poll, analysisStatus ? 900 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [analysis, analysisStatus, id])

  const result = analysis?.result || analysis?.result_json || analysis || {}
  const coverage = pick(result, 'cloCoverage', 'clo_coverage', [])
  const issues = pick(result, 'detectedIssues', 'detected_issues', [])
  const duplicates = pick(result, 'duplicateQuestions', 'duplicate_questions', [])
  const recommendations = result.recommendations || []
  const topics = Array.isArray(result.topic_coverage) ? result.topic_coverage : []
  const difficulty = pick(result, 'difficultyDistribution', 'difficulty_distribution', {})
  const bloom = pick(result, 'bloomDistribution', 'bloom_distribution', {})
  const metrics = [
    ['Course coverage', `${pick(result, 'coveragePercentage', 'coverage_percentage', '—')}${pick(result, 'coveragePercentage', 'coverage_percentage', null) == null ? '' : '%'}`],
    ['Difficulty balance', pick(result, 'difficultyBalance', 'difficulty_balance', 'Not available')],
    ["Bloom's balance", pick(result, 'bloomBalance', 'bloom_balance', 'Not available')],
    ['Similarity risk', pick(result, 'similarityRisk', 'similarity_risk', 'Not available')],
  ]

  if (loading) return <LoadingState title="Loading the analysis report…" />
  if (error) return <ErrorState title="Report unavailable" message={error} onRetry={load} />
  if (analysisStatus === 'failed') return <ErrorState title="Analysis failed" message={analysis?.errorMessage || 'The AI provider could not complete this assessment.'} onRetry={retry} />
  if (analysisStatus === 'processing') return <LoadingState title="AI analysis is still processing…" />

  return (
    <article className="report-page">
      {result.schema_version !== 1 && <div className="alert alert--error" role="status"><span>This older report has not passed completeness validation. Empty sections do not mean no issues were found.</span><button className="button button--secondary" onClick={retry}>Regenerate report</button></div>}
      <section className="report-heading page-enter">
        <div><div className="report-meta"><StatusBadge status={analysis?.status || 'completed'} /><span>{analysis?.examType || analysis?.exam_type || 'Assessment'}</span><span>{formatDate(analysis?.createdAt || analysis?.created_at)}</span></div><h2>{analysis?.courseCode || analysis?.course_code} · {analysis?.courseTitle || analysis?.course_title || 'Analysis report'}</h2><p>{analysis?.semester || ''}{analysis?.totalMarks || analysis?.total_marks ? ` · ${analysis?.totalMarks || analysis?.total_marks} total marks` : ''}</p></div>
        <div className="report-actions"><Link className="button button--secondary" to="/analyses/new">Analyze another</Link><button className="button button--primary" onClick={() => window.print()}><Icon name="download" size={17} /> Export report</button></div>
      </section>

      <section className="score-summary">
        <div className="score-card"><span>Overall quality score</span><div><strong>{displayScore(pick(result, 'overallScore', 'overall_score', null))}</strong><small>/100</small></div><p>{Number(pick(result, 'overallScore', 'overall_score', 0)) >= 80 ? 'Strong assessment quality' : 'Faculty review recommended'}</p></div>
        <div className="summary-card"><span className="eyebrow"><Icon name="sparkles" size={15} /> AI analysis summary</span><p>{result.summary || 'A written analysis summary was not provided.'}</p><small><Icon name="shield" size={15} /> Verify the evidence before making final academic decisions.</small></div>
      </section>

      <section className="metric-grid metric-grid--four">{metrics.map(([label, value]) => <article className="metric-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>

      <div className="report-grid">
        <div className="report-column">
          {topics.length > 0 && <section className="panel report-section"><div className="panel__header"><div><h3>Topic-level evidence</h3><p>What this assessment includes—and leaves out</p></div></div><div className="topic-grid">{topics.map((topic, index) => <div className="topic-row" key={index}><span>{topic.topic}</span><StatusBadge status={topic.covered ? 'covered' : 'missing'} /></div>)}</div></section>}
          <section className="panel report-section"><div className="panel__header"><div><h3>Course coverage</h3><p>Learning outcomes represented in the paper</p></div><span className="status status--completed">{coverage.length} outcomes</span></div>{coverage.length ? <div className="coverage-list">{coverage.map((item, index) => <div key={item.code || index}><div><strong>{item.code || `Outcome ${index + 1}`}</strong><span>{item.title || item.description}</span></div><div><span>{item.marks != null ? `${item.marks} marks` : ''}</span><StatusBadge status={item.status || 'partial'} /></div></div>)}</div> : <p className="section-empty">Coverage details were not returned.</p>}</section>

          <section className="panel report-section"><div className="panel__header"><div><h3>Question balance</h3><p>Detected difficulty distribution</p></div></div><DistributionBar values={difficulty} /><div className="subsection"><h4>Bloom’s Taxonomy</h4><DistributionBar values={bloom} /></div></section>

          <section className="panel report-section"><div className="panel__header"><div><h3>Similarity check</h3><p>Current questions compared with previous papers</p></div></div>{duplicates.length ? <div className="similarity-list">{duplicates.map((item, index) => <article key={index}><div><strong>{item.currentQuestion || item.current_question}</strong><span>{item.similarity ?? item.similarity_score}% similar</span></div><p>Matches {item.previousQuestion || item.previous_question}</p><small>{item.evidence}</small></article>)}</div> : <div className="positive-empty"><Icon name="check" size={20} /><div><strong>{result.schema_version !== 1 ? 'Similarity not verified' : !analysis?.previous_papers_text?.trim() ? 'No comparison paper supplied' : 'No significant similarity found'}</strong><p>{result.schema_version !== 1 ? 'Regenerate this report to complete the check.' : !analysis?.previous_papers_text?.trim() ? 'Add previous papers to run a meaningful similarity check.' : 'No duplicates were flagged in the supplied comparison material.'}</p></div></div>}</section>
        </div>

        <div className="report-column">
          <section className="panel report-section"><div className="panel__header"><div><h3>Detected issues</h3><p>Evidence requiring faculty attention</p></div><span className="issue-count">{issues.length}</span></div>{issues.length ? <div className="issue-list">{issues.map((issue, index) => <article key={index} className={`issue issue--${issue.severity || 'warning'}`}><button onClick={() => setOpenIssue(openIssue === index ? -1 : index)}><span><StatusBadge status={issue.severity || 'warning'} /><strong>{issue.title || issue.issue}</strong><small>{issue.question || issue.question_number}</small></span><span>{openIssue === index ? '−' : '+'}</span></button>{openIssue === index && <div className="issue__body"><p><strong>Evidence</strong>{issue.evidence}</p><p><strong>Recommendation</strong>{issue.recommendation}</p></div>}</article>)}</div> : <div className="positive-empty"><Icon name="check" size={20} /><div><strong>{result.schema_version === 1 ? 'No issues were flagged' : 'Issue check not verified'}</strong><p>{result.schema_version === 1 ? 'Review the complete report before final approval.' : 'Regenerate the report; missing findings do not mean the paper is issue-free.'}</p></div></div>}</section>

          <section className="panel report-section recommendation-section"><div className="panel__header"><div><h3>Prioritized recommendations</h3><p>Suggested next steps for faculty review</p></div></div>{recommendations.length ? <ol>{recommendations.map((item, index) => <li key={index}><span>{index + 1}</span><p>{typeof item === 'string' ? item : item.text || item.recommendation}</p></li>)}</ol> : <p className="section-empty">No recommendations were returned.</p>}<div className="faculty-notice"><Icon name="shield" size={19} /><p><strong>You remain in control</strong><span>AI findings are advisory and should be checked against your academic standards.</span></p></div></section>
        </div>
      </div>
    </article>
  )
}
