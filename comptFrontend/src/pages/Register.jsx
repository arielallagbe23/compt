import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../api'
import { useTheme } from '../context/ThemeContext'

const ROLES = [
  { value: 'ceo',       label: 'CEO / Dirigeant',         desc: 'Je crée et gère mes entreprises' },
  { value: 'associe',   label: 'Associé(e)',               desc: 'Je co-gère une entreprise existante' },
  { value: 'comptable', label: 'Comptable',                desc: 'Je gère la comptabilité de mes clients' },
  { value: 'employe',   label: 'Employé(e)',               desc: 'J\'ai un accès limité à une entreprise' },
]

export default function Register() {
  const { theme, toggle } = useTheme()
  const [step,    setStep]    = useState(1) // 1 = rôle, 2 = infos
  const [form,    setForm]    = useState({ email: '', password: '', confirm: '', first_name: '', last_name: '', user_role: '' })
  const [error,   setError]   = useState('')
  const [done,    setDone]    = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function selectRole(role) {
    setForm((f) => ({ ...f, user_role: role }))
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm)
      return setError('Les mots de passe ne correspondent pas.')
    if (form.password.length < 8)
      return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (!form.first_name || !form.last_name)
      return setError('Prénom et nom sont requis.')
    setLoading(true)
    try {
      await auth.register(form.email, form.password, form.user_role, form.first_name, form.last_name)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.value === form.user_role)

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ maxWidth: step === 1 ? 520 : 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <Link to="/" className="logo">
            <img src="/comptIcon.png" alt="Compt"
              style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain' }} />
            <span className="logo-name">Compt</span>
          </Link>
          <button className="theme-toggle" onClick={toggle} title="Thème">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📬</div>
            <h1 className="auth-title">Demande envoyée</h1>
            <p className="auth-sub" style={{ lineHeight: 1.7 }}>
              Votre demande a bien été reçue.<br />
              Un administrateur va valider votre accès.<br />
              Vous recevrez un email dès confirmation.
            </p>
            <Link to="/login" className="btn btn-ghost btn-sm"
              style={{ marginTop: '1.5rem', display: 'inline-block' }}>
              ← Retour à la connexion
            </Link>
          </div>

        ) : step === 1 ? (
          <>
            <h1 className="auth-title">Qui êtes-vous ?</h1>
            <p className="auth-sub" style={{ marginBottom: '1.5rem' }}>
              Choisissez votre rôle pour une expérience adaptée
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => selectRole(r.value)}
                  className="role-card"
                >
                  <span className="role-card-label">{r.label}</span>
                  <span className="role-card-desc">{r.desc}</span>
                </button>
              ))}
            </div>
            <p className="auth-footer">
              Déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
          </>

        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                fontSize: '0.8rem', padding: 0, marginBottom: '1rem', fontFamily: 'inherit' }}
            >
              ← Changer de rôle
            </button>

            <div style={{ marginBottom: '1.25rem' }}>
              <h1 className="auth-title">Créer un compte</h1>
              <p className="auth-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Vous êtes
                <span style={{ fontSize: '0.7rem', fontWeight: 500, padding: '0.15rem 0.5rem',
                  borderRadius: 999, background: 'var(--bg-3)', border: '1px solid var(--border)',
                  color: 'var(--text-2)' }}>
                  {selectedRole?.label}
                </span>
              </p>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="field">
                  <label className="label" htmlFor="first_name">Prénom *</label>
                  <input id="first_name" name="first_name" type="text" className="input"
                    placeholder="Jean" value={form.first_name} onChange={handleChange} required autoFocus />
                </div>
                <div className="field">
                  <label className="label" htmlFor="last_name">Nom *</label>
                  <input id="last_name" name="last_name" type="text" className="input"
                    placeholder="Dupont" value={form.last_name} onChange={handleChange} required />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" className="input"
                  placeholder="vous@exemple.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="password">Mot de passe *</label>
                <input id="password" name="password" type="password" className="input"
                  placeholder="Minimum 8 caractères" value={form.password} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="confirm">Confirmer *</label>
                <input id="confirm" name="confirm" type="password" className="input"
                  placeholder="••••••••" value={form.confirm} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn btn-dark btn-full" disabled={loading}>
                {loading && <span className="spin" />}
                {loading ? 'Envoi…' : 'Envoyer ma demande'}
              </button>
            </form>

            <p className="auth-footer">
              Déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
