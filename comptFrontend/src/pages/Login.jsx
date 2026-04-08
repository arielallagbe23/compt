import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { theme, toggle } = useTheme()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await auth.login(form.email, form.password)
      login(data.token, data.user)
      if (data.user.is_super_admin) {
        navigate('/super-admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <Link to="/" className="logo">
            <img src="/comptIcon.png" alt="Compt" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain' }} />
            <span className="logo-name">Compt</span>
          </Link>
          <button className="theme-toggle" onClick={toggle} title="Changer le thème">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <h1 className="auth-title">Connexion</h1>
        <p className="auth-sub">Accédez à votre espace de gestion</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="email">Adresse e-mail</label>
            <input
              id="email" name="email" type="email"
              className="input" placeholder="vous@exemple.com"
              value={form.email} onChange={handleChange}
              required autoFocus
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">Mot de passe</label>
            <input
              id="password" name="password" type="password"
              className="input" placeholder="••••••••"
              value={form.password} onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-dark btn-full" disabled={loading}>
            {loading && <span className="spin" />}
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-footer">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
