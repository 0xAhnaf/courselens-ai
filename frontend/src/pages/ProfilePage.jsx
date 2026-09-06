import { useEffect, useState } from 'react'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const save = async (event) => {
    event.preventDefault()
    setError(''); setMessage('')
    if (name.trim().length < 2 || name.trim().length > 100) return setError('Name must be between 2 and 100 characters.')
    setSaving(true)
    try { await updateUserProfile({ name: name.trim() }); setMessage('Your profile has been updated.') }
    catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }
  const [stats, setStats] = useState({ total: 0, completed: 0 })

  useEffect(() => {
    api.analyses.list()
      .then((items) => {
        const completed = items.filter((item) => String(item.status).toLowerCase() === 'completed').length
        setStats({ total: items.length, completed })
      })
      .catch(() => setError('Analysis statistics could not be loaded. Refresh to try again.'))
  }, [])

  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Your account</span><h2>Faculty profile</h2><p>Your details, connected to every review.</p></div></section>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {message && <div className="faculty-notice" role="status">{message}</div>}
      <section className="metric-grid metric-grid--two" aria-label="Profile summary">
        <article className="metric-card">
          <span>Total Analyses</span>
          <strong>{stats.total}</strong>
          <small>Created assessment reviews</small>
        </article>
        <article className="metric-card">
          <span>Completed Analyses</span>
          <strong>{stats.completed}</strong>
          <small>Successfully evaluated</small>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Faculty Information</h3>
            <p>Your CourseLens account details</p>
          </div>
        </div>

        <form className="auth-form profile-edit" onSubmit={save}>
          <label htmlFor="profile-name">Full name<input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" required /></label>
          <button className="button button--primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save profile'}</button>
        </form>

        <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '480px', marginTop: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Full Name
            </span>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0.25rem 0 0' }}>
              {user?.name || 'Faculty Member'}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Email Address
            </span>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0.25rem 0 0' }}>
              {user?.email || 'N/A'}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Account Role
            </span>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0.25rem 0 0' }}>
              Faculty Assessor
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
