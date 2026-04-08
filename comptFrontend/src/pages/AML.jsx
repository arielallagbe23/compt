import { useEffect, useState } from 'react'
import { HiArrowUp, HiArrowDown, HiShieldCheck } from 'react-icons/hi'
import Navbar from '../components/Navbar'
import { companies as companiesApi, transactions as txApi } from '../api'

const CRYPTO_CURRS = new Set(['USDT', 'ETH', 'BTC'])
const MOMO_CURRS   = new Set(['XOF', 'XAF'])
const PAGE_SIZE    = 10

const NETWORKS = {
  ETH:  { label: 'Ethereum',    explorer: 'https://etherscan.io/tx/' },
  USDT: { label: 'Tron TRC-20', explorer: 'https://tronscan.org/#/transaction/' },
  BTC:  { label: 'Bitcoin',     explorer: 'https://blockstream.info/tx/' },
}

function amlColor(score) {
  if (score === null || score === undefined) return 'var(--text-3)'
  if (score >= 80) return 'var(--success)'
  if (score >= 50) return '#f59e0b'
  return 'var(--danger)'
}
function amlLabel(score) {
  if (score === null || score === undefined) return 'Non vérifié'
  if (score >= 80) return 'Faible risque'
  if (score >= 50) return 'Risque modéré'
  return 'Risque élevé'
}
function riskBadgeClass(score) {
  if (score === null || score === undefined) return 'badge-neutral'
  if (score >= 80) return 'badge-success'
  if (score >= 50) return 'badge-warn'
  return 'badge-danger'
}

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtAmt   = (n, cur) => {
  if (['XOF', 'XAF'].includes(cur)) return Math.round(Number(n)).toLocaleString('fr-FR') + ' ' + cur
  if (['ETH', 'BTC'].includes(cur)) return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 6 }) + ' ' + cur
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur
}
const truncAddr = (addr) => addr ? addr.slice(0, 8) + '…' + addr.slice(-6) : '—'

function Pagination({ page, total, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1}>←</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}>→</button>
      <span className="page-info">
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total}
      </span>
    </div>
  )
}

export default function AML() {
  const [companies,   setCompanies]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [search,      setSearch]      = useState('')
  const [selectedId,  setSelectedId]  = useState('')
  const [txs,         setTxs]         = useState([])
  const [txLoading,   setTxLoading]   = useState(false)
  const [cryptoPage,  setCryptoPage]  = useState(1)
  const [momoPage,    setMomoPage]    = useState(1)

  useEffect(() => {
    companiesApi.getAll()
      .then(setCompanies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function selectCompany(id) {
    setSelectedId(String(id))
    setCryptoPage(1)
    setMomoPage(1)
    setTxLoading(true)
    txApi.getAll(id)
      .then(setTxs)
      .catch(() => setTxs([]))
      .finally(() => setTxLoading(false))
  }

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selected = companies.find((c) => String(c.id) === selectedId) || null

  const crypto = txs.filter((t) => CRYPTO_CURRS.has(t.currency))
  const momo   = txs.filter((t) => MOMO_CURRS.has(t.currency) && (t.sender_name || t.receiver_name))

  const scored   = txs.filter((t) => t.aml_score !== null && t.aml_score !== undefined)
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, t) => s + t.aml_score, 0) / scored.length)
    : null
  const highRisk = scored.filter((t) => t.aml_score < 50).length
  const medRisk  = scored.filter((t) => t.aml_score >= 50 && t.aml_score < 80).length
  const lowRisk  = scored.filter((t) => t.aml_score >= 80).length

  const cryptoPaged = crypto.slice((cryptoPage - 1) * PAGE_SIZE, cryptoPage * PAGE_SIZE)
  const momoPaged   = momo.slice((momoPage - 1) * PAGE_SIZE, momoPage * PAGE_SIZE)

  if (loading) return (
    <><Navbar /><main className="page">
      <div className="empty" style={{ marginTop: '4rem' }}>
        <div className="spin" style={{ width: 24, height: 24, opacity: 0.3 }} />
      </div>
    </main></>
  )

  if (error) return (
    <><Navbar /><main className="page">
      <div className="alert alert-error" style={{ maxWidth: 500 }}>{error}</div>
    </main></>
  )

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Vérification AML</h1>
            <p className="page-sub">Audit de conformité — Anti-Money Laundering</p>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
            CONFIDENTIEL
          </span>
        </div>

        {/* ── LISTE ENTREPRISES ── */}
        {!selected && (
          <>
            <div style={{ marginBottom: '1rem', maxWidth: 400 }}>
              <input
                type="text"
                className="input"
                placeholder="Rechercher une entreprise…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🛡️</div>
                <p className="empty-title">Aucune entreprise trouvée</p>
                <p className="empty-sub">Modifiez votre recherche ou ajoutez des entreprises.</p>
              </div>
            ) : (
              <div className="acct-company-list">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    className="acct-company-pick"
                    onClick={() => selectCompany(c.id)}
                  >
                    <div className="acct-pick-name">{c.name}</div>
                    <div className="acct-pick-meta">
                      {[c.type, c.legal_status, c.sector].filter(Boolean).join(' · ') || 'Aucun détail'}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      Voir le rapport AML →
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── VUE ENTREPRISE ── */}
        {selected && (
          <>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: '1.5rem' }}
              onClick={() => { setSelectedId(''); setTxs([]) }}
            >
              ← Changer d'entreprise
            </button>

            <div className="aml-company-header" style={{ marginBottom: '1.5rem' }}>
              <p className="aml-company-name">{selected.name}</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                {[selected.type, selected.legal_status, selected.sector].filter(Boolean).join(' · ')}
              </span>
            </div>

            {txLoading ? (
              <div className="empty" style={{ marginTop: '2rem' }}>
                <div className="spin" style={{ width: 24, height: 24, opacity: 0.3 }} />
              </div>
            ) : (
              <>
                {/* Résumé risque */}
                {scored.length > 0 && (
                  <div className="aml-summary-block" style={{ marginBottom: '1.5rem' }}>
                    <div className="aml-summary-left">
                      <HiShieldCheck size={20} style={{ color: amlColor(avgScore) }} />
                      <div>
                        <p className="aml-summary-title">
                          {scored.length} transaction{scored.length > 1 ? 's' : ''} vérifiée{scored.length > 1 ? 's' : ''}
                        </p>
                        <p className="aml-summary-sub">
                          Score moyen : <strong style={{ color: amlColor(avgScore) }}>{avgScore}/100</strong>
                          {' · '}{amlLabel(avgScore)}
                        </p>
                      </div>
                    </div>
                    <div className="aml-risk-chips">
                      <span className="aml-risk-chip low">{lowRisk} faible risque</span>
                      <span className="aml-risk-chip med">{medRisk} modéré</span>
                      <span className="aml-risk-chip high">{highRisk} élevé</span>
                    </div>
                  </div>
                )}

                {crypto.length === 0 && momo.length === 0 && (
                  <div className="empty">
                    <div className="empty-icon">🛡️</div>
                    <p className="empty-title">Aucune transaction à analyser</p>
                    <p className="empty-sub">Les transactions crypto et Mobile Money apparaîtront ici.</p>
                  </div>
                )}

                {/* Crypto */}
                {crypto.length > 0 && (
                  <div className="aml-company-block" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                      <p className="section-label" style={{ marginBottom: '1rem' }}>Transactions on-chain ⛓️</p>
                    </div>
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <div className="aml-table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Montant</th>
                              <th>From</th>
                              <th>To</th>
                              <th>Tx Hash</th>
                              <th>Score AML</th>
                              <th>Risque</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cryptoPaged.map((tx) => {
                              const net    = NETWORKS[tx.network]
                              const expUrl = tx.tx_hash && net ? net.explorer + tx.tx_hash : null
                              return (
                                <tr key={tx.id}>
                                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '0.8125rem' }}>
                                    {fmtDate(tx.date)}
                                  </td>
                                  <td>
                                    <span className={`tx-badge ${tx.type}`} style={{ fontSize: '0.75rem' }}>
                                      {tx.type === 'recette'
                                        ? <><HiArrowUp size={10} /> Entrée</>
                                        : <><HiArrowDown size={10} /> Sortie</>}
                                    </span>
                                  </td>
                                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 400 }}>
                                    {fmtAmt(tx.amount, tx.currency)}
                                  </td>
                                  <td><span className="tx-addr">{truncAddr(tx.from_address)}</span></td>
                                  <td><span className="tx-addr">{truncAddr(tx.to_address)}</span></td>
                                  <td>
                                    {expUrl ? (
                                      <a href={expUrl} target="_blank" rel="noopener noreferrer" className="tx-hash-link">
                                        {tx.tx_hash.slice(0, 10)}… ↗
                                      </a>
                                    ) : (
                                      <span className="tx-addr">{tx.tx_hash ? tx.tx_hash.slice(0, 10) + '…' : '—'}</span>
                                    )}
                                  </td>
                                  <td>
                                    {tx.aml_score != null ? (
                                      <div className="aml-cell">
                                        <div className="aml-bar-track">
                                          <div className="aml-bar-fill" style={{ width: `${tx.aml_score}%`, background: amlColor(tx.aml_score) }} />
                                        </div>
                                        <span className="aml-score-text" style={{ color: amlColor(tx.aml_score) }}>
                                          {tx.aml_score}/100
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>—</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`aml-risk-label ${riskBadgeClass(tx.aml_score)}`}>
                                      {amlLabel(tx.aml_score)}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <Pagination page={cryptoPage} total={crypto.length} onChange={setCryptoPage} />
                    </div>
                  </div>
                )}

                {/* Mobile Money */}
                {momo.length > 0 && (
                  <div className="aml-company-block">
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                      <p className="section-label" style={{ marginBottom: 0 }}>Transactions Mobile Money 📱</p>
                    </div>
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <div className="aml-table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Montant</th>
                              <th>Envoyeur</th>
                              <th>Receveur</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {momoPaged.map((tx) => (
                              <tr key={tx.id}>
                                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '0.8125rem' }}>
                                  {fmtDate(tx.date)}
                                </td>
                                <td>
                                  <span className={`tx-badge ${tx.type}`} style={{ fontSize: '0.75rem' }}>
                                    {tx.type === 'recette'
                                      ? <><HiArrowUp size={10} /> Entrée</>
                                      : <><HiArrowDown size={10} /> Sortie</>}
                                  </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 400 }}>
                                  {fmtAmt(tx.amount, tx.currency)}
                                </td>
                                <td style={{ fontSize: '0.8125rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                                    <span>{tx.sender_name || '—'}</span>
                                    {tx.sender_phone && <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>{tx.sender_phone}</span>}
                                  </div>
                                </td>
                                <td style={{ fontSize: '0.8125rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                                    <span>{tx.receiver_name || '—'}</span>
                                    {tx.receiver_phone && <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>{tx.receiver_phone}</span>}
                                  </div>
                                </td>
                                <td style={{ color: 'var(--text-2)', fontSize: '0.8125rem' }}>
                                  {tx.description || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination page={momoPage} total={momo.length} onChange={setMomoPage} />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
