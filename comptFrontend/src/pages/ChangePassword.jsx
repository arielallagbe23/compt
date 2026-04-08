import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiEye, HiEyeOff } from 'react-icons/hi'
import Navbar from '../components/Navbar'
import { auth as authApi } from '../api'
import { useAuth } from '../context/AuthContext'

const HINT = "Zéro dans « Compt », dollar, initiales Bénin+prénom, dièse, prénom avec chiffres, point d'exclamation"

// Indicateur de force du mot de passe
function strength(pwd) {
  let score = 0
  if (pwd.length >= 8)  score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score // 0–5
}

function StrengthBar({ pwd }) {
  if (!pwd) return null
  const s     = strength(pwd)
  const label = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Très fort'][s]
  const color = ['var(--danger)', 'var(--danger)', '#f59e0b', '#f59e0b', 'var(--success)', 'var(--success)'][s]
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '0.3rem' }}>
        {[1,2,3,4,5].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: i <= s ? color : 'var(--bg-3)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.7rem', color, fontWeight: 400 }}>{label}</span>
    </div>
  )
}

function PasswordInput({ id, name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id} name={name} type={show ? 'text' : 'password'}
        className="input" placeholder={placeholder}
        value={value} onChange={onChange} required
        style={{ paddingRight: '2.5rem' }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-3)', display: 'flex', alignItems: 'center',
        }}
        tabIndex={-1}
      >
        {show ? <HiEyeOff size={16} /> : <HiEye size={16} />}
      </button>
    </div>
  )
}

export default function ChangePassword() {
  const { isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (form.next !== form.confirm)
      return setError('Les nouveaux mots de passe ne correspondent pas.')
    if (form.next.length < 8)
      return setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
    if (strength(form.next) < 2)
      return setError('Mot de passe trop simple. Ajoutez des chiffres, majuscules ou caractères spéciaux.')

    setLoading(true)
    try {
      const res = await authApi.changePassword(form.current, form.next)
      setSuccess(res.message || 'Mot de passe mis à jour.')
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const backTo = isSuperAdmin ? '/super-admin' : '/dashboard'

  return (
    <>
      <Navbar />
      <main className="page" style={{ maxWidth: 520 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Mot de passe</h1>
            <p className="page-sub">Modifier votre mot de passe de connexion</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(backTo)}>
            ← Retour
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Changer le mot de passe</span>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

            {/* Indice mot de passe temporaire (visible uniquement si demandé) */}
            <div className="pwd-hint-block">
              <button
                type="button"
                className="pwd-hint-toggle"
                onClick={() => setShowHint((h) => !h)}
              >
                💡 {showHint ? 'Masquer l\'indice' : 'Afficher l\'indice du mot de passe actuel'}
              </button>
              {showHint && (
                <p className="pwd-hint-text">{HINT}</p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="label" htmlFor="current">Mot de passe actuel</label>
                <PasswordInput
                  id="current" name="current"
                  value={form.current} onChange={handleChange}
                  placeholder="Votre mot de passe actuel"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="next">Nouveau mot de passe</label>
                <PasswordInput
                  id="next" name="next"
                  value={form.next} onChange={handleChange}
                  placeholder="Minimum 8 caractères"
                />
                <StrengthBar pwd={form.next} />
              </div>

              <div className="field">
                <label className="label" htmlFor="confirm">Confirmer le nouveau mot de passe</label>
                <PasswordInput
                  id="confirm" name="confirm"
                  value={form.confirm} onChange={handleChange}
                  placeholder="Répétez le nouveau mot de passe"
                />
                {form.confirm && form.next !== form.confirm && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '0.3rem' }}>
                    Les mots de passe ne correspondent pas
                  </p>
                )}
                {form.confirm && form.next === form.confirm && form.confirm.length > 0 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.3rem' }}>
                    ✓ Les mots de passe correspondent
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-dark btn-full"
                disabled={loading || !form.current || !form.next || !form.confirm}
              >
                {loading && <span className="spin" />}
                {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
