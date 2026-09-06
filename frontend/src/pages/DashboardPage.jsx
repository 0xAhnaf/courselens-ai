import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AnalysisTable from '../components/AnalysisTable'
import { EmptyState, ErrorState, LoadingState } from '../components/FeedbackState'
import Icon from '../components/Icon'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

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

  const metrics = useMemo(() => {
    const scored = analyses.filter((item) => Number.isFinite(Number(item.overallScore)))
    const average = scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.overallScore), 0) / scored.length) : null
    const needsReview = analyses.filter((item) => String(item.status).toLowerCase().includes('review') || Number(item.overallScore) < 70).length
    return { total: analyses.length, average, needsReview }
  }, [analyses])

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><span className="eyebrow">Faculty workspace</span><h2>Welcome, {user?.name?.split(' ')[0] || 'Faculty'}.</h2><p>Start a new review or continue with a recent assessment.</p></div>
        <Link className="button button--primary" to="/analyses/new"><Icon name="plus" size={17} /> New analysis</Link>
      </section>

      {error ? <ErrorState title="Dashboard unavailable" message={error} onRetry={load} /> : loading ? <LoadingState /> : (
        <>
          <section className="metric-grid metric-grid--three" aria-label="Analysis summary">
            <article className="metric-card"><span>Total analyses</span><strong>{metrics.total}</strong><small>Saved assessment reviews</small></article>
            <article className="metric-card"><span>Average quality</span><strong>{metrics.average == null ? '—' : `${metrics.average}%`}</strong><small>Across scored analyses</small></article>
            <article className="metric-card"><span>Needs review</span><strong>{metrics.needsReview}</strong><small>Requires faculty attention</small></article>
          </section>
          <section className="panel">
            <div className="panel__header"><div><h3>Recent analyses</h3><p>Your latest assessment reviews</p></div>{analyses.length > 0 && <Link className="text-link" to="/history">View all <Icon name="arrow" size={15} /></Link>}</div>
            {analyses.length ? <AnalysisTable analyses={analyses.slice(0, 5)} /> : <EmptyState title="No analyses yet" message="Add course materials and run your first assessment review." action={<Link className="button button--primary" to="/analyses/new">Start first analysis</Link>} />}
          </section>
        </>
      )}
    </div>
  )
}
