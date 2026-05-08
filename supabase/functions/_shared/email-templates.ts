const APP_URL  = 'https://bati-prelvio.vercel.app'
const BLUE     = '#1d4ed8'
const BLUE_CTA = '#2563eb'
const ORANGE   = '#b45309'

function footer() {
  return `
    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.8">
        Bati Prelvio — Logiciel de gestion BTP pour artisans<br>
        <a href="${APP_URL}" style="color:#94a3b8;text-decoration:none">${APP_URL.replace('https://', '')}</a>
        &nbsp;·&nbsp;
        <a href="${APP_URL}/confidentialite" style="color:#94a3b8;text-decoration:none">Confidentialité</a>
        &nbsp;·&nbsp;
        <a href="mailto:info@prelvio.com" style="color:#94a3b8;text-decoration:none">Contact</a>
      </p>
    </div>
  `
}

function header(badge: string, headerColor = BLUE) {
  return `
    <div style="background:${headerColor};padding:28px 40px">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle">
            <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;line-height:1.2">Bati Prelvio</div>
            <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:2px">Logiciel de gestion BTP</div>
          </td>
          <td align="right" valign="middle">
            <span style="display:inline-block;background:rgba(255,255,255,0.18);color:#ffffff;padding:5px 14px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">${badge}</span>
          </td>
        </tr>
      </table>
    </div>
  `
}

function shell(badge: string, body: string, headerColor = BLUE) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <div style="background-color:#f1f5f9;padding:40px 16px">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          ${header(badge, headerColor)}
          <div style="padding:36px 40px">
            ${body}
          </div>
          ${footer()}
        </div>
      </div>
    </body>
    </html>
  `
}

function greeting(name?: string) {
  return `<p style="margin:0 0 20px;color:#0f172a;font-size:16px;font-weight:600">Bonjour${name ? ` ${name}` : ''},</p>`
}

function text(content: string) {
  return `<p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.7">${content}</p>`
}

function infoCard(fields: { label: string; value: string; large?: boolean; accent?: string }[], color = BLUE) {
  const borderColor = color === ORANGE ? '#fed7aa' : '#bfdbfe'
  const bgColor     = color === ORANGE ? '#fff7ed' : '#eff6ff'

  const cells = fields.map(f => `
    <td style="padding-right:32px;vertical-align:top">
      <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;margin-bottom:5px">${f.label}</div>
      <div style="color:${f.accent || '#0f172a'};font-size:${f.large ? '22px' : '15px'};font-weight:700;line-height:1.2">${f.value}</div>
    </td>
  `).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bgColor};border:1px solid ${borderColor};border-radius:10px;margin:24px 0">
      <tr><td style="padding:20px 24px">
        <table cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>
      </td></tr>
    </table>
  `
}

function ctaButton(label: string, url: string, color = BLUE_CTA) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0">
      <tr>
        <td bgcolor="${color}" style="border-radius:8px">
          <a href="${url}" target="_blank" style="display:inline-block;padding:13px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.2px">${label} →</a>
        </td>
      </tr>
    </table>
  `
}

function attachmentBadge() {
  return `
    <div style="display:inline-flex;align-items:center;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:8px 14px;margin:20px 0">
      <span style="color:#64748b;font-size:12px">📎 Document joint en pièce jointe (PDF)</span>
    </div>
  `
}

function divider() {
  return `<div style="border-top:1px solid #f1f5f9;margin:28px 0"></div>`
}

// ─── Formatage ──────────────────────────────────────────────────────────────
function fmtEuro(v?: number) {
  return v != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)
    : ''
}
function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEMPLATES PUBLICS
// ═══════════════════════════════════════════════════════════════════════════

export function devisEmail(clientName: string, numero: string) {
  const body = `
    ${greeting(clientName)}
    ${text(`Veuillez trouver ci-joint votre <strong>devis N° ${numero}</strong>.`)}
    ${text('Ce devis est valable <strong>30 jours</strong> à compter de sa date d\'émission. Pour toute question, n\'hésitez pas à nous contacter.')}
    ${infoCard([
      { label: 'Numéro de devis', value: `N° ${numero}`, large: true },
      { label: 'Validité', value: '30 jours' },
    ])}
    ${attachmentBadge()}
  `
  return shell('DEVIS', body)
}

export function factureEmail(clientName: string, numero: string, montantTTC?: number, dateEcheance?: string) {
  const fields = [{ label: 'Numéro de facture', value: `N° ${numero}`, large: true }]
  if (montantTTC) fields.push({ label: 'Montant TTC', value: fmtEuro(montantTTC), large: true })
  if (dateEcheance) fields.push({ label: 'Date d\'échéance', value: fmtDate(dateEcheance) })

  const body = `
    ${greeting(clientName)}
    ${text(`Veuillez trouver ci-joint votre <strong>facture N° ${numero}</strong>.`)}
    ${text('Merci de procéder au règlement dans les délais indiqués sur la facture.')}
    ${infoCard(fields)}
    ${attachmentBadge()}
  `
  return shell('FACTURE', body)
}

export function relanceEmail(clientName: string, numero: string, montantTTC?: number, dateEcheance?: string) {
  const montantStr   = fmtEuro(montantTTC)
  const echeanceStr  = fmtDate(dateEcheance)

  const fields = [{ label: 'Facture', value: `N° ${numero}`, large: true }]
  if (montantTTC) fields.push({ label: 'Montant dû', value: montantStr, large: true, accent: '#b91c1c' })
  if (echeanceStr) fields.push({ label: 'Échéance dépassée', value: echeanceStr, accent: '#b91c1c' })

  const body = `
    ${greeting(clientName)}
    ${text('Sauf erreur ou omission de notre part, nous n\'avons pas encore reçu le règlement de la facture ci-dessous.')}
    ${infoCard(fields, ORANGE)}
    ${text('Nous vous remercions de bien vouloir régulariser cette situation dans les <strong>meilleurs délais</strong>.')}
    ${text('La facture est jointe à cet email. Pour tout renseignement, n\'hésitez pas à nous contacter.')}
    ${attachmentBadge()}
  `
  return shell('RAPPEL DE PAIEMENT', body, ORANGE)
}

export function signatureRequestEmail(clientName: string, numero: string, signingUrl: string) {
  const body = `
    ${greeting(clientName)}
    ${text(`Votre <strong>devis N° ${numero}</strong> est prêt. Consultez-le et apposez votre signature électronique en un clic.`)}
    ${infoCard([
      { label: 'Document', value: `Devis N° ${numero}`, large: true },
      { label: 'Action requise', value: 'Signature électronique' },
    ])}
    ${ctaButton('Consulter et signer le devis', signingUrl)}
    ${divider()}
    ${text('<span style="color:#94a3b8;font-size:12px">Ce lien est valable 30 jours. Si vous n\'êtes pas le destinataire de ce document, ignorez cet email.</span>')}
  `
  return shell('SIGNATURE REQUISE', body)
}

export function invitationEmail(senderName: string, inviteUrl: string) {
  const body = `
    ${greeting()}
    ${text(`<strong>${senderName}</strong> vous invite à rejoindre son espace de travail sur <strong>Bati Prelvio</strong> — logiciel de gestion BTP pour artisans.`)}
    ${text('En acceptant, vous aurez accès à ses devis, factures, chantiers et clients en temps réel.')}
    ${ctaButton('Rejoindre l\'équipe', inviteUrl)}
    ${divider()}
    ${text('<span style="color:#94a3b8;font-size:12px">Si vous n\'avez pas encore de compte, vous pourrez en créer un gratuitement après avoir cliqué sur le bouton.</span>')}
  `
  return shell('INVITATION ÉQUIPE', body)
}

export function retardNotifEmail(factures: { numero: string; clientNom: string; dateEcheance: string; montant: number }[]) {
  const total = factures.reduce((s, f) => s + f.montant, 0)

  const rows = factures.map(f => `
    <tr>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;font-weight:600">N° ${f.numero}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:13px">${f.clientNom || '—'}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#b91c1c;font-size:13px;font-weight:600">${fmtDate(f.dateEcheance)}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;font-weight:700;text-align:right">${fmtEuro(f.montant)}</td>
    </tr>
  `).join('')

  const body = `
    ${greeting()}
    ${text(`Vous avez <strong style="color:#b91c1c">${factures.length} facture${factures.length > 1 ? 's' : ''} en retard de paiement</strong>. Voici le récapitulatif :`)}

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:24px 0">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #e2e8f0">Facture</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #e2e8f0">Client</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #e2e8f0">Échéance</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #e2e8f0">Montant TTC</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#fef2f2">
          <td colspan="3" style="padding:12px 14px;font-size:13px;font-weight:700;color:#b91c1c">Total en retard</td>
          <td style="padding:12px 14px;font-size:14px;font-weight:700;color:#b91c1c;text-align:right">${fmtEuro(total)}</td>
        </tr>
      </tfoot>
    </table>

    ${ctaButton('Voir mes factures', `${APP_URL}/factures`, '#b91c1c')}
    ${divider()}
    ${text('<span style="color:#94a3b8;font-size:12px">Cet email est envoyé automatiquement lorsque des factures dépassent leur date d\'échéance.</span>')}
  `
  return shell('FACTURES EN RETARD', body, ORANGE)
}
