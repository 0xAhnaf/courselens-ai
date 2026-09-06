import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import Icon from './Icon'
import Logo from './Logo'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/analyses/new', label: 'New analysis', icon: 'plus' },
  { to: '/history', label: 'Analysis history', icon: 'history' },
  { to: '/profile', label: 'Profile', icon: 'user' },
]

const titles = {
  '/dashboard': ['Dashboard', 'Review recent assessment activity'],
  '/analyses/new': ['New analysis', 'Evaluate an assessment with AI'],
  '/history': ['Analysis history', 'Find and reopen previous reports'],
  '/profile': ['Account Profile', 'Manage your faculty profile information'],
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
        <div className="sidebar-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <Link 
            to="/profile" 
            className="sidebar-profile__info" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              textDecoration: 'none', 
              color: 'inherit', 
              minWidth: 0, 
              flex: 1 
            }}
          >
            <div className="avatar" style={{ flexShrink: 0 }}>
              {(user?.name || 'F').charAt(0).toUpperCase()}
            </div>
            <div 
              className="sidebar-profile__copy" 
              style={{ 
                minWidth: 0, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}
            >
              <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Faculty member'}
              </strong>
              <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'Signed in'}
              </span>
            </div>
          </Link>
          <button 
            type="button"
            onClick={logout} 
            aria-label="Sign out" 
            title="Sign out" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.65rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
          >
            <Icon name="logout" size={15} />
            <span>Logout</span>
          </button>
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