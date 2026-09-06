import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AnalysisTable from '../components/AnalysisTable'
import ConfirmDialog from '../components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '../components/FeedbackState'
import Icon from '../components/Icon'
import { api } from '../services/api'

export default function AnalysisHistoryPage() {
  const [analyses, setAnalyses] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [target, setTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setAnalyses(await api.analyses.list()) }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    let active = true
    api.analyses.list()
      .then((items) => { if (active) setAnalyses(items) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => analyses.filter((item) => {
    const haystack = `${item.courseCode} ${item.courseTitle} ${item.examType}`.toLowerCase()
    const matchesQuery = haystack.includes(query.trim().toLowerCase())
    const matchesStatus = status === 'all' || String(item.status).toLowerCase().replaceAll(' ', '-') === status
    return matchesQuery && matchesStatus
  }), [analyses, query, status])

  const confirmDelete = async () => {
    setDeleting(true)
    try { await api.analyses.remove(target.id); setAnalyses((items) => items.filter((item) => item.id !== target.id)); setTarget(null) }
    catch (requestError) { setError(requestError.message); setTarget(null) }
    finally { setDeleting(false) }
  }

  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Saved reports</span><h2>Assessment analysis history</h2><p>Search, reopen, and manage previous reviews.</p></div><Link className="button button--primary" to="/analyses/new"><Icon name="plus" size={17} /> New analysis</Link></section>
      <section className="panel">
        <div className="filters">
          <label className="search-field"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course or exam type" /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="completed">Completed</option><option value="needs-review">Needs review</option><option value="processing">Processing</option><option value="failed">Failed</option></select>
        </div>
        {error ? <ErrorState title="History unavailable" message={error} onRetry={load} /> : loading ? <LoadingState compact /> : filtered.length ? <AnalysisTable analyses={filtered} onDelete={setTarget} /> : <EmptyState title={analyses.length ? 'No matching analyses' : 'No analysis history'} message={analyses.length ? 'Try a different search or status filter.' : 'Completed analyses will appear here.'} />}
      </section>
      <ConfirmDialog open={Boolean(target)} title="Delete this analysis?" message={`${target?.courseCode || 'This report'} will be permanently removed.`} busy={deleting} onCancel={() => setTarget(null)} onConfirm={confirmDelete} />
    </div>
  )
}
