import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import Icon from './Icon'
import Logo from './Logo'

export default function PublicHeader() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <header className="public-header">
      <div className="container public-header__inner">
        <Logo />
        <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          <Icon name={open ? 'close' : 'menu'} />
        </button>
        <nav className={`public-nav ${open ? 'is-open' : ''}`} aria-label="Public navigation">
          <a href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a>
          <a href="/#features" onClick={() => setOpen(false)}>Features</a>

          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</NavLink>
              <NavLink to="/profile" onClick={() => setOpen(false)}>
                {user?.name ? user.name.split(' ')[0] : 'Profile'}
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              >
                <Icon name="logout" size={15} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)}>Sign in</NavLink>
              <Link className="button button--primary button--small" to="/signup" onClick={() => setOpen(false)}>Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}