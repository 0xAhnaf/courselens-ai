import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import Icon from './Icon'
import Logo from './Logo'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/analyses/new', label: 'New analysis', icon: 'plus' },
  { to: '/history', label: 'Analysis history', icon: 'history' },
]

const titles = {
  '/dashboard': ['Dashboard', 'Review recent assessment activity'],
  '/analyses/new': ['New analysis', 'Evaluate an assessment with AI'],
  '/history': ['Analysis history', 'Find and reopen previous reports'],
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout, isDemoMode } = useAuth()
  const location = useLocation()
  const current = location.pathname.startsWith('/analyses/') && location.pathname !== '/analyses/new'
    ? ['Analysis report', 'Evidence-based assessment review']
    : titles[location.pathname] || ['CourseLens AI', 'Faculty assessment workspace']

  return (
    <div className="app-shell">
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div>
          <div className="sidebar__brand"><Logo /></div>
          <nav className="sidebar-nav" aria-label="Application navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-profile">
          <div className="avatar">{(user?.name || 'F').charAt(0).toUpperCase()}</div>
          <div className="sidebar-profile__copy">
            <strong>{user?.name || 'Faculty member'}</strong>
            <span>{user?.email || 'Signed in'}</span>
          </div>
          <button className="icon-button" onClick={logout} aria-label="Sign out" title="Sign out"><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div>
            <h1>{current[0]}</h1>
            <p>{current[1]}</p>
          </div>
          {isDemoMode && <span className="demo-badge">Demo data</span>}
        </header>
        <main className="app-content page-enter"><Outlet /></main>
      </div>
    </div>
  )
}
