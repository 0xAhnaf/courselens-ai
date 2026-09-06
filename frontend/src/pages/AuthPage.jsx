import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { useAuth } from '../context/authContext'

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, signup, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (isSignup && form.name.trim().length < 2) return setError('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.')
    if (form.password.length < 8) return setError('Password must contain at least 8 characters.')
    if (isSignup && form.password !== form.confirmPassword) return setError('Passwords do not match.')
    setSubmitting(true)
    try {
      if (isSignup) await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      else await login({ email: form.email.trim(), password: form.password })
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel page-enter">
        <Logo />
        <div className="auth-heading">
          <span className="eyebrow">Faculty workspace</span>
          <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p>{isSignup ? 'Start reviewing assessments with evidence-based AI support.' : 'Sign in to continue your assessment reviews.'}</p>
        </div>
        {error && <div className="alert alert--error" role="alert"><Icon name="warning" size={18} /><span>{error}</span></div>}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isSignup && <label>Full name<input name="name" value={form.name} onChange={handleChange} autoComplete="name" placeholder="Dr. Faculty Member" /></label>}
          <label>Institutional email<input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" placeholder="name@university.edu" /></label>
          <label>Password<div className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} /></button></div></label>
          {isSignup && <label>Confirm password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" placeholder="Repeat your password" /></label>}
          <button className="button button--primary button--full" disabled={submitting} type="submit">{submitting ? <><span className="spinner spinner--small" /> Please wait…</> : (isSignup ? 'Create account' : 'Sign in')}</button>
        </form>
        <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to CourseLens?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p>
        <Link className="back-link" to="/">← Back to home</Link>
      </div>
      <aside className="auth-aside"><div><Icon name="shield" size={28} /><h2>Thoughtful AI. Faculty-controlled decisions.</h2><p>Evaluate coverage and question quality without giving up academic judgment.</p></div></aside>
    </div>
  )
}
