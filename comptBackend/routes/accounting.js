const express = require("express");
const router = express.Router();
const db = require("../lib/db");
const auth = require("../middleware/auth");

// Taux fiscaux Bénin
const TAX_RATES = {
  IS: 0.30,          // Impôt sur les Sociétés — 30%
  IS_MINIMUM: 0.01,  // IS minimum — 1% du CA brut
  TVA: 0.18,         // TVA — 18%
  IBICA: 0.30,       // IBICA (assimilé IS pour EI)
};

// Taux de conversion vers XOF (approximatifs — à brancher sur une API en prod)
const TO_XOF = {
  XOF:  1,
  XAF:  1,
  EUR:  655.957,
  USD:  610,
  USDT: 610,
  ETH:  2_350_000,
  BTC:  38_500_000,
};

function toXOF(amount, currency) {
  return amount * (TO_XOF[currency] || 0);
}

/**
 * GET /accounting/summary
 * Résumé global : toutes les entreprises de l'user, par devise + projections fiscales XOF
 */
router.get("/summary", auth, async (req, res) => {
  try {
    // 1. Récupérer toutes les entreprises de l'user
    const companiesResult = await db.query(
      `SELECT id, name, type, legal_status, sector FROM companies WHERE owner_id = $1 ORDER BY id`,
      [req.user.id]
    );
    const companies = companiesResult.rows;

    if (companies.length === 0) return res.json({ companies: [], global: {} });

    const companyIds = companies.map((c) => c.id);

    // 2. Agrégat des transactions par entreprise et devise
    const txResult = await db.query(
      `SELECT
         company_id,
         currency,
         type,
         SUM(amount) AS total
       FROM transactions
       WHERE company_id = ANY($1)
       GROUP BY company_id, currency, type
       ORDER BY company_id, currency`,
      [companyIds]
    );

    // 3. Construire le résumé par entreprise
    const summaryMap = {};
    companies.forEach((c) => {
      summaryMap[c.id] = { ...c, byCurrency: {} };
    });

    txResult.rows.forEach(({ company_id, currency, type, total }) => {
      const s = summaryMap[company_id].byCurrency;
      if (!s[currency]) s[currency] = { recette: 0, depense: 0 };
      s[currency][type] += parseFloat(total);
    });

    // 4. Calcul fiscal XOF par entreprise — toutes devises converties en XOF
    const companySummaries = Object.values(summaryMap).map((c) => {
      // Consolider toutes les devises en XOF
      let ca = 0;
      let charges = 0;
      for (const [currency, { recette, depense }] of Object.entries(c.byCurrency)) {
        ca      += toXOF(recette, currency);
        charges += toXOF(depense, currency);
      }
      const benefice = ca - charges;
      const isBase = benefice > 0 ? benefice : 0;
      const isMinimum = ca * TAX_RATES.IS_MINIMUM;
      const is = Math.max(isBase * TAX_RATES.IS, isMinimum);
      const tva = ca * TAX_RATES.TVA;

      return {
        ...c,
        fiscal: {
          ca,
          charges,
          benefice,
          is: Math.round(is),
          is_minimum: Math.round(isMinimum),
          tva_collectee: Math.round(tva),
          acompte_trimestriel: Math.round(is / 4),
        },
      };
    });

    // 5. Global XOF consolidé
    const globalXOF = companySummaries.reduce(
      (acc, c) => {
        acc.ca       += c.fiscal.ca;
        acc.charges  += c.fiscal.charges;
        acc.benefice += c.fiscal.benefice;
        acc.is       += c.fiscal.is;
        acc.tva      += c.fiscal.tva_collectee;
        return acc;
      },
      { ca: 0, charges: 0, benefice: 0, is: 0, tva: 0 }
    );

    res.json({
      companies: companySummaries,
      global: globalXOF,
      tax_rates: TAX_RATES,
    });
  } catch (err) {
    console.error("ACCOUNTING ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
