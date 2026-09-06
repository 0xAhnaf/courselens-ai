export default function StatusBadge({ status = 'processing' }) {
  const normalized = String(status).toLowerCase().replaceAll(' ', '-')
  return <span className={`status status--${normalized}`}>{String(status).replaceAll('_', ' ')}</span>
}
