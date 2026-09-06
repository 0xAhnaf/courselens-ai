import Icon from './Icon'

export default function ConfirmDialog({ open, title, message, busy, onCancel, onConfirm }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <span className="modal__icon"><Icon name="warning" size={24} /></span>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="modal__actions"><button className="button button--secondary" disabled={busy} onClick={onCancel}>Cancel</button><button className="button button--danger" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : 'Delete analysis'}</button></div>
      </section>
    </div>
  )
}
