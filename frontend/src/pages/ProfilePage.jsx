import { useEffect, useState } from 'react'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'

export default function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, completed: 0 })

  useEffect(() => {
    api.analyses.list()
      .then((items) => {
        const completed = items.filter((item) => String(item.status).toLowerCase() === 'completed').length
        setStats({ total: items.length, completed })
      })
      .catch(() => {})
  }, [])

  return (
    <div className="page-stack">
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