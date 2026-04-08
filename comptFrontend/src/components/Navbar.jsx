import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { GiHamburgerMenu } from 'react-icons/gi'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout, isSuperAdmin, isComptable, isOwner } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() { logout(); navigate('/') }

  // Onglets desktop selon le rôle
  function DesktopTabs() {
    if (isSuperAdmin) return (
      <li>
        <NavLink to="/super-admin" className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}>
          Gestion utilisateurs
        </NavLink>
      </li>
    )
    if (isComptable) return (
      <>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}>
            Mes dossiers
          </NavLink>
        </li>
        <li>
          <NavLink to="/comptabilite" className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}>
            Comptabilité
          </NavLink>
        </li>
        <li>
          <NavLink to="/aml" className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}>
            AML
          </NavLink>
        </li>
      </>
    )
    // CEO / Associé / Employé
    return (
      <>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}>
            Tableau de bord
          </NavLink>
        </li>
        <li>
          <NavLink to="/comptabilite" className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}>
            Comptabilité
          </NavLink>
        </li>
        <li>
          <NavLink to="/aml" className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}>
            AML
          </NavLink>
        </li>
        {isOwner && (
          <li>
            <NavLink to="/entreprises/nouvelle" className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}>
              + Entreprise
            </NavLink>
          </li>
        )}
      </>
    )
  }

  function MobileLinks() {
    if (isSuperAdmin) return (
      <NavLink to="/super-admin" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
        Gestion utilisateurs
      </NavLink>
    )
    if (isComptable) return (
      <>
        <NavLink to="/dashboard" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
          Mes dossiers
        </NavLink>
        <NavLink to="/comptabilite" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
          Comptabilité
        </NavLink>
        <NavLink to="/aml" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
          AML
        </NavLink>
      </>
    )
    return (
      <>
        <NavLink to="/dashboard" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
          Tableau de bord
        </NavLink>
        <NavLink to="/comptabilite" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
          Comptabilité
        </NavLink>
        <NavLink to="/aml" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
          AML
        </NavLink>
        {isOwner && (
          <NavLink to="/entreprises/nouvelle" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
            + Entreprise
          </NavLink>
        )}
      </>
    )
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <NavLink to={isSuperAdmin ? '/super-admin' : '/dashboard'} className="logo">
            <img
              src={theme === 'dark' ? '/comptIcon.png' : '/comptIcon2.png'}
              alt="Compt"
              style={{ width: 60, height: 42, borderRadius: 6, objectFit: 'contain' }}
            />
            <span className="logo-name">Compt</span>
          </NavLink>

          <ul className="nav-tabs nav-tabs-desktop">
            <DesktopTabs />
          </ul>
        </div>

        <div className="navbar-right">
          {user && (
            <Link
              to={isSuperAdmin ? '/changer-mot-de-passe' : '/profil'}
              className="user-email"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none', color: 'inherit' }}
              title="Mon profil"
            >
              {isSuperAdmin && (
                <span style={{ fontSize: '0.65rem', fontWeight: 500, background: 'var(--accent-bg)', color: 'var(--text-2)', padding: '0.1rem 0.4rem', borderRadius: '999px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Super Admin
                </span>
              )}
              {user.first_name
                ? `${user.first_name} ${user.last_name || ''}`.trim()
                : user.email}
            </Link>
          )}
          <button className="theme-toggle" onClick={toggle} title="Changer le thème">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-ghost btn-sm nav-logout" onClick={handleLogout}>
            Déconnexion
          </button>
          <button className="theme-toggle nav-burger" onClick={() => setMenuOpen((o) => !o)} title="Menu">
            <GiHamburgerMenu size={16} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="nav-mobile-menu">
          <MobileLinks />
          <NavLink to="/profil" className={({ isActive }) => 'nav-mobile-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
            Mon profil
          </NavLink>
          <button className="nav-mobile-link nav-mobile-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  )
}
