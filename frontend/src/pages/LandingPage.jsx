import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PublicHeader from '../components/PublicHeader'

const features = [
  ['Course coverage', 'See which outcomes are covered, partial, or missing.'],
  ['Question balance', 'Review difficulty and cognitive-level distribution.'],
  ['Similarity check', 'Compare current questions with previous assessments.'],
  ['Clear recommendations', 'Receive prioritized suggestions backed by evidence.'],
]

export default function LandingPage() {
  return (
    <div className="landing">
      <PublicHeader />
      <main>
        <section className="hero-section container">
          <div className="hero-copy page-enter">
            <span className="eyebrow"><Icon name="sparkles" size={15} /> AI-powered assessment review</span>
            <h1>Build better assessments with clarity.</h1>
            <p>CourseLens helps university faculty evaluate course coverage, question balance, and repetition—then turns the findings into practical improvements.</p>
            <div className="hero-actions">
              <Link className="button button--primary" to="/signup">Start an analysis <Icon name="arrow" size={17} /></Link>
              <a className="button button--secondary" href="#how-it-works">See how it works</a>
            </div>
            <p className="trust-note"><Icon name="shield" size={17} /> AI supports your judgment. You always make the final decision.</p>
          </div>
          <div className="report-preview fade-up-delay" aria-label="Example analysis preview">
            <div className="report-preview__header">
              <div><span>Assessment snapshot</span><strong>Algorithm Design · Final</strong></div>
              <span className="status status--completed">Completed</span>
            </div>
            <div className="preview-score"><strong>88</strong><span>/100<br />quality score</span></div>
            <div className="preview-grid">
              <div><span>Coverage</span><strong>84%</strong></div>
              <div><span>Difficulty</span><strong>Balanced</strong></div>
              <div><span>Similarity</span><strong>Low risk</strong></div>
            </div>
            <div className="preview-message"><Icon name="check" size={17} /> Strong alignment with one outcome needing review.</div>
          </div>
        </section>

        <section className="welcome-strip"><div className="container"><Icon name="sparkles" size={18} /><strong>Welcome to a simpler way to review academic assessments.</strong></div></section>

        <section className="section container" id="how-it-works">
          <div className="section-heading"><span className="eyebrow">How it works</span><h2>One useful journey, from input to insight.</h2></div>
          <div className="steps-grid">
            {[
              ['01', 'Provide course materials', 'Add course details, outcomes, and the current paper.'],
              ['02', 'Let AI evaluate', 'CourseLens maps coverage, balance, and similarities.'],
              ['03', 'Review recommendations', 'Inspect evidence and decide what should change.'],
            ].map(([number, title, copy]) => <article className="step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section className="section section--soft" id="features">
          <div className="container">
            <div className="section-heading"><span className="eyebrow">Focused analysis</span><h2>Everything needed for a confident review.</h2></div>
            <div className="features-grid">
              {features.map(([title, copy], index) => <article className="feature-card" key={title}><span className="feature-icon">{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}
            </div>
          </div>
        </section>

        <section className="cta-section container">
          <div><span className="eyebrow">Ready when you are</span><h2>Review your next question paper with confidence.</h2></div>
          <Link className="button button--primary" to="/signup">Get started <Icon name="arrow" size={17} /></Link>
        </section>
      </main>
      <footer className="footer"><div className="container"><strong>CourseLens AI</strong><span>Faculty assessment decision support</span><span>© 2026 CourseLens AI</span></div></footer>
    </div>
  )
}
