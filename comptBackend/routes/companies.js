const express = require("express");
const router = express.Router();
const db = require("../lib/db");
const auth = require("../middleware/auth");

// CREATE COMPANY
router.post("/", auth, async (req, res) => {
  const {
    name,
    type,
    legal_status,
    sector,
    ifu,
    rccm,
    registration_date,
    city,
  } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const result = await db.query(
      `INSERT INTO companies
      (name, type, legal_status, sector, ifu, rccm, registration_date, city, owner_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        name,
        type,
        legal_status,
        sector,
        ifu,
        rccm,
        registration_date,
        city,
        req.user.id,
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("CREATE COMPANY ERROR:", err.message);

    if (err.code === "23505") {
      return res.status(400).json({ error: "IFU already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});

// GET ALL COMPANIES FOR AUTHENTICATED USER
router.get("/", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT c.*, cm.role AS member_role
       FROM companies c
       LEFT JOIN company_members cm ON cm.company_id = c.id AND cm.user_id = $1
       WHERE c.owner_id = $1 OR cm.user_id = $1
       ORDER BY c.id DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET COMPANIES ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET ONE COMPANY (owner only)
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM companies WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Company not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET COMPANY ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE COMPANY (admin only)
router.delete("/:id", auth, async (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: "Accès refusé — réservé aux administrateurs" });
  }
  try {
    const result = await db.query(
      `DELETE FROM companies WHERE id = $1 AND owner_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Entreprise introuvable" });
    res.json({ message: "Entreprise supprimée" });
  } catch (err) {
    console.error("DELETE COMPANY ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET TRANSACTIONS FOR A COMPANY (owner + membres)
router.get("/:id/transactions", auth, async (req, res) => {
  try {
    const company = await db.query(
      `SELECT c.id FROM companies c
       LEFT JOIN company_members cm ON cm.company_id = c.id AND cm.user_id = $2
       WHERE c.id = $1 AND (c.owner_id = $2 OR cm.user_id = $2)`,
      [req.params.id, req.user.id]
    );
    if (company.rows.length === 0)
      return res.status(404).json({ error: "Company not found" });

    const result = await db.query(
      `SELECT * FROM transactions WHERE company_id = $1 ORDER BY date DESC, id DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET TRANSACTIONS ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD TRANSACTION
router.post("/:id/transactions", auth, async (req, res) => {
  const {
    type, amount, currency, description, date,
    sender_name, sender_phone, receiver_name, receiver_phone,
    from_address, to_address, tx_hash, network, aml_score,
  } = req.body;

  try {
    const company = await db.query(
      `SELECT id FROM companies WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (company.rows.length === 0)
      return res.status(404).json({ error: "Company not found" });

    if (!type || !amount || !currency)
      return res.status(400).json({ error: "type, amount et currency sont requis" });

    const result = await db.query(
      `INSERT INTO transactions
        (company_id, type, amount, currency, description, date,
         sender_name, sender_phone, receiver_name, receiver_phone,
         from_address, to_address, tx_hash, network, aml_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        req.params.id, type, amount, currency,
        description || null,
        date || new Date(),
        sender_name   || null, sender_phone   || null,
        receiver_name || null, receiver_phone || null,
        from_address  || null, to_address     || null,
        tx_hash       || null, network        || null,
        aml_score != null && aml_score !== '' ? parseInt(aml_score) : null,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADD TRANSACTION ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── TOGGLE TYPE — recette ↔ depense ──────────────────────────────────────────
router.post("/:id/transactions/:txId/toggle-type", auth, async (req, res) => {
  try {
    const company = await db.query(
      `SELECT id FROM companies WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (company.rows.length === 0)
      return res.status(404).json({ error: "Company not found" });

    const { rows } = await db.query(
      `UPDATE transactions
       SET type = CASE WHEN type = 'recette' THEN 'depense' ELSE 'recette' END
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [req.params.txId, req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Transaction introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE TRANSACTION ────────────────────────────────────────────────────────
router.delete("/:id/transactions/:txId", auth, async (req, res) => {
  try {
    const company = await db.query(
      `SELECT id FROM companies WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (company.rows.length === 0)
      return res.status(404).json({ error: "Company not found" });

    const { rows } = await db.query(
      `DELETE FROM transactions WHERE id = $1 AND company_id = $2 RETURNING id`,
      [req.params.txId, req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Transaction introuvable' });
    res.json({ message: 'Transaction supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
