import { Link } from 'react-router-dom'

export default function Logo({ compact = false }) {
  return (
    <Link className="brand" to="/" aria-label="CourseLens AI home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="13" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="m17 17 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 9h3M8 13h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>CourseLens AI</strong>
          <small>Assessment auditor</small>
        </span>
      )}
    </Link>
  )
}
