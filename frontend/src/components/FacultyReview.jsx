import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function FacultyReview({ id }) {
  const [review, setReview] = useState(null)
  const [decision, setDecision] = useState('pending')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    let active = true
    api.analyses.getReview(id).then(value => {
      if (!active) return
      setReview(value); setDecision(value.stale ? 'pending' : value.decision); setNote(value.note)
    }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [id])
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setSaved(false)
    try {
      const value = await api.analyses.saveReview(id, { decision, note, report_hash: review.report_hash })
      setReview(value); setNote(value.note); setSaved(true)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }
  return <section className="panel report-section faculty-review">
    <div className="panel__header"><div><h3>Faculty decision</h3><p>AI advises. You decide. Your review is saved with this report.</p></div></div>
    <form onSubmit={submit}>
      {review?.stale && <p role="status" className="alert alert--error">The report changed since your last review. Previous notes are retained; review again before approval.</p>}
      {error && <p role="alert" className="alert alert--error">{error}</p>}
      {!review && !error && <p role="status">Loading saved review…</p>}
      <label htmlFor="faculty-decision">Review status</label>
      <select id="faculty-decision" value={decision} disabled={!review || saving} onChange={e => { setDecision(e.target.value); setSaved(false) }}>
        <option value="pending">Pending faculty review</option><option value="needs_revision">Revision requested</option><option value="approved">Approved by faculty</option>
      </select>
      <label htmlFor="faculty-note">Decision notes</label>
      <textarea id="faculty-note" rows={4} maxLength={2000} value={note} disabled={!review || saving} placeholder="Record your reasoning, exceptions or requested changes…" onChange={e => { setNote(e.target.value); setSaved(false) }} />
      <small>This decision does not alter AI findings. {note.length}/2000 characters.</small>
      <button className="button button--primary" disabled={!review || saving}>{saving ? 'Saving…' : 'Save faculty review'}</button>
      <p role="status">{saved ? 'Review saved successfully.' : review?.updated_at ? `Last saved: ${review.updated_at} UTC${review.stale ? ' · Needs re-review' : ''}` : ''}</p>
    </form>
  </section>
}
