import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { companies } from '../api'

const TYPES          = ['SA', 'SARL', 'SAS', 'SNC', 'GIE', 'EI', 'Autre']
const LEGAL_STATUSES = ['Privée', 'Publique', 'Semi-publique', 'ONG', 'Association', 'Autre']
const SECTORS        = [
  'Agriculture', 'Alimentation', 'Bâtiment & Construction', 'Commerce',
  'Education', 'Energie', 'Finance & Banque', 'Industrie', 'Informatique & Tech',
  'Santé', 'Services', 'Télécommunications', 'Transport & Logistique', 'Autre',
]

const INITIAL = {
  name: '', type: '', legal_status: '', sector: '',
  ifu: '', rccm: '', registration_date: '', city: '',
}

export default function CreateCompany() {
  const navigate = useNavigate()
  const [form, setForm]       = useState(INITIAL)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '')
    )
    try {
      await companies.create(payload)
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Nouvelle entreprise</h1>
            <p className="page-sub">Enregistrez une structure dans votre portefeuille</p>
          </div>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">← Retour</Link>
        </div>

        <div className="form-page">
          <div className="form-card">
            {error   && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">Entreprise créée — redirection…</div>}

            <form onSubmit={handleSubmit}>
              <p className="section-label">Informations générales</p>

              <div className="field">
                <label className="label" htmlFor="name">
                  Nom de l'entreprise <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="name" name="name" type="text" className="input"
                  placeholder="Ex : Société Nationale des Transports"
                  value={form.name} onChange={handleChange}
                  required autoFocus
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label className="label" htmlFor="type">Type</label>
                  <select id="type" name="type" className="input" value={form.type} onChange={handleChange}>
                    <option value="">— Sélectionner —</option>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="legal_status">Statut juridique</label>
                  <select id="legal_status" name="legal_status" className="input" value={form.legal_status} onChange={handleChange}>
                    <option value="">— Sélectionner —</option>
                    {LEGAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label className="label" htmlFor="sector">Secteur d'activité</label>
                  <select id="sector" name="sector" className="input" value={form.sector} onChange={handleChange}>
                    <option value="">— Sélectionner —</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="city">Ville</label>
                  <input
                    id="city" name="city" type="text" className="input"
                    placeholder="Ex : Cotonou"
                    value={form.city} onChange={handleChange}
                  />
                </div>
              </div>

              <p className="section-label">Identifiants légaux</p>

              <div className="form-row">
                <div className="field">
                  <label className="label" htmlFor="ifu">IFU</label>
                  <input
                    id="ifu" name="ifu" type="text" className="input"
                    placeholder="Identifiant Fiscal Unique"
                    value={form.ifu} onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rccm">RCCM</label>
                  <input
                    id="rccm" name="rccm" type="text" className="input"
                    placeholder="Registre du Commerce"
                    value={form.rccm} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="field" style={{ maxWidth: 280 }}>
                <label className="label" htmlFor="registration_date">Date d'immatriculation</label>
                <input
                  id="registration_date" name="registration_date" type="date" className="input"
                  value={form.registration_date} onChange={handleChange}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={loading}
                >
                  {loading && <span className="spin" />}
                  {loading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <Link to="/dashboard" className="btn btn-ghost">Annuler</Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
