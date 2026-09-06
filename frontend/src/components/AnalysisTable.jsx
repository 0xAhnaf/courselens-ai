import { Link } from 'react-router-dom'
import { displayScore, formatDate } from '../utils/format'
import Icon from './Icon'
import StatusBadge from './StatusBadge'

export default function AnalysisTable({ analyses, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Course</th><th>Exam type</th><th>Date</th><th>Score</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {analyses.map((analysis) => (
            <tr key={analysis.id}>
              <td data-label="Course"><strong>{analysis.courseCode || 'Course'}</strong><span>{analysis.courseTitle || 'Untitled assessment'}</span></td>
              <td data-label="Exam type">{analysis.examType || 'Assessment'}</td>
              <td data-label="Date">{formatDate(analysis.createdAt)}</td>
              <td data-label="Score"><strong>{displayScore(analysis.overallScore)}</strong>{analysis.overallScore != null && '/100'}</td>
              <td data-label="Status"><StatusBadge status={analysis.status} /></td>
              <td className="table-actions">
                <Link className="text-link" to={`/analyses/${analysis.id}`}>View <Icon name="arrow" size={15} /></Link>
                {onDelete && <button className="icon-button icon-button--danger" onClick={() => onDelete(analysis)} aria-label={`Delete ${analysis.courseCode || 'analysis'}`}><Icon name="trash" size={17} /></button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
