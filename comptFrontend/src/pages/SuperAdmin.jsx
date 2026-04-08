import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiCheck, HiX, HiRefresh, HiShieldCheck, HiTrash } from 'react-icons/hi'
import Navbar from '../components/Navbar'
import { superAdmin as api } from '../api'
import { useAuth } from '../context/AuthContext'

const STATUS_LABEL = {
  pending:  { label: 'En attente',   cls: 'sa-badge pending'  },
  approved: { label: 'Email envoyé', cls: 'sa-badge approved' },
  active:   { label: 'Actif',        cls: 'sa-badge active'   },
  rejected: { label: 'Rejeté',       cls: 'sa-badge rejected' },
}

const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export default function SuperAdmin() {
  const { isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [actionMsg,    setActionMsg]    = useState('')
  const [rejectModal,  setRejectModal]  = useState(null) // { id, email }
  const [rejectReason, setRejectReason] = useState('')
  const [busy,         setBusy]         = useState(null) // id en cours

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/dashboard'); return }
    load()
  }, [isSuperAdmin])

  function load() {
    setLoading(true)
    api.getUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  async function act(fn, successMsg) {
    setActionMsg(''); setError('')
    try {
      const res = await fn()
      setActionMsg(res.message || successMsg)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function handleApprove(id) {
    setBusy(id)
    await act(() => api.approve(id), 'Email envoyé.')
  }

  async function handleReject() {
    if (!rejectModal) return
    setBusy(rejectModal.id)
    await act(() => api.reject(rejectModal.id, rejectReason), 'Rejeté.')
    setRejectModal(null); setRejectReason('')
  }

  async function handleRevoke(id) {
    if (!window.confirm('Révoquer cet accès ?')) return
    setBusy(id)
    await act(() => api.revoke(id), 'Accès révoqué.')
  }

  async function handleResend(id) {
    setBusy(id)
    await act(() => api.resend(id), 'Email renvoyé.')
  }

  async function handleToggleAdmin(id) {
    setBusy(id)
    await act(() => api.toggleAdmin(id), 'Rôle mis à jour.')
  }

  const counts = {
    pending:  users.filter((u) => u.status === 'pending').length,
    approved: users.filter((u) => u.status === 'approved').length,
    active:   users.filter((u) => u.status === 'active').length,
    rejected: users.filter((u) => u.status === 'rejected').length,
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Panel Super Admin</h1>
            <p className="page-sub">Gestion des accès utilisateurs</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <HiRefresh size={14} /> Actualiser
          </button>
        </div>

        {/* Compteurs */}
        <div className="sa-counts">
          <div className="sa-count-card">
            <span className="sa-count-n" style={{ color: '#f59e0b' }}>{counts.pending}</span>
            <span className="sa-count-l">En attente</span>
          </div>
          <div className="sa-count-card">
            <span className="sa-count-n" style={{ color: 'var(--text-2)' }}>{counts.approved}</span>
            <span className="sa-count-l">Email envoyé</span>
          </div>
          <div className="sa-count-card">
            <span className="sa-count-n" style={{ color: 'var(--success)' }}>{counts.active}</span>
            <span className="sa-count-l">Actifs</span>
          </div>
          <div className="sa-count-card">
            <span className="sa-count-n" style={{ color: 'var(--danger)' }}>{counts.rejected}</span>
            <span className="sa-count-l">Rejetés</span>
          </div>
        </div>

        {actionMsg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{actionMsg}</div>}
        {error     && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}

        {loading ? (
          <div className="empty"><div className="spin" style={{ width: 20, height: 20, opacity: 0.3 }} /></div>
        ) : users.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Rôle</th>
                    <th>Inscription</th>
                    <th>Validé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isBusy = busy === u.id
                    const badge  = STATUS_LABEL[u.status] || { label: u.status, cls: 'sa-badge' }
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 300 }}>{u.email}</td>
                        <td>
                          <span className={badge.cls}>{badge.label}</span>
                          {u.status === 'rejected' && u.rejection_reason && (
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
                              {u.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {u.is_admin && <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Admin</span>}
                            {!u.is_admin && <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>Utilisateur</span>}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{fmtDate(u.created_at)}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{fmtDate(u.verified_at)}</td>
                        <td>
                          <div className="sa-actions">
                            {/* PENDING → Approuver ou Rejeter */}
                            {u.status === 'pending' && (
                              <>
                                <button
                                  className="sa-btn sa-btn-approve"
                                  disabled={isBusy}
                                  onClick={() => handleApprove(u.id)}
                                  title="Approuver et envoyer l'email"
                                >
                                  {isBusy ? <span className="spin" style={{ width: 12, height: 12 }} /> : <HiCheck size={13} />}
                                  Approuver
                                </button>
                                <button
                                  className="sa-btn sa-btn-reject"
                                  disabled={isBusy}
                                  onClick={() => { setRejectModal({ id: u.id, email: u.email }); setRejectReason('') }}
                                  title="Rejeter la demande"
                                >
                                  <HiX size={13} /> Rejeter
                                </button>
                              </>
                            )}

                            {/* APPROVED → Renvoyer email */}
                            {u.status === 'approved' && (
                              <button
                                className="sa-btn sa-btn-resend"
                                disabled={isBusy}
                                onClick={() => handleResend(u.id)}
                                title="Renvoyer l'email de vérification"
                              >
                                {isBusy ? <span className="spin" style={{ width: 12, height: 12 }} /> : <HiRefresh size={13} />}
                                Renvoyer email
                              </button>
                            )}

                            {/* ACTIVE → Révoquer + toggle admin */}
                            {u.status === 'active' && (
                              <>
                                <button
                                  className="sa-btn sa-btn-admin"
                                  disabled={isBusy}
                                  onClick={() => handleToggleAdmin(u.id)}
                                  title={u.is_admin ? 'Retirer le rôle admin' : 'Donner le rôle admin'}
                                >
                                  {isBusy ? <span className="spin" style={{ width: 12, height: 12 }} /> : <HiShieldCheck size={13} />}
                                  {u.is_admin ? 'Retirer admin' : 'Rendre admin'}
                                </button>
                                <button
                                  className="sa-btn sa-btn-reject"
                                  disabled={isBusy}
                                  onClick={() => handleRevoke(u.id)}
                                  title="Révoquer l'accès"
                                >
                                  <HiTrash size={13} /> Révoquer
                                </button>
                              </>
                            )}

                            {/* REJECTED → Réapprouver */}
                            {u.status === 'rejected' && (
                              <button
                                className="sa-btn sa-btn-approve"
                                disabled={isBusy}
                                onClick={() => handleApprove(u.id)}
                                title="Approuver à nouveau"
                              >
                                {isBusy ? <span className="spin" style={{ width: 12, height: 12 }} /> : <HiCheck size={13} />}
                                Réapprouver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal rejet */}
      {rejectModal && (
        <div className="sa-modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sa-modal-title">Rejeter la demande</h3>
            <p className="sa-modal-sub">{rejectModal.email}</p>
            <div className="field" style={{ marginTop: '1rem' }}>
              <label className="label">Motif (optionnel — envoyé par email)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Ex : Informations insuffisantes, domaine non reconnu…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="sa-btn sa-btn-reject" onClick={handleReject}>
                <HiX size={13} /> Confirmer le rejet
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setRejectModal(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
