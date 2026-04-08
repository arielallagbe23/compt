/**
 * Middleware super admin — sécurité renforcée
 *
 * PRINCIPE : on ne fait JAMAIS confiance au JWT seul pour le rôle super_admin.
 * On re-query la base à chaque requête pour vérifier is_super_admin en temps réel.
 * Cela empêche qu'un token volé ou forgé avec is_super_admin=true soit accepté.
 */
const jwt = require('jsonwebtoken')
const db  = require('../lib/db')

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token manquant' })

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }

  try {
    // Toujours vérifier en base — jamais depuis le JWT
    const { rows } = await db.query(
      `SELECT id, email, is_super_admin, status FROM users WHERE id = $1`,
      [decoded.id]
    )

    if (rows.length === 0)
      return res.status(401).json({ error: 'Utilisateur introuvable' })

    const user = rows[0]

    if (user.status !== 'active')
      return res.status(403).json({ error: 'Compte inactif' })

    if (!user.is_super_admin)
      return res.status(403).json({ error: 'Accès réservé au super administrateur' })

    req.user = { id: user.id, email: user.email, is_super_admin: true }
    next()
  } catch (err) {
    console.error('SUPER ADMIN MIDDLEWARE ERROR:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
