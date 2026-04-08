import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { HiArrowUp, HiArrowDown, HiTrash, HiScale, HiSwitchVertical } from 'react-icons/hi'
import Navbar from '../components/Navbar'
import { companies as companiesApi, transactions as txApi } from '../api'
import { useAuth } from '../context/AuthContext'

const CURRENCIES   = ['XOF', 'XAF', 'EUR', 'USD', 'USDT', 'ETH', 'BTC']
const MOMO_CURRS   = new Set(['XOF', 'XAF'])
const CRYPTO_CURRS = new Set(['USDT', 'ETH', 'BTC'])

const TO_XOF = {
  XOF: 1, XAF: 1, EUR: 655.957, USD: 610, USDT: 610, ETH: 2_350_000, BTC: 38_500_000,
}
const toXOF    = (amount, currency) => amount * (TO_XOF[currency] || 0)
const fmtXOF   = (n) => Math.round(n).toLocaleString('fr-FR') + ' F CFA'
const fmtNative = (n, currency) => {
  if (['XOF', 'XAF'].includes(currency)) return Math.round(Number(n)).toLocaleString('fr-FR')
  if (['ETH', 'BTC'].includes(currency))
    return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const NETWORKS = {
  ETH:  { label: 'Ethereum',    explorer: 'https://etherscan.io/tx/' },
  USDT: { label: 'Tron TRC-20', explorer: 'https://tronscan.org/#/transaction/' },
  BTC:  { label: 'Bitcoin',     explorer: 'https://blockstream.info/tx/' },
}

const INFO_FIELDS = [
  { key: 'type',             label: 'Type' },
  { key: 'legal_status',    label: 'Statut juridique' },
  { key: 'sector',          label: 'Secteur' },
  { key: 'city',            label: 'Ville' },
  { key: 'ifu',             label: 'IFU' },
  { key: 'rccm',            label: 'RCCM' },
  { key: 'registration_date', label: 'Date d\'immatriculation' },
]

const EMPTY_FORM = {
  type: 'recette', amount: '', currency: 'XOF', description: '',
  date: new Date().toISOString().slice(0, 10),
  sender_name: '', sender_phone: '', receiver_name: '', receiver_phone: '',
  from_address: '', to_address: '', tx_hash: '', network: '', aml_score: '',
}

const PAGE_SIZE = 10

export default function CompanyDetail() {
  const { id }  = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [company,       setCompany]       = useState(null)
  const [txList,        setTxList]        = useState([])
  const [loadingC,      setLoadingC]      = useState(true)
  const [loadingT,      setLoadingT]      = useState(true)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')
  const [page,          setPage]          = useState(1)
  const [deleting,      setDeleting]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [togglingId,    setTogglingId]    = useState(null)
  const [deletingTxId,  setDeletingTxId]  = useState(null)

  useEffect(() => {
    companiesApi.getOne(id)
      .then(setCompany)
      .catch(() => {})
      .finally(() => setLoadingC(false))
    fetchTx()
  }, [id])

  function fetchTx() {
    setLoadingT(true)
    txApi.getAll(id)
      .then(setTxList)
      .catch(() => {})
      .finally(() => setLoadingT(false))
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setSaving(true)
    try {
      await txApi.create(id, { ...form, amount: parseFloat(form.amount) })
      setSuccess('Transaction ajoutée.')
      setForm(EMPTY_FORM)
      setPage(1)
      fetchTx()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleTxType(tx) {
    setTogglingId(tx.id)
    const newType = tx.type === 'recette' ? 'depense' : 'recette'
    try {
      const updated = await txApi.patch(id, tx.id, { type: newType })
      setTxList((prev) => prev.map((t) => t.id === tx.id ? { ...t, type: updated.type } : t))
    } catch (err) {
      setError(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  async function deleteTx(txId) {
    setDeletingTxId(txId)
    try {
      await txApi.delete(id, txId)
      setTxList((prev) => prev.filter((t) => t.id !== txId))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingTxId(null)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await companiesApi.delete(id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  // ── Totaux ──
  const totalRecettesXOF = txList
    .filter((t) => t.type === 'recette')
    .reduce((sum, t) => sum + toXOF(parseFloat(t.amount), t.currency), 0)

  const totalDepensesXOF = txList
    .filter((t) => t.type === 'depense')
    .reduce((sum, t) => sum + toXOF(parseFloat(t.amount), t.currency), 0)

  const soldeXOF = totalRecettesXOF - totalDepensesXOF

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  // Pagination
  const totalPages = Math.ceil(txList.length / PAGE_SIZE)
  const paginated  = txList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <Navbar />
      <main className="page">

        {/* ── HEADER ── */}
        <div className="page-header">
          <div>
            {loadingC
              ? <h1 className="page-title">Chargement…</h1>
              : <h1 className="page-title">{company?.name}</h1>
            }
            <p className="page-sub">Détail et transactions</p>
          </div>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">← Retour</Link>
        </div>

        {/* ── INFOS ── */}
        {company && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <span className="card-title">Informations</span>
              <span className="badge badge-neutral">{company.type || 'N/A'}</span>
            </div>
            <div className="detail-grid">
              {INFO_FIELDS.map(({ key, label }) => (
                <div className="detail-item" key={key}>
                  <span className="detail-label">{label}</span>
                  <span className="detail-value">
                    {key === 'registration_date'
                      ? formatDate(company[key])
                      : company[key] || <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BILAN XOF ── */}
        {txList.length > 0 && (
          <div className="bilan-strip">
            <div className="bilan-cell">
              <span className="bilan-label"><HiArrowUp size={12} /> Recettes</span>
              <span className="bilan-amount recette">{fmtXOF(totalRecettesXOF)}</span>
            </div>
            <div className="bilan-sep" />
            <div className="bilan-cell">
              <span className="bilan-label"><HiArrowDown size={12} /> Dépenses</span>
              <span className="bilan-amount depense">− {fmtXOF(totalDepensesXOF)}</span>
            </div>
            <div className="bilan-sep" />
            <div className="bilan-cell bilan-cell-main">
              <span className="bilan-label"><HiScale size={12} /> Solde net</span>
              <span className={`bilan-amount ${soldeXOF >= 0 ? 'pos' : 'neg'}`}>
                {soldeXOF >= 0 ? '+' : ''}{fmtXOF(soldeXOF)}
              </span>
            </div>
          </div>
        )}

        {/* ── FORMULAIRE ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Nouvelle transaction</span>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="tx-form-grid">
                {/* Col gauche */}
                <div className="tx-form-col">
                  <div className="field">
                    <label className="label">Type</label>
                    <div className="type-toggle">
                      <button type="button"
                        className={`type-btn recette${form.type === 'recette' ? ' active' : ''}`}
                        onClick={() => setForm((f) => ({ ...f, type: 'recette' }))}>
                        <HiArrowUp size={14} /> Recette
                      </button>
                      <button type="button"
                        className={`type-btn depense${form.type === 'depense' ? ' active' : ''}`}
                        onClick={() => setForm((f) => ({ ...f, type: 'depense' }))}>
                        <HiArrowDown size={14} /> Dépense
                      </button>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label className="label" htmlFor="amount">Montant *</label>
                      <input id="amount" name="amount" type="number" step="any" min="0"
                        className="input" placeholder="0.00"
                        value={form.amount} onChange={handleChange} required />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="currency">Devise *</label>
                      <select id="currency" name="currency" className="input"
                        value={form.currency} onChange={handleChange}>
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Aperçu XOF en temps réel */}
                  {form.amount && !['XOF', 'XAF'].includes(form.currency) && (
                    <p className="input-hint">
                      ≈ {fmtXOF(toXOF(parseFloat(form.amount) || 0, form.currency))}
                    </p>
                  )}
                </div>

                {/* Col droite */}
                <div className="tx-form-col">
                  <div className="field">
                    <label className="label" htmlFor="description">Description</label>
                    <input id="description" name="description" type="text" className="input"
                      placeholder="Ex : Loyer bureau, Facture client…"
                      value={form.description} onChange={handleChange} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="date">Date</label>
                    <input id="date" name="date" type="date" className="input"
                      value={form.date} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Mobile Money */}
              {MOMO_CURRS.has(form.currency) && (
                <div className="tx-extra-block">
                  <p className="tx-extra-title">📱 Mobile Money</p>
                  <div className="form-row">
                    <div className="field">
                      <label className="label">Nom envoyeur</label>
                      <input name="sender_name" type="text" className="input" placeholder="Jean Dupont"
                        value={form.sender_name} onChange={handleChange} />
                    </div>
                    <div className="field">
                      <label className="label">Tél. envoyeur</label>
                      <input name="sender_phone" type="text" className="input" placeholder="+229 97 000 000"
                        value={form.sender_phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label className="label">Nom receveur</label>
                      <input name="receiver_name" type="text" className="input" placeholder="Marie Koffi"
                        value={form.receiver_name} onChange={handleChange} />
                    </div>
                    <div className="field">
                      <label className="label">Tél. receveur</label>
                      <input name="receiver_phone" type="text" className="input" placeholder="+229 96 000 000"
                        value={form.receiver_phone} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              {/* Crypto */}
              {CRYPTO_CURRS.has(form.currency) && (
                <div className="tx-extra-block">
                  <p className="tx-extra-title">⛓️ Transaction on-chain</p>
                  <div className="form-row">
                    <div className="field">
                      <label className="label">Réseau</label>
                      <select name="network" className="input" value={form.network} onChange={handleChange}>
                        <option value="">— Sélectionner —</option>
                        {Object.entries(NETWORKS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label">Score AML <span style={{ color: 'var(--text-3)', fontWeight: 300 }}>(0–100)</span></label>
                      <input name="aml_score" type="number" min="0" max="100" className="input"
                        placeholder="Ex : 96"
                        value={form.aml_score} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Adresse envoyeur (from)</label>
                    <input name="from_address" type="text" className="input input-mono" placeholder="0x…"
                      value={form.from_address} onChange={handleChange} />
                  </div>
                  <div className="field">
                    <label className="label">Adresse receveur (to)</label>
                    <input name="to_address" type="text" className="input input-mono" placeholder="0x…"
                      value={form.to_address} onChange={handleChange} />
                  </div>
                  <div className="field">
                    <label className="label">Hash de transaction</label>
                    <input name="tx_hash" type="text" className="input input-mono" placeholder="0x…"
                      value={form.tx_hash} onChange={handleChange} />
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-dark btn-full" disabled={saving}>
                {saving && <span className="spin" />}
                {saving ? 'Enregistrement…' : 'Ajouter la transaction'}
              </button>
            </form>
          </div>
        </div>

        {/* ── HISTORIQUE ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Historique</span>
            <span className="badge badge-neutral">{txList.length} entrée{txList.length !== 1 ? 's' : ''}</span>
          </div>

          {loadingT ? (
            <div className="empty">
              <div className="spin" style={{ width: 18, height: 18, opacity: 0.4 }} />
            </div>
          ) : txList.length === 0 ? (
            <div className="empty">
              <p className="empty-title">Aucune transaction</p>
              <p className="empty-sub">Ajoutez votre première recette ou dépense.</p>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Montant (original)</th>
                      <th>Équiv. F CFA</th>
                      <th>Description</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((tx) => {
                      const isMomo   = MOMO_CURRS.has(tx.currency)
                      const isCrypto = CRYPTO_CURRS.has(tx.currency)
                      const net      = NETWORKS[tx.network]
                      const expUrl   = tx.tx_hash && net ? net.explorer + tx.tx_hash : null
                      const xofEquiv = toXOF(parseFloat(tx.amount), tx.currency)

                      return (
                        <tr key={tx.id}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '0.8125rem' }}>
                            {formatDate(tx.date)}
                          </td>
                          <td>
                            <span className={`tx-badge ${tx.type}`}>
                              {tx.type === 'recette'
                                ? <><HiArrowUp size={11} /> Recette</>
                                : <><HiArrowDown size={11} /> Dépense</>}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 400, fontSize: '0.875rem' }}>
                            {fmtNative(tx.amount, tx.currency)}
                            {' '}
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{tx.currency}</span>
                          </td>
                          <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem' }}>
                            <span className={tx.type === 'recette' ? 'text-success' : 'text-danger'}>
                              {tx.type === 'recette' ? '+' : '−'}{fmtXOF(xofEquiv)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {tx.description && (
                                <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>{tx.description}</span>
                              )}
                              {/* Mobile Money */}
                              {isMomo && (tx.sender_name || tx.receiver_name) && (
                                <div className="tx-detail-block">
                                  {tx.sender_name && (
                                    <span className="tx-detail-row">
                                      <span className="tx-detail-label">De</span>
                                      {tx.sender_name}{tx.sender_phone ? ` · ${tx.sender_phone}` : ''}
                                    </span>
                                  )}
                                  {tx.receiver_name && (
                                    <span className="tx-detail-row">
                                      <span className="tx-detail-label">À</span>
                                      {tx.receiver_name}{tx.receiver_phone ? ` · ${tx.receiver_phone}` : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* Crypto — hash cliquable seulement */}
                              {isCrypto && tx.tx_hash && (
                                <div className="tx-detail-block">
                                  <span className="tx-detail-row">
                                    <span className="tx-detail-label">Tx</span>
                                    {expUrl ? (
                                      <a href={expUrl} target="_blank" rel="noopener noreferrer" className="tx-hash-link">
                                        {tx.tx_hash.slice(0, 10)}…{tx.tx_hash.slice(-6)} ↗
                                      </a>
                                    ) : (
                                      <span className="tx-addr">{tx.tx_hash.slice(0, 10)}…</span>
                                    )}
                                  </span>
                                </div>
                              )}
                              {!tx.description && !isMomo && !isCrypto && (
                                <span style={{ color: 'var(--text-3)' }}>—</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button
                                className="row-action-btn"
                                title={tx.type === 'recette' ? 'Convertir en dépense' : 'Convertir en recette'}
                                onClick={() => toggleTxType(tx)}
                                disabled={togglingId === tx.id}
                              >
                                {togglingId === tx.id
                                  ? <span className="spin" style={{ width: 10, height: 10 }} />
                                  : <HiSwitchVertical size={13} />}
                              </button>
                              <button
                                className="row-action-btn"
                                title="Supprimer"
                                style={{ color: 'var(--danger)' }}
                                onClick={() => deleteTx(tx.id)}
                                disabled={deletingTxId === tx.id}
                              >
                                {deletingTxId === tx.id
                                  ? <span className="spin" style={{ width: 10, height: 10 }} />
                                  : <HiTrash size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>→</button>
                  <span className="page-info">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, txList.length)} sur {txList.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── ZONE DANGER ── */}
        {isAdmin && company && (
          <div className="danger-zone">
            <div className="danger-zone-header">
              <p className="danger-zone-title">Zone de danger</p>
              <p className="danger-zone-sub">Action irréversible — réservé aux administrateurs.</p>
            </div>
            {!confirmDelete ? (
              <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
                <HiTrash size={15} /> Supprimer cette entreprise
              </button>
            ) : (
              <div className="danger-confirm">
                <p className="danger-confirm-text">
                  Confirmer la suppression de <strong>{company.name}</strong> et toutes ses transactions ?
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                    {deleting && <span className="spin" />}
                    {deleting ? 'Suppression…' : 'Oui, supprimer définitivement'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </>
  )
}
