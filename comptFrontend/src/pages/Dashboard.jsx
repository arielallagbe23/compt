import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaPencilAlt } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { companies as companiesApi } from '../api'

export default function Dashboard() {
  const { user, isComptable } = useAuth()
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    companiesApi.getAll()
      .then(setList)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Tableau de bord</h1>
            <p className="page-sub">Connecté en tant que {user?.email}</p>
          </div>
          {!isComptable && (
            <Link to="/entreprises/nouvelle" className="btn btn-dark btn-sm">
              + Nouvelle entreprise
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Entreprises</p>
            <p className="stat-value">{loading ? '—' : list.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">IFU enregistrés</p>
            <p className="stat-value">{loading ? '—' : list.filter((c) => c.ifu).length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Secteurs</p>
            <p className="stat-value">
              {loading ? '—' : new Set(list.map((c) => c.sector).filter(Boolean)).size}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mes entreprises</span>
            {!isComptable && <Link to="/entreprises/nouvelle" className="btn btn-ghost btn-sm">+ Ajouter</Link>}
          </div>

          {error && (
            <div className="alert alert-error" style={{ margin: '1rem 1.5rem 0' }}>{error}</div>
          )}

          {loading ? (
            <div className="empty">
              <div className="spin" style={{ width: 20, height: 20, opacity: 0.4 }} />
            </div>
          ) : list.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🏢</div>
              <p className="empty-title">Aucune entreprise enregistrée</p>
              <p className="empty-sub">
                {isComptable
                  ? 'Aucune entreprise ne vous a encore été attribuée.'
                  : 'Ajoutez votre première structure pour commencer.'}
              </p>
              {!isComptable && (
                <Link to="/entreprises/nouvelle" className="btn btn-dark btn-sm">
                  Enregistrer une entreprise
                </Link>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Statut juridique</th>
                    <th>Secteur</th>
                    <th>IFU</th>
                    <th>RCCM</th>
                    <th>Ville</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td className="td-name">{c.name}</td>
                      <td>
                        {c.type
                          ? <span className="badge badge-neutral">{c.type}</span>
                          : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td>{c.legal_status || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                      <td>{c.sector     || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {c.ifu || <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td>{c.rccm || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                      <td>{c.city || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                      <td>
                        <button
                          className="row-action-btn"
                          title="Modifier"
                          onClick={() => navigate(`/entreprises/${c.id}`)}
                        >
                          <FaPencilAlt size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
