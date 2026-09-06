import { demoAnalyses, demoResult, demoUser } from '../data/demoData'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '')
export const isDemoMode = String(import.meta.env.VITE_USE_DEMO_DATA).toLowerCase() === 'true'
const TOKEN_KEY = 'courselens_token'
const ENDPOINTS = {
  login: '/auth/login',
  signup: '/auth/register',
  me: '/auth/me',
  logout: '/auth/logout',
  analyses: '/analyses',
  extractDocument: '/documents/extract',
}

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

const pause = (duration = 450) => new Promise((resolve) => setTimeout(resolve, duration))

function normalizeError(payload, fallback) {
  if (typeof payload === 'string' && payload.trim()) return payload
  return payload?.message || payload?.error || fallback
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getStoredToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Cannot reach the CourseLens server. Check that the backend is running.')
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try { payload = JSON.parse(text) } catch { payload = text }
  }

  if (!response.ok) {
    if (response.status === 401) { clearToken(); window.dispatchEvent(new Event('courselens-session-expired')) }
    throw new Error(normalizeError(payload, `Request failed with status ${response.status}.`))
  }

  return payload?.data ?? payload ?? {}
}

function normalizeAnalysis(item) {
  return {
    ...item,
    id: item.id ?? item.analysis_id,
    courseCode: item.courseCode ?? item.course_code ?? '',
    courseTitle: item.courseTitle ?? item.course_title ?? '',
    examType: item.examType ?? item.exam_type ?? '',
    overallScore: item.overallScore ?? item.overall_score ?? item.result?.overall_score ?? null,
    coveragePercentage: item.coveragePercentage ?? item.coverage_percentage ?? item.result?.coverage_percentage ?? null,
    createdAt: item.createdAt ?? item.created_at ?? null,
    errorMessage: item.errorMessage ?? item.error_message ?? null,
  }
}

function deriveBalance(values) {
  const numbers = Object.values(values || {}).map(Number).filter(Number.isFinite)
  if (!numbers.length) return 'Not available'
  return Math.max(...numbers) - Math.min(...numbers) <= 35 ? 'Balanced' : 'Needs review'
}

function normalizeResult(raw = {}) {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw) } catch { raw = {} } }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {}
  const difficulty = raw.difficultyDistribution ?? raw.difficulty_distribution ?? {}
  const bloom = raw.bloomDistribution ?? raw.bloom_distribution ?? {}
  const asArray = (value) => Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : []
  const duplicates = asArray(raw.duplicateQuestions ?? raw.duplicate_questions)

  return {
    ...raw,
    topic_coverage: asArray(raw.topic_coverage),
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.filter((item) => typeof item === 'string') : [],
    overallScore: raw.overallScore ?? raw.overall_score,
    coveragePercentage: raw.coveragePercentage ?? raw.coverage_percentage,
    difficultyDistribution: difficulty,
    bloomDistribution: bloom,
    difficultyBalance: raw.difficultyBalance ?? raw.difficulty_balance ?? deriveBalance(difficulty),
    bloomBalance: raw.bloomBalance ?? raw.bloom_balance ?? deriveBalance(bloom),
    similarityRisk: raw.similarityRisk ?? raw.similarity_risk ?? (duplicates.length ? 'Needs review' : raw.schema_version === 1 ? 'Low' : 'Unverified'),
    cloCoverage: asArray(raw.cloCoverage ?? raw.clo_coverage).map((item) => ({
      ...item,
      code: item.code ?? item.clo,
      title: item.title ?? item.description ?? (Array.isArray(item.question_numbers) && item.question_numbers.length ? `Assessed in ${item.question_numbers.join(', ')}` : 'No question mapping returned'),
      status: item.status ?? (item.covered ? 'covered' : 'missing'),
    })),
    duplicateQuestions: duplicates.map((item) => ({
      ...item,
      currentQuestion: item.currentQuestion ?? item.current_question,
      previousQuestion: item.previousQuestion ?? item.previous_question ?? item.matched_previous_question,
      similarity: item.similarity ?? item.similarity_score,
      evidence: item.evidence ?? item.recommendation,
    })),
    detectedIssues: asArray(raw.detectedIssues ?? raw.detected_issues).map((item) => ({
      ...item,
      title: item.title ?? item.issue ?? item.issue_type,
      question: item.question ?? item.question_number ?? item.related_question,
    })),
  }
}

function normalizeAuth(payload) {
  return {
    token: payload.token ?? payload.accessToken ?? payload.access_token,
    user: payload.user ?? payload.faculty,
  }
}

export const api = {
  auth: {
    async login(credentials) {
      if (isDemoMode) { await pause(); return { token: 'demo-token', user: { ...demoUser, email: credentials.email } } }
      return normalizeAuth(await request(ENDPOINTS.login, { method: 'POST', body: JSON.stringify(credentials) }))
    },
    async signup(details) {
      if (isDemoMode) { await pause(); return { token: 'demo-token', user: { ...demoUser, name: details.name, email: details.email } } }
      return normalizeAuth(await request(ENDPOINTS.signup, { method: 'POST', body: JSON.stringify(details) }))
    },
    async me() {
      if (isDemoMode) { await pause(150); return { user: demoUser } }
      return request(ENDPOINTS.me)
    },
    async updateProfile(details) {
      if (isDemoMode) { await pause(300); return { id: demoUser.id, name: details.name, email: demoUser.email } }
      return request(ENDPOINTS.me, { method: 'PUT', body: JSON.stringify(details) })
    },
    async logout() {
      if (isDemoMode) return {}
      return request(ENDPOINTS.logout, { method: 'POST' })
    },
  },
  documents: {
    async extract(file) {
      if (isDemoMode) {
        if (file.name.toLowerCase().endsWith('.txt')) return { file_name: file.name, text: await file.text(), page_count: 1 }
        throw new Error('PDF and DOCX extraction requires the backend. Disable demo mode to test uploads.')
      }

      const form = new FormData()
      form.append('file', file)
      return request(ENDPOINTS.extractDocument, { method: 'POST', body: form })
    },
  },
  analyses: {
    async retry(id) {
      if (isDemoMode) return { ...demoResult, id }
      return normalizeAnalysis(await request(`${ENDPOINTS.analyses}/${id}/retry`, { method: 'POST' }))
    },
    async list() {
      if (isDemoMode) { await pause(); return demoAnalyses }
      const payload = await request(ENDPOINTS.analyses)
      const items = Array.isArray(payload) ? payload : payload.analyses || []
      return items.map(normalizeAnalysis)
    },
    async get(id) {
      if (isDemoMode) { await pause(); return { ...demoResult, id } }
      const payload = await request(`${ENDPOINTS.analyses}/${id}`)
      const analysis = normalizeAnalysis(payload.analysis || payload)
      const result = normalizeResult(analysis.result || analysis.result_json || {})
      if (!analysis.previous_papers_text?.trim() && result.schema_version === 1) result.similarityRisk = 'Not assessed'
      return { ...analysis, ...result, result }
    },
    async create(details) {
      if (isDemoMode) { await pause(1400); return { ...demoResult, id: `demo-${Date.now()}` } }
      const payload = await request(ENDPOINTS.analyses, { method: 'POST', body: JSON.stringify(details) })
      return normalizeAnalysis(payload.analysis || payload)
    },
    async remove(id) {
      if (isDemoMode) { await pause(250); return {} }
      return request(`${ENDPOINTS.analyses}/${id}`, { method: 'DELETE' })
    },
  },
}
