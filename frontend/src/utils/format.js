export const formatDate = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

export const displayScore = (value) => value === null || value === undefined ? '—' : `${Math.round(Number(value))}`

export const getStatusLabel = (status) => String(status || 'processing').replaceAll('_', ' ')
