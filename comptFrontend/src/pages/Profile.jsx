import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiTrash, HiPaperAirplane } from 'react-icons/hi'
import Navbar from '../components/Navbar'
import { profile as profileApi, companies as companiesApi } from '../api'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { value: 'CEO',       label: 'CEO'         },
  { value: 'associe',   label: 'Associé(e)'  },
  { value: 'comptable', label: 'Comptable'   },
  { value: 'employe',   label: 'Employé(e)'  },
]

const ROLE_COLORS = {
  CEO:       { bg: '#fef3c7', color: '#d97706' },
  associe:   { bg: '#ede9fe', color: '#7c3aed' },
  comptable: { bg: '#e0f2fe', color: '#0369a1' },
  employe:   { bg: 'var(--bg-3)', color: 'var(--text-2)' },
}

function RoleBadge({ role }) {
  const s = ROLE_COLORS[role] || ROLE_COLORS.employe
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 500, padding: '0.2rem 0.55rem',
      borderRadius: 999, background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {ROLES.find(r => r.value === role)?.label || role}
    </span>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { isComptable, isOwner, userRole } = useAuth()
  const isCeo = userRole === 'ceo'

  const [prof,      setProf]      = useState(null)
  const [team,      setTeam]      = useState([])
  const [companies, setCompanies] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [profMsg,   setProfMsg]   = useState({ type: '', text: '' })
  const [invMsg,    setInvMsg]    = useState({ type: '', text: '' })
  const [tab,       setTab]       = useState('profil')

  const [form, setForm] = useState({ first_name: '', last_name: '', job_title: '' })
  const [inv,  setInv]  = useState({ email: '', role: 'comptable', company_id: '' })

  useEffect(() => {
    const calls = isComptable
      ? [profileApi.get(), Promise.resolve([]), Promise.resolve([])]
      : [profileApi.get(), profileApi.getTeam(), companiesApi.getAll()]

    Promise.all(calls)
      .then(([p, t, c]) => {
        setProf(p)
        setForm({ first_name: p.first_name || '', last_name: p.last_name || '', job_title: p.job_title || '' })
        setTeam(t)
        setCompanies(c)
        if (c.length > 0) setInv((i) => ({ ...i, company_id: String(c[0].id) }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true); setProfMsg({ type: '', text: '' })
    try {
      const payload = isCeo ? form : { first_name: form.first_name, last_name: form.last_name }
      await profileApi.update(payload)
      setProfMsg({ type: 'success', text: 'Profil mis à jour.' })
    } catch (err) {
      setProfMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInvMsg({ type: '', text: '' })
    try {
      const res = await profileApi.invite(inv)
      setInvMsg({ type: 'success', text: res.message })
      setInv((i) => ({ ...i, email: '' }))
      const t = await profileApi.getTeam()
      setTeam(t)
    } catch (err) {
      setInvMsg({ type: 'error', text: err.message })
    }
  }

  async function handleRemove(memberId) {
    if (!window.confirm('Retirer ce membre ?')) return
    try {
      await profileApi.removeMember(memberId)
      setTeam((t) => t.filter((m) => m.id !== memberId))
    } catch (err) {
      setInvMsg({ type: 'error', text: err.message })
    }
  }

  if (loading) return (
    <><Navbar /><main className="page">
      <div className="empty" style={{ marginTop: '4rem' }}>
        <div className="spin" style={{ width: 24, height: 24, opacity: 0.3 }} />
      </div>
    </main></>
  )

  const initials = [form.first_name, form.last_name].filter(Boolean).map(s => s[0]).join('').toUpperCase() || prof?.email?.[0]?.toUpperCase() || '?'

  return (
    <>
      <Navbar />
      <main className="page" style={{ maxWidth: 720 }}>

        {/* ── HEADER PROFIL ── */}
        <div className="prof-header">
          <div className="prof-avatar">{initials}</div>
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.125rem' }}>
              {form.first_name || form.last_name
                ? `${form.first_name} ${form.last_name}`.trim()
                : 'Mon profil'}
            </h1>
            <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {prof?.email}
              {form.job_title && <RoleBadge role={form.job_title} />}
            </p>
          </div>
        </div>

        {/* ── ONGLETS ── */}
        <div className="nav-tabs" style={{ marginBottom: '1.5rem' }}>
          <button className={`nav-tab${tab === 'profil' ? ' active' : ''}`} onClick={() => setTab('profil')}>
            Profil
          </button>
          {!isComptable && (
            <button className={`nav-tab${tab === 'equipe' ? ' active' : ''}`} onClick={() => setTab('equipe')}>
              Équipe {team.length > 0 && <span className="badge badge-neutral" style={{ marginLeft: '0.375rem' }}>{team.length}</span>}
            </button>
          )}
        </div>

        {/* ── ONGLET PROFIL ── */}
        {tab === 'profil' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Informations personnelles</span>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {profMsg.text && (
                <div className={`alert alert-${profMsg.type}`} style={{ marginBottom: '1rem' }}>
                  {profMsg.text}
                </div>
              )}
              <form onSubmit={handleSaveProfile}>
                <div className="form-row">
                  <div className="field">
                    <label className="label" htmlFor="first_name">Prénom</label>
                    <input id="first_name" name="first_name" type="text" className="input"
                      placeholder="Jean" value={form.first_name}
                      onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="last_name">Nom</label>
                    <input id="last_name" name="last_name" type="text" className="input"
                      placeholder="Dupont" value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Votre rôle dans l'entreprise</label>
                  {isCeo ? (
                    <select id="job_title" className="input"
                      value={form.job_title}
                      onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  ) : (
                    <div className="input" style={{ opacity: 0.6, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RoleBadge role={userRole} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>Défini à l'inscription</span>
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" value={prof?.email || ''} disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-dark" disabled={saving}>
                    {saving && <span className="spin" />}
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/changer-mot-de-passe')}>
                    Changer le mot de passe
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── ONGLET ÉQUIPE ── */}
        {!isComptable && tab === 'equipe' && (
          <>
            {/* Formulaire d'invitation */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <span className="card-title">Inviter un membre</span>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {invMsg.text && (
                  <div className={`alert alert-${invMsg.type}`} style={{ marginBottom: '1rem' }}>
                    {invMsg.text}
                  </div>
                )}
                {companies.length === 0 ? (
                  <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>
                    Créez d'abord une entreprise pour inviter des membres.
                  </p>
                ) : (
                  <form onSubmit={handleInvite}>
                    <div className="form-row">
                      <div className="field">
                        <label className="label">Email *</label>
                        <input type="email" className="input" placeholder="comptable@exemple.com"
                          value={inv.email} required
                          onChange={(e) => setInv((i) => ({ ...i, email: e.target.value }))} />
                      </div>
                      <div className="field">
                        <label className="label">Rôle *</label>
                        <select className="input" value={inv.role}
                          onChange={(e) => setInv((i) => ({ ...i, role: e.target.value }))}>
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label className="label">Entreprise *</label>
                      <select className="input" value={inv.company_id}
                        onChange={(e) => setInv((i) => ({ ...i, company_id: e.target.value }))}>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-dark">
                      <HiPaperAirplane size={14} /> Envoyer l'invitation
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Liste des membres */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Membres actuels</span>
                <span className="badge badge-neutral">{team.length}</span>
              </div>
              {team.length === 0 ? (
                <div className="empty">
                  <p className="empty-title">Aucun membre</p>
                  <p className="empty-sub">Invitez votre comptable ou vos associés.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Membre</th>
                        <th>Rôle</th>
                        <th>Entreprise</th>
                        <th>Ajouté le</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                              <span style={{ fontWeight: 300 }}>
                                {m.first_name || m.last_name
                                  ? `${m.first_name || ''} ${m.last_name || ''}`.trim()
                                  : m.email}
                              </span>
                              {(m.first_name || m.last_name) && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{m.email}</span>
                              )}
                            </div>
                          </td>
                          <td><RoleBadge role={m.role} /></td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{m.company_name}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                            {new Date(m.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem' }}
                              onClick={() => handleRemove(m.id)}
                              title="Retirer ce membre"
                            >
                              <HiTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  )
}
