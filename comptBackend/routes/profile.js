const express = require('express')
const crypto  = require('crypto')
const router  = express.Router()
const db      = require('../lib/db')
const auth    = require('../middleware/auth')
const { sendInvitationEmail } = require('../lib/mailer')

router.use(auth)

// ── GET profil ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, email, first_name, last_name, job_title, is_admin, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── UPDATE profil ────────────────────────────────────────────────────────────
router.put('/', async (req, res) => {
  const { first_name, last_name, job_title } = req.body
  try {
    const { rows } = await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, job_title = $3
       WHERE id = $4
       RETURNING id, email, first_name, last_name, job_title`,
      [first_name || null, last_name || null, job_title || null, req.user.id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET membres de toutes mes entreprises ────────────────────────────────────
router.get('/team', async (req, res) => {
  try {
    // Récupérer toutes les entreprises dont je suis propriétaire
    const companies = await db.query(
      `SELECT id, name FROM companies WHERE owner_id = $1`,
      [req.user.id]
    )
    const companyIds = companies.rows.map(c => c.id)
    if (companyIds.length === 0) return res.json([])

    const { rows } = await db.query(
      `SELECT
         cm.id, cm.role, cm.created_at,
         cm.company_id,
         co.name AS company_name,
         u.id   AS user_id,
         u.email,
         u.first_name,
         u.last_name,
         u.job_title,
         u.status AS user_status
       FROM company_members cm
       JOIN users     u  ON u.id  = cm.user_id
       JOIN companies co ON co.id = cm.company_id
       WHERE cm.company_id = ANY($1)
         AND cm.user_id != $2
       ORDER BY cm.company_id, cm.created_at`,
      [companyIds, req.user.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── INVITER quelqu'un ────────────────────────────────────────────────────────
router.post('/invite', async (req, res) => {
  const { email, role, company_id } = req.body

  if (!email || !role || !company_id)
    return res.status(400).json({ error: 'email, role et company_id sont requis' })

  const ROLES = ['CEO', 'associe', 'comptable', 'employe']
  if (!ROLES.includes(role))
    return res.status(400).json({ error: 'Rôle invalide' })

  try {
    // Vérifier que l'entreprise appartient bien à l'utilisateur
    const comp = await db.query(
      `SELECT id, name FROM companies WHERE id = $1 AND owner_id = $2`,
      [company_id, req.user.id]
    )
    if (comp.rows.length === 0)
      return res.status(403).json({ error: 'Entreprise introuvable ou accès refusé' })

    const company = comp.rows[0]

    // Vérifier que l'utilisateur invité existe et est actif
    const invitee = await db.query(
      `SELECT id, email, first_name, last_name, status FROM users WHERE email = $1`,
      [email]
    )

    const token   = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000)

    // Inviter directement si le user existe et est actif
    if (invitee.rows.length > 0 && invitee.rows[0].status === 'active') {
      const inviteeUser = invitee.rows[0]

      // Vérifier s'il est déjà membre
      const existing = await db.query(
        `SELECT id FROM company_members WHERE company_id = $1 AND user_id = $2`,
        [company_id, inviteeUser.id]
      )
      if (existing.rows.length > 0)
        return res.status(400).json({ error: 'Cet utilisateur est déjà membre de cette entreprise' })

      // Ajouter directement
      await db.query(
        `INSERT INTO company_members (company_id, user_id, invited_by, role)
         VALUES ($1, $2, $3, $4)`,
        [company_id, inviteeUser.id, req.user.id, role]
      )

      // Notifier par email
      await sendInvitationEmail({
        to: email, role, companyName: company.name,
        inviterEmail: req.user.email,
        token: null, // déjà membre
        frontendUrl: process.env.FRONTEND_URL,
      }).catch(() => {})

      return res.json({ message: `${email} ajouté à ${company.name} en tant que ${role}` })
    }

    // Sinon créer une invitation par token
    await db.query(
      `INSERT INTO invitations (invited_by, email, role, token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (token) DO NOTHING`,
      [req.user.id, email, role, token, expires]
    )

    await sendInvitationEmail({
      to: email, role, companyName: company.name,
      inviterEmail: req.user.email,
      token, frontendUrl: process.env.FRONTEND_URL,
    })

    res.json({ message: `Invitation envoyée à ${email}` })
  } catch (err) {
    console.error('INVITE ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── ACCEPTER une invitation (via token dans le lien) ─────────────────────────
router.get('/accept-invite/:token', async (req, res) => {
  const { token } = req.params
  try {
    const { rows } = await db.query(
      `SELECT i.*, c.id AS company_id, c.name AS company_name
       FROM invitations i
       JOIN companies c ON c.owner_id = i.invited_by
       WHERE i.token = $1 AND i.status = 'pending'`,
      [token]
    )
    if (rows.length === 0)
      return res.status(400).json({ error: 'Invitation invalide ou déjà utilisée' })

    const inv = rows[0]
    if (new Date() > new Date(inv.expires_at))
      return res.status(400).json({ error: 'Invitation expirée' })

    res.json({
      email: inv.email,
      role: inv.role,
      company_name: inv.company_name,
      token: inv.token,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── SUPPRIMER un membre ──────────────────────────────────────────────────────
router.delete('/team/:memberId', async (req, res) => {
  try {
    // Vérifier que l'entreprise du membre appartient à l'utilisateur
    const { rows } = await db.query(
      `DELETE FROM company_members cm
       USING companies co
       WHERE cm.id = $1
         AND cm.company_id = co.id
         AND co.owner_id = $2
       RETURNING cm.id`,
      [req.params.memberId, req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ error: 'Membre introuvable ou accès refusé' })

    res.json({ message: 'Membre retiré' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
