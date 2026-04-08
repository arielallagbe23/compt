import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const FEATURES = [
  {
    icon: '🏗️',
    title: 'Structure d\'entreprise',
    desc: 'Organisez vos holdings, filiales et participations en un organigramme clair et lisible.',
  },
  {
    icon: '💳',
    title: 'Transactions multi-devises',
    desc: 'Tracez chaque mouvement en XOF, XAF, EUR, USD et crypto (USDT, ETH, BTC) en temps réel.',
  },
  {
    icon: '📊',
    title: 'Rapports AML',
    desc: 'Générez des rapports de conformité anti-blanchiment pour rester en règle face aux autorités fiscales.',
  },
  {
    icon: '🔐',
    title: 'Accès sécurisé',
    desc: 'Authentification JWT, données chiffrées et accès cloisonné par utilisateur.',
  },
]

const CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD', 'USDT', 'ETH', 'BTC']

export default function Landing() {
  const { theme, toggle } = useTheme()

  return (
    <>
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="logo">
            <img src="/comptIcon.png" alt="Compt" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain' }} />
            <span className="logo-name">Compt</span>
          </div>
          <div className="landing-header-right">
            <button className="theme-toggle" onClick={toggle} title="Changer le thème">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link to="/login" className="btn btn-ghost btn-sm">Connexion</Link>
            <Link to="/register" className="btn btn-dark btn-sm">Commencer</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <div className="hero-tag">
              <span>🇧🇯</span>
              Pour les entrepreneurs béninois et la diaspora
            </div>
            <h1>
              Gérez vos entreprises.<br />Tracez chaque transaction.
            </h1>
            <p>
              Compt centralise la gestion de vos structures d'entreprise et de vos flux financiers — en francs CFA, en euros, en dollars et en crypto — pour une comptabilité claire, rigoureuse et conforme.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-dark btn-lg">Créer un compte</Link>
              <Link to="/login" className="btn btn-ghost btn-lg">Se connecter</Link>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* Features */}
        <section className="features">
          <div className="container">
            <p className="features-label">Ce que Compt vous offre</p>
            <div className="features-grid">
              {FEATURES.map((f) => (
                <div className="feature-card" key={f.title}>
                  <div className="feature-icon">{f.icon}</div>
                  <p className="feature-title">{f.title}</p>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Currencies */}
        <section className="currencies">
          <div className="container">
            <p className="currencies-label">Devises supportées</p>
            <div className="currencies-list">
              {CURRENCIES.map((c) => (
                <span className="currency-pill" key={c}>{c}</span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="landing-cta">
          <div className="container">
            <h2>Prêt à structurer votre activité ?</h2>
            <p>Rejoignez les entrepreneurs béninois qui gèrent leurs finances en toute transparence.</p>
            <Link to="/register" className="btn btn-dark btn-lg">Démarrer gratuitement</Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="landing-footer">
          <div className="logo">
            <img src="/comptIcon.png" alt="Compt" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain' }} />
            <span className="logo-name">Compt</span>
          </div>
          <p>© {new Date().getFullYear()} Compt — Gestion d'entreprises béninoises</p>
        </div>
      </footer>
    </>
  )
}
