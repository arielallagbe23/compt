import { useEffect, useState } from 'react'
import { HiArrowUp, HiArrowDown, HiScale } from 'react-icons/hi'
import { HiOutlineReceiptTax } from 'react-icons/hi'
import Navbar from '../components/Navbar'
import { accounting as accountingApi } from '../api'

const TO_XOF = {
  XOF: 1, XAF: 1, EUR: 655.957, USD: 610, USDT: 610, ETH: 2_350_000, BTC: 38_500_000,
}
const toXOF = (amount, currency) => amount * (TO_XOF[currency] || 0)
const TAX   = { IS: 0.30, IS_MINIMUM: 0.01, TVA: 0.18 }

function computeFiscal(byCurrency = {}) {
  let ca = 0, charges = 0
  for (const [cur, { recette, depense }] of Object.entries(byCurrency)) {
    ca      += toXOF(recette, cur)
    charges += toXOF(depense, cur)
  }
  const benefice  = ca - charges
  const isBase    = benefice > 0 ? benefice : 0
  const isMin     = ca * TAX.IS_MINIMUM
  const is        = Math.max(isBase * TAX.IS, isMin)
  return {
    ca, charges, benefice,
    is:                  Math.round(is),
    is_minimum:          Math.round(isMin),
    tva_collectee:       Math.round(ca * TAX.TVA),
    acompte_trimestriel: Math.round(is / 4),
  }
}

const fmt    = (n) => Math.round(Number(n)).toLocaleString('fr-FR')
const fmtXOF = (n) => fmt(n) + ' F CFA'

function KpiCard({ label, value, color, icon, sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ color }}>{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="kpi-value" style={{ color }}>
        {fmt(value)} <span className="kpi-currency">F CFA</span>
      </p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}

function TaxRow({ label, value, note, highlight }) {
  return (
    <div className={`tax-row${highlight ? ' tax-row-highlight' : ''}`}>
      <span className="tax-row-label">{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span className="tax-row-value">{fmtXOF(value)}</span>
        {note && <p className="tax-row-note">{note}</p>}
      </div>
    </div>
  )
}

export default function Accounting() {
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    accountingApi.summary()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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

  const { companies = [] } = data || {}
  const enriched = companies.map((c) => ({ ...c, fiscal: computeFiscal(c.byCurrency || {}) }))

  const filtered = enriched.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  const selected = enriched.find((c) => String(c.id) === selectedId) || null

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Comptabilité</h1>
            <p className="page-sub">Synthèse en F CFA — toutes devises converties</p>
          </div>
        </div>

        {/* ── LISTE DES ENTREPRISES ── */}
        {!selected && (
          <>
            {enriched.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📊</div>
                <p className="empty-title">Aucune donnée disponible</p>
                <p className="empty-sub">Enregistrez des transactions pour voir votre bilan.</p>
              </div>
            ) : (
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
                    <p className="empty-title">Aucune entreprise trouvée</p>
                    <p className="empty-sub">Modifiez votre recherche.</p>
                  </div>
                ) : (
                  <div className="acct-company-list">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        className="acct-company-pick"
                        onClick={() => setSelectedId(String(c.id))}
                      >
                        <div className="acct-pick-name">{c.name}</div>
                        <div className="acct-pick-meta">
                          {[c.type, c.legal_status, c.sector].filter(Boolean).join(' · ') || 'Aucun détail'}
                        </div>
                        <div className={`acct-pick-balance ${c.fiscal.benefice >= 0 ? 'pos' : 'neg'}`}>
                          {c.fiscal.benefice >= 0 ? '+' : ''}{fmtXOF(c.fiscal.benefice)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── DONNÉES DE L'ENTREPRISE SÉLECTIONNÉE ── */}
        {selected && (
          <>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: '1.5rem' }}
              onClick={() => setSelectedId('')}
            >
              ← Changer d'entreprise
            </button>

            {/* KPI */}
            <section style={{ marginBottom: '2.5rem' }}>
              <p className="section-chip">{selected.name}</p>
              <div className="kpi-grid">
                <KpiCard label="Recettes totales"  value={selected.fiscal.ca}       color="var(--success)"    icon={<HiArrowUp size={18} />} />
                <KpiCard label="Dépenses totales"  value={selected.fiscal.charges}  color="var(--danger)"     icon={<HiArrowDown size={18} />} />
                <KpiCard label="Bénéfice net"       value={selected.fiscal.benefice} color={selected.fiscal.benefice >= 0 ? 'var(--success)' : 'var(--danger)'} icon={<HiScale size={18} />} />
                <KpiCard label="Provision IS (30%)" value={selected.fiscal.is}       color="var(--text-2)"     icon={<HiOutlineReceiptTax size={18} />} />
              </div>
            </section>

            <div className="acct-body">
              {/* Résumé financier simplifié */}
              <div className="card acct-financial">
                <div className="card-header">
                  <span className="card-title">Résumé financier</span>
                  <span className="badge badge-neutral">F CFA</span>
                </div>
                <div style={{ padding: '0' }}>
                  <div className="acct-simple-row recette">
                    <div className="acct-simple-left">
                      <HiArrowUp size={14} />
                      <span>Recettes</span>
                    </div>
                    <span className="acct-simple-amount">{fmtXOF(selected.fiscal.ca)}</span>
                  </div>
                  <div className="acct-simple-row depense">
                    <div className="acct-simple-left">
                      <HiArrowDown size={14} />
                      <span>Dépenses</span>
                    </div>
                    <span className="acct-simple-amount">− {fmtXOF(selected.fiscal.charges)}</span>
                  </div>
                  <div className="acct-simple-row total">
                    <div className="acct-simple-left">
                      <HiScale size={14} />
                      <span>Bénéfice net</span>
                    </div>
                    <span className={`acct-simple-amount ${selected.fiscal.benefice >= 0 ? 'pos' : 'neg'}`}>
                      {selected.fiscal.benefice >= 0 ? '+' : ''}{fmtXOF(selected.fiscal.benefice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prévisions fiscales */}
              <div className="card acct-taxes">
                <div className="card-header">
                  <span className="card-title">Prévisions fiscales</span>
                  <span className="badge badge-neutral">Bénin</span>
                </div>
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <TaxRow label="IS — Impôt sur les Sociétés (30%)"   value={selected.fiscal.is}                  note={`Base : ${fmtXOF(Math.max(selected.fiscal.benefice, 0))} de bénéfice`} />
                  <TaxRow label="IS minimum (1% du CA)"               value={selected.fiscal.is_minimum}          note="Plancher même en déficit" />
                  <TaxRow label="TVA collectée estimée (18%)"         value={selected.fiscal.tva_collectee}       note="Sur le CA brut" />
                  <TaxRow label="Acompte IS trimestriel"              value={selected.fiscal.acompte_trimestriel} note="À verser chaque trimestre" highlight />
                </div>
                <div className="tax-disclaimer">
                  Projections indicatives. Consultez un expert-comptable pour votre déclaration officielle.
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}
