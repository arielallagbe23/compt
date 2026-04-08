import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Verify() {
  const { token }   = useParams()
  const { theme }   = useTheme()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`/auth/verify/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStatus('error'); setMessage(data.error) }
        else            { setStatus('success'); setMessage(data.message) }
      })
      .catch(() => { setStatus('error'); setMessage('Erreur réseau. Réessayez.') })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <img src={theme === 'dark' ? '/comptIcon.png' : '/comptIcon2.png'} alt="Compt"
            style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain' }} />
          <span className="logo-name">Compt</span>
        </Link>

        {status === 'loading' && (
          <>
            <div className="spin" style={{ width: 24, height: 24, opacity: 0.4, margin: '0 auto 1rem' }} />
            <p className="auth-sub">Vérification en cours…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <h1 className="auth-title">Compte activé !</h1>
            <p className="auth-sub" style={{ lineHeight: 1.7 }}>{message}</p>
            <Link to="/login" className="btn btn-dark btn-sm" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
              Se connecter
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❌</div>
            <h1 className="auth-title">Lien invalide</h1>
            <p className="auth-sub" style={{ lineHeight: 1.7 }}>{message}</p>
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
              ← Retour
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
