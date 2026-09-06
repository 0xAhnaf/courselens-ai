import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFoundPage() {
  return <main className="not-found"><Logo /><span>404</span><h1>Page not found</h1><p>The page may have moved or the address may be incorrect.</p><Link className="button button--primary" to="/">Return home</Link></main>
}
