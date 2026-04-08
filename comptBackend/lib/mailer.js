const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

async function sendVerificationEmail({ to, token, frontendUrl }) {
  const link = `${frontendUrl}/verify/${token}`

  await transporter.sendMail({
    from: `"Compt App" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Vérifiez votre adresse email — Compt',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0a0a0a;">
        <h2 style="font-weight: 300; letter-spacing: -0.02em; margin-bottom: 0.5rem;">Bienvenue sur Compt</h2>
        <p style="color: #525252; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem;">
          Votre compte a été approuvé. Cliquez sur le bouton ci-dessous pour vérifier votre adresse
          email et activer votre compte. Ce lien est valable <strong>48 heures</strong>.
        </p>
        <a href="${link}"
           style="display: inline-block; background: #0a0a0a; color: #ffffff;
                  padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none;
                  font-size: 0.875rem; font-weight: 400; letter-spacing: 0.01em;">
          Activer mon compte
        </a>
        <p style="color: #a3a3a3; font-size: 0.75rem; margin-top: 2rem; line-height: 1.6;">
          Si vous n'avez pas demandé la création d'un compte sur Compt, ignorez cet email.<br/>
          Lien alternatif : <a href="${link}" style="color: #525252;">${link}</a>
        </p>
      </div>
    `,
  })
}

async function sendRejectionEmail({ to, reason }) {
  await transporter.sendMail({
    from: `"Compt App" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Votre demande d\'accès — Compt',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0a0a0a;">
        <h2 style="font-weight: 300; letter-spacing: -0.02em; margin-bottom: 0.5rem;">Demande d'accès</h2>
        <p style="color: #525252; font-size: 0.9rem; line-height: 1.6;">
          Votre demande d'accès à Compt n'a pas pu être approuvée.
          ${reason ? `<br/><br/><strong>Motif :</strong> ${reason}` : ''}
        </p>
        <p style="color: #a3a3a3; font-size: 0.75rem; margin-top: 2rem;">
          Pour toute question, contactez-nous à <a href="mailto:${process.env.MAIL_USER}" style="color: #525252;">${process.env.MAIL_USER}</a>.
        </p>
      </div>
    `,
  })
}

async function sendInvitationEmail({ to, role, companyName, inviterEmail, token, frontendUrl }) {
  const ROLE_LABELS = { CEO: 'CEO', associe: 'Associé(e)', comptable: 'Comptable', employe: 'Employé(e)' }
  const roleLabel = ROLE_LABELS[role] || role

  const body = token
    ? `
      <p style="color:#525252;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;">
        <strong>${inviterEmail}</strong> vous invite à rejoindre <strong>${companyName}</strong>
        en tant que <strong>${roleLabel}</strong> sur Compt.<br/><br/>
        Cliquez sur le bouton ci-dessous pour accepter l'invitation. Ce lien est valable <strong>48 heures</strong>.
      </p>
      <a href="${frontendUrl}/rejoindre/${token}"
         style="display:inline-block;background:#0a0a0a;color:#ffffff;
                padding:0.75rem 1.5rem;border-radius:8px;text-decoration:none;
                font-size:0.875rem;font-weight:400;">
        Accepter l'invitation
      </a>`
    : `
      <p style="color:#525252;font-size:0.9rem;line-height:1.6;">
        <strong>${inviterEmail}</strong> vous a ajouté à <strong>${companyName}</strong>
        en tant que <strong>${roleLabel}</strong> sur Compt.<br/>
        Connectez-vous pour accéder à vos nouvelles entreprises.
      </p>`

  await transporter.sendMail({
    from: `"Compt App" <${process.env.MAIL_USER}>`,
    to,
    subject: `Invitation à rejoindre ${companyName} — Compt`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0a0a0a;">
        <h2 style="font-weight:300;letter-spacing:-0.02em;margin-bottom:0.5rem;">Invitation Compt</h2>
        ${body}
        <p style="color:#a3a3a3;font-size:0.75rem;margin-top:2rem;line-height:1.6;font-style:italic;">
          Si vous ne connaissez pas l'expéditeur, ignorez cet email.
        </p>
      </div>`,
  })
}

module.exports = { sendVerificationEmail, sendRejectionEmail, sendInvitationEmail }
