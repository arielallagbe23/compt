const express  = require('express')
const crypto   = require('crypto')
const router   = express.Router()
const db       = require('../lib/db')
const superAdminMiddleware = require('../middleware/superAdmin')
const { sendVerificationEmail, sendRejectionEmail } = require('../lib/mailer')

// Toutes les routes sont protégées par le middleware super admin
router.use(superAdminMiddleware)

// ── LISTE DES DEMANDES D'INSCRIPTION ────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, email, status, is_admin, created_at, approved_at, rejected_at, rejection_reason, verified_at
       FROM users
       WHERE is_super_admin = false
       ORDER BY
         CASE status
           WHEN 'pending'  THEN 1
           WHEN 'approved' THEN 2
           WHEN 'active'   THEN 3
           WHEN 'rejected' THEN 4
         END,
         created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    console.error('SUPERADMIN LIST ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── APPROUVER → envoie le mail de vérification ───────────────────────────────
router.post('/users/:id/approve', async (req, res) => {
  const { id } = req.params

  try {
    const { rows } = await db.query(
      `SELECT id, email, status FROM users WHERE id = $1 AND is_super_admin = false`,
      [id]
    )
    if (rows.length === 0)
      return res.status(404).json({ error: 'Utilisateur introuvable' })

    const user = rows[0]

    if (user.status === 'active')
      return res.status(400).json({ error: 'Ce compte est déjà actif' })

    if (user.status === 'approved')
      return res.status(400).json({ error: 'Un email de vérification a déjà été envoyé' })

    // Générer token SHA-256 (64 hex chars) — 48h de validité
    const token    = crypto.randomBytes(32).toString('hex') // 256 bits → SHA-2 class
    const expires  = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await db.query(
      `UPDATE users
       SET status = 'approved',
           verification_token = $1,
           token_expires_at   = $2,
           approved_at        = NOW(),
           approved_by        = $3,
           rejected_at        = NULL,
           rejection_reason   = NULL
       WHERE id = $4`,
      [token, expires, req.user.id, id]
    )

    await sendVerificationEmail({
      to:          user.email,
      token,
      frontendUrl: process.env.FRONTEND_URL,
    })

    res.json({ message: `Email de vérification envoyé à ${user.email}` })

  } catch (err) {
    console.error('APPROVE ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── REJETER ──────────────────────────────────────────────────────────────────
router.post('/users/:id/reject', async (req, res) => {
  const { id }     = req.params
  const { reason } = req.body

  try {
    const { rows } = await db.query(
      `SELECT id, email, status FROM users WHERE id = $1 AND is_super_admin = false`,
      [id]
    )
    if (rows.length === 0)
      return res.status(404).json({ error: 'Utilisateur introuvable' })

    const user = rows[0]

    if (user.status === 'active')
      return res.status(400).json({ error: 'Ce compte est déjà actif' })

    await db.query(
      `UPDATE users
       SET status = 'rejected',
           rejected_at      = NOW(),
           rejection_reason = $1,
           verification_token = NULL,
           token_expires_at   = NULL
       WHERE id = $2`,
      [reason || null, id]
    )

    // Notifier par email
    try {
      await sendRejectionEmail({ to: user.email, reason })
    } catch (mailErr) {
      console.error('REJECTION MAIL ERROR (non bloquant):', mailErr.message)
    }

    res.json({ message: `Demande de ${user.email} rejetée` })

  } catch (err) {
    console.error('REJECT ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── RÉVOQUER un compte actif ─────────────────────────────────────────────────
router.post('/users/:id/revoke', async (req, res) => {
  const { id } = req.params

  try {
    const { rows } = await db.query(
      `UPDATE users SET status = 'rejected', rejected_at = NOW()
       WHERE id = $1 AND is_super_admin = false
       RETURNING id, email`,
      [id]
    )
    if (rows.length === 0)
      return res.status(404).json({ error: 'Utilisateur introuvable' })

    res.json({ message: `Accès révoqué pour ${rows[0].email}` })
  } catch (err) {
    console.error('REVOKE ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── RENVOYER l'email de vérification ────────────────────────────────────────
router.post('/users/:id/resend', async (req, res) => {
  const { id } = req.params

  try {
    const { rows } = await db.query(
      `SELECT id, email, status FROM users WHERE id = $1 AND is_super_admin = false`,
      [id]
    )
    if (rows.length === 0)
      return res.status(404).json({ error: 'Utilisateur introuvable' })

    const user = rows[0]

    if (user.status === 'active')
      return res.status(400).json({ error: 'Ce compte est déjà actif' })

    if (user.status === 'rejected')
      return res.status(400).json({ error: 'Ce compte a été rejeté. Approuvez-le d\'abord.' })

    const token   = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await db.query(
      `UPDATE users SET verification_token = $1, token_expires_at = $2, status = 'approved' WHERE id = $3`,
      [token, expires, id]
    )

    await sendVerificationEmail({
      to:          user.email,
      token,
      frontendUrl: process.env.FRONTEND_URL,
    })

    res.json({ message: `Email renvoyé à ${user.email}` })

  } catch (err) {
    console.error('RESEND ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── TOGGLE is_admin ──────────────────────────────────────────────────────────
router.post('/users/:id/toggle-admin', async (req, res) => {
  const { id } = req.params

  try {
    const { rows } = await db.query(
      `UPDATE users SET is_admin = NOT is_admin
       WHERE id = $1 AND is_super_admin = false
       RETURNING id, email, is_admin`,
      [id]
    )
    if (rows.length === 0)
      return res.status(404).json({ error: 'Utilisateur introuvable' })

    res.json({
      message: `${rows[0].email} est maintenant ${rows[0].is_admin ? 'admin' : 'utilisateur standard'}`,
      is_admin: rows[0].is_admin,
    })
  } catch (err) {
    console.error('TOGGLE ADMIN ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
