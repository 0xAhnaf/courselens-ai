import Icon from './Icon'

export function LoadingState({ title = 'Loading your workspace…', compact = false }) {
  return (
    <div className={`feedback-state ${compact ? 'feedback-state--compact' : ''}`} role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{title}</p>
    </div>
  )
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="feedback-state">
      <span className="feedback-icon"><Icon name="file" size={24} /></span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="feedback-state feedback-state--error" role="alert">
      <span className="feedback-icon"><Icon name="warning" size={24} /></span>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && <button className="button button--secondary" onClick={onRetry}>Try again</button>}
    </div>
  )
}
