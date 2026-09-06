import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { api } from '../services/api'

const initialForm = {
  courseTitle: '', courseCode: '', department: '', examType: '', semester: '', totalMarks: '',
  syllabusText: '', questionPaperText: '', previousPapersText: '',
}

function MaterialInput({ id, title, description, required, value, file, onTextChange, onFileChange }) {
  const [mode, setMode] = useState('text')
  return (
    <article className="material-card">
      <div className="material-card__header"><div><h3>{title} {required && <span>*</span>}</h3><p>{description}</p></div><div className="segmented"><button className={mode === 'text' ? 'is-active' : ''} onClick={() => setMode('text')} type="button">Paste text</button><button className={mode === 'file' ? 'is-active' : ''} onClick={() => setMode('file')} type="button">Upload</button></div></div>
      {mode === 'text' ? <textarea id={id} value={value} onChange={(event) => onTextChange(event.target.value)} rows="7" placeholder={`Paste ${title.toLowerCase()} here…`} /> : (
        <label className={`upload-zone ${file ? 'has-file' : ''}`} htmlFor={`${id}-file`}>
          <input id={`${id}-file`} type="file" accept=".txt,text/plain" onChange={(event) => onFileChange(event.target.files?.[0] || null)} />
          <Icon name={file ? 'file' : 'upload'} size={25} />
          {file ? <><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB · Click to replace</span></> : <><strong>Choose a text document</strong><span>TXT · Maximum 1 MB</span></>}
        </label>
      )}
    </article>
  )
}

export default function NewAnalysisPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState({ syllabus: null, questionPaper: null, previousPapers: null })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const setFile = async (field, file) => {
    if (!file) return setFiles((current) => ({ ...current, [field]: null }))
    if (!file.name.toLowerCase().endsWith('.txt')) return setError('The current backend supports TXT upload or pasted text only.')
    if (file.size > 1024 * 1024) return setError(`${file.name} exceeds the 1 MB limit.`)
    const text = await file.text()
    if (!text.trim()) return setError(`${file.name} does not contain readable text.`)
    const textFields = { syllabus: 'syllabusText', questionPaper: 'questionPaperText', previousPapers: 'previousPapersText' }
    setError('')
    setFiles((current) => ({ ...current, [field]: file }))
    update(textFields[field], text)
  }

  const stepOneValid = useMemo(() => form.courseTitle.trim() && form.courseCode.trim() && form.department.trim() && form.examType && Number(form.totalMarks) > 0, [form])
  const stepTwoValid = Boolean((form.syllabusText.trim() || files.syllabus) && (form.questionPaperText.trim() || files.questionPaper))

  const goNext = () => {
    setError('')
    if (step === 1 && !stepOneValid) return setError('Complete every required course field before continuing.')
    if (step === 2 && !stepTwoValid) return setError('Provide both the syllabus/CLOs and current question paper.')
    setStep((current) => Math.min(3, current + 1)); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    setSubmitting(true); setError('')
    const payload = {
      course_title: form.courseTitle.trim(),
      course_code: form.courseCode.trim(),
      department: form.department.trim(),
      exam_type: form.examType,
      semester: form.semester.trim(),
      total_marks: Number(form.totalMarks),
      syllabus_text: form.syllabusText.trim(),
      question_paper_text: form.questionPaperText.trim(),
      previous_papers_text: form.previousPapersText.trim(),
    }
    try {
      const analysis = await api.analyses.create(payload)
      if (!analysis.id) throw new Error('The server did not return an analysis ID.')
      navigate(`/analyses/${analysis.id}`, { state: { analysis } })
    } catch (requestError) { setError(requestError.message); setSubmitting(false) }
  }

  return (
    <div className="analysis-create">
      <div className="stepper" aria-label={`Step ${step} of 3`}>
        {['Course details', 'Materials', 'Review'].map((label, index) => <div key={label} className={`step ${step === index + 1 ? 'is-active' : ''} ${step > index + 1 ? 'is-complete' : ''}`}><span>{step > index + 1 ? <Icon name="check" size={14} /> : index + 1}</span><strong>{label}</strong></div>)}
      </div>

      {error && <div className="alert alert--error" role="alert"><Icon name="warning" size={18} /><span>{error}</span></div>}

      {step === 1 && <section className="form-panel page-enter"><div className="panel__header"><div><h2>Course and assessment details</h2><p>Tell CourseLens what is being evaluated.</p></div></div><div className="form-grid">
        <label className="span-2">Course title *<input value={form.courseTitle} onChange={(e) => update('courseTitle', e.target.value)} placeholder="Design and Analysis of Algorithms" /></label>
        <label>Course code *<input value={form.courseCode} onChange={(e) => update('courseCode', e.target.value)} placeholder="CSE 3101" /></label>
        <label>Department *<input value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Computer Science and Engineering" /></label>
        <label>Exam type *<select value={form.examType} onChange={(e) => update('examType', e.target.value)}><option value="">Select exam type</option><option>Quiz</option><option>Midterm examination</option><option>Final examination</option><option>Assignment</option></select></label>
        <label>Semester<input value={form.semester} onChange={(e) => update('semester', e.target.value)} placeholder="Spring 2026" /></label>
        <label>Total marks *<input type="number" min="1" value={form.totalMarks} onChange={(e) => update('totalMarks', e.target.value)} placeholder="100" /></label>
      </div></section>}

      {step === 2 && <section className="materials-stack page-enter">
        <MaterialInput id="syllabus" title="Syllabus or course learning outcomes" description="Required for coverage mapping." required value={form.syllabusText} file={files.syllabus} onTextChange={(value) => update('syllabusText', value)} onFileChange={(file) => setFile('syllabus', file)} />
        <MaterialInput id="question-paper" title="Current question paper" description="The assessment CourseLens will evaluate." required value={form.questionPaperText} file={files.questionPaper} onTextChange={(value) => update('questionPaperText', value)} onFileChange={(file) => setFile('questionPaper', file)} />
        <MaterialInput id="previous-papers" title="Previous question papers" description="Optional. Add these for similarity checking." value={form.previousPapersText} file={files.previousPapers} onTextChange={(value) => update('previousPapersText', value)} onFileChange={(file) => setFile('previousPapers', file)} />
      </section>}

      {step === 3 && !submitting && <section className="form-panel review-panel page-enter"><div className="panel__header"><div><h2>Review before analysis</h2><p>Confirm the assessment scope and provided materials.</p></div></div><dl className="review-list"><div><dt>Course</dt><dd>{form.courseCode} · {form.courseTitle}</dd></div><div><dt>Assessment</dt><dd>{form.examType} · {form.totalMarks} marks</dd></div><div><dt>Syllabus/CLOs</dt><dd>{files.syllabus?.name || `${form.syllabusText.trim().length} characters pasted`}</dd></div><div><dt>Current paper</dt><dd>{files.questionPaper?.name || `${form.questionPaperText.trim().length} characters pasted`}</dd></div><div><dt>Previous papers</dt><dd>{files.previousPapers?.name || (form.previousPapersText.trim() ? `${form.previousPapersText.trim().length} characters pasted` : 'Not provided')}</dd></div></dl><div className="faculty-notice"><Icon name="shield" size={20} /><p><strong>Faculty-controlled review</strong><span>CourseLens provides decision support. Verify its evidence before changing an assessment.</span></p></div></section>}

      {submitting && <section className="processing-panel page-enter" role="status"><span className="processing-orbit"><Icon name="sparkles" size={25} /></span><h2>Analyzing your assessment</h2><p>Keep this page open while CourseLens prepares the report.</p><div className="processing-steps"><span className="is-active"><Icon name="check" size={15} /> Reading materials</span><span>Mapping course coverage</span><span>Evaluating questions</span><span>Preparing recommendations</span></div></section>}

      {!submitting && <div className="form-actions"><button className="button button--secondary" disabled={step === 1} onClick={() => { setError(''); setStep((current) => current - 1) }}>Back</button>{step < 3 ? <button className="button button--primary" onClick={goNext}>Continue <Icon name="arrow" size={17} /></button> : <button className="button button--primary" onClick={submit}><Icon name="sparkles" size={17} /> Run AI analysis</button>}</div>}
    </div>
  )
}
