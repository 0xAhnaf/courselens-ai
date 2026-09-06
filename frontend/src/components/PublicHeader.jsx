import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Icon from './Icon'
import Logo from './Logo'

export default function PublicHeader() {
  const [open, setOpen] = useState(false)

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
          <NavLink to="/login" onClick={() => setOpen(false)}>Sign in</NavLink>
          <Link className="button button--primary button--small" to="/signup" onClick={() => setOpen(false)}>Get started</Link>
        </nav>
      </div>
    </header>
  )
}
