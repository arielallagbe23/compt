const express = require('express')
const bcrypt  = require('bcrypt')
const jwt     = require('jsonwebtoken')
const router  = express.Router()
const db      = require('../lib/db')
const auth    = require('../middleware/auth')

// ── INSCRIPTION ──────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, user_role, first_name, last_name } = req.body

  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis' })

  if (password.length < 8)
    return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum)' })

  const VALID_ROLES = ['ceo', 'associe', 'comptable', 'employe']
  const role = VALID_ROLES.includes(user_role) ? user_role : 'ceo'

  try {
    const saltRounds     = parseInt(process.env.SALT_ROUNDS) || 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    await db.query(
      `INSERT INTO users (email, password, status, user_role, first_name, last_name)
       VALUES ($1, $2, 'pending', $3, $4, $5)`,
      [email, hashedPassword, role, first_name || null, last_name || null]
    )

    res.json({ message: 'Demande enregistrée. Un administrateur va examiner votre demande.' })

  } catch (err) {
    if (err.code === '23505')
      return res.json({ message: 'Demande enregistrée. Un administrateur va examiner votre demande.' })
    console.error('REGISTER ERROR:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── CONNEXION ────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis' })

  try {
    const { rows } = await db.query(`SELECT * FROM users WHERE email = $1`, [email])
    const user = rows[0]

    const dummyHash = '$2b$12$invalidhashtopreventtimingattack000000000000000000000'
    const isMatch   = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash)

    if (!user || !isMatch)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    if (user.status === 'pending')
      return res.status(403).json({ error: 'Votre compte est en attente de validation par un administrateur.' })
    if (user.status === 'approved')
      return res.status(403).json({ error: 'Votre compte a été approuvé. Vérifiez votre email pour activer votre compte.' })
    if (user.status === 'rejected')
      return res.status(403).json({ error: "Votre demande d'accès n'a pas été approuvée." })
    if (user.status !== 'active')
      return res.status(403).json({ error: 'Compte inactif.' })

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin || false },
      process.env.JWT_SECRET,
      { expiresIn: '48h' }
    )

    res.json({
      token,
      user: {
        id:             user.id,
        email:          user.email,
        first_name:     user.first_name     || null,
        last_name:      user.last_name      || null,
        user_role:      user.user_role      || 'ceo',
        is_admin:       user.is_admin       || false,
        is_super_admin: user.is_super_admin || false,
      },
    })

  } catch (err) {
    console.error('LOGIN ERROR:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── VÉRIFICATION EMAIL ────────────────────────────────────────────────────────
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params
  if (!token || token.length !== 64)
    return res.status(400).json({ error: 'Lien invalide' })

  try {
    const { rows } = await db.query(
      `SELECT id, status, token_expires_at FROM users WHERE verification_token = $1`,
      [token]
    )
    if (rows.length === 0)
      return res.status(400).json({ error: 'Lien de vérification invalide ou déjà utilisé' })

    const user = rows[0]
    if (new Date() > new Date(user.token_expires_at))
      return res.status(400).json({ error: "Lien expiré (validité 48h). Contactez l'administrateur." })
    if (user.status === 'active')
      return res.json({ message: 'Compte déjà activé. Vous pouvez vous connecter.' })

    await db.query(
      `UPDATE users SET status = 'active', verified_at = NOW(),
       verification_token = NULL, token_expires_at = NULL WHERE id = $1`,
      [user.id]
    )
    res.json({ message: 'Compte activé avec succès. Vous pouvez maintenant vous connecter.' })
  } catch (err) {
    console.error('VERIFY ERROR:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── CHANGEMENT DE MOT DE PASSE ───────────────────────────────────────────────
router.post('/change-password', auth, async (req, res) => {
  const { current_password, new_password } = req.body
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Les deux champs sont requis' })
  if (new_password.length < 8)
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  if (current_password === new_password)
    return res.status(400).json({ error: "Le nouveau mot de passe doit être différent de l'ancien" })

  try {
    const { rows } = await db.query(`SELECT id, password FROM users WHERE id = $1`, [req.user.id])
    if (rows.length === 0)
      return res.status(404).json({ error: 'Utilisateur introuvable' })

    const isMatch = await bcrypt.compare(current_password, rows[0].password)
    if (!isMatch)
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' })

    const newHash = await bcrypt.hash(new_password, parseInt(process.env.SALT_ROUNDS) || 12)
    await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [newHash, req.user.id])
    res.json({ message: 'Mot de passe mis à jour avec succès' })
  } catch (err) {
    console.error('CHANGE PASSWORD ERROR:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
