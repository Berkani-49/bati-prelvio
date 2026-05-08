import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoSrc from '../assets/logo.png'

const TVA_RATE = 0.20
const BLUE     = [37, 99, 235]
const BLUE_LT  = [239, 246, 255]
const GRAY_BG  = [248, 250, 252]
const BORDER   = [226, 232, 240]
const TEXT_DK  = [15, 23, 42]
const TEXT_MD  = [71, 85, 105]
const TEXT_LT  = [148, 163, 184]
const WHITE    = [255, 255, 255]

function formatEuro(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

function drawHeader(doc, pageW, margin, title, numero, dateStr, entreprise, logoBase64) {
  // Bande bleue principale
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, pageW, 44, 'F')

  // Logo
  try { doc.addImage(logoBase64 || logoSrc, 'PNG', margin, 9, 22, 22) } catch (_) {}

  // Nom entreprise
  const textX = margin + 28
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...WHITE)
  doc.text(entreprise?.nom || 'Votre Entreprise', textX, 19)

  // Infos entreprise
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(197, 219, 255)
  const info = [entreprise?.adresse, entreprise?.tel, entreprise?.email].filter(Boolean).join('   ·   ')
  if (info) doc.text(info, textX, 27)
  if (entreprise?.siret) doc.text(`SIRET : ${entreprise.siret}`, textX, 34)

  // Titre document (droite)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...WHITE)
  doc.text(title, pageW - margin, 18, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(197, 219, 255)
  doc.text(`N° ${numero}`, pageW - margin, 28, { align: 'right' })
  doc.text(`Date : ${dateStr}`, pageW - margin, 36, { align: 'right' })
}

function drawClientBlock(doc, margin, client, pageW) {
  const blockW = pageW / 2 - 22
  const blockY = 52
  const blockH = 44

  // Fond + bordure
  doc.setFillColor(...GRAY_BG)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, blockY, blockW, blockH, 3, 3, 'FD')

  // Accent gauche bleu
  doc.setFillColor(...BLUE)
  doc.rect(margin, blockY, 3, blockH, 'F')

  // Label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LT)
  doc.text('DESTINATAIRE', margin + 8, blockY + 9)

  // Nom
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_DK)
  doc.text(client?.nom || '—', margin + 8, blockY + 19)

  // Coordonnées
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_MD)
  let y = blockY + 28
  if (client?.adresse) { doc.text(client.adresse, margin + 8, y); y += 7 }
  if (client?.email)   { doc.text(client.email,   margin + 8, y); y += 7 }
  if (client?.tel)     { doc.text(client.tel,      margin + 8, y) }
}

function drawTotals(doc, pageW, margin, finalY, totalHT, totalTVA, totalTTC, label = 'Total TTC') {
  const boxW = 96
  const boxX = pageW - margin - boxW
  const rowH = 11
  const padX = 10
  const valX = boxX + boxW - padX

  // Bloc gris HT + TVA
  doc.setFillColor(...GRAY_BG)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.roundedRect(boxX, finalY, boxW, rowH * 2 + 8, 3, 3, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MD)
  doc.text('Total HT',  boxX + padX, finalY + 9)
  doc.text('TVA 20 %',  boxX + padX, finalY + 9 + rowH)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_DK)
  doc.text(formatEuro(totalHT),  valX, finalY + 9,         { align: 'right' })
  doc.text(formatEuro(totalTVA), valX, finalY + 9 + rowH,  { align: 'right' })

  // Séparateur
  const sepY = finalY + rowH * 2 + 10
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(boxX + 6, sepY, boxX + boxW - 6, sepY)

  // Bloc bleu TTC
  const ttcY = sepY + 4
  doc.setFillColor(...BLUE)
  doc.roundedRect(boxX, ttcY, boxW, 16, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...WHITE)
  doc.text(label,                boxX + padX, ttcY + 10.5)
  doc.text(formatEuro(totalTTC), valX,         ttcY + 10.5, { align: 'right' })
}

function drawFooter(doc, pageW, notesY, notesText) {
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...TEXT_LT)
  doc.text(notesText, 15, notesY)

  // Pied de page
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(15, 286, pageW - 15, 286)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LT)
  doc.text('Bati Prelvio — Logiciel de gestion BTP', pageW / 2, 291, { align: 'center' })
}

// ─────────────────────────────────────────────────────────────────
//  DEVIS
// ─────────────────────────────────────────────────────────────────
export function generateDevisPDF({ devis, client, lignes, entreprise, logoBase64 }) {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  const dateStr = new Date(devis.created_at || Date.now()).toLocaleDateString('fr-FR')
  drawHeader(doc, pageW, margin, 'DEVIS', devis.numero, dateStr, entreprise, logoBase64)
  drawClientBlock(doc, margin, client, pageW)

  // Tableau
  const rows = lignes.map((l, i) => [
    i + 1,
    l.designation,
    Number(l.quantite).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
    formatEuro(l.pu_ht),
    formatEuro(l.quantite * l.pu_ht),
  ])

  autoTable(doc, {
    startY: 103,
    head: [['#', 'Désignation', 'Qté', 'PU HT', 'Total HT']],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: BLUE,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: TEXT_DK,
      cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 5 },
    },
    alternateRowStyles: { fillColor: GRAY_BG },
    styles: { lineColor: BORDER, lineWidth: 0.3 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'right',  cellWidth: 24 },
      3: { halign: 'right',  cellWidth: 33 },
      4: { halign: 'right',  cellWidth: 33 },
    },
    margin: { left: margin, right: margin },
  })

  const totalHT  = lignes.reduce((s, l) => s + l.quantite * l.pu_ht, 0)
  const totalTVA = totalHT * TVA_RATE
  const totalTTC = totalHT + totalTVA
  const finalY   = doc.lastAutoTable.finalY + 10

  drawTotals(doc, pageW, margin, finalY, totalHT, totalTVA, totalTTC)

  // Signature client
  if (devis.signature_base64 && devis.signe_le) {
    const sigY = finalY + 68
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(margin, sigY, margin + 70, sigY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MD)
    doc.text('Signature du client', margin, sigY + 7)
    try {
      doc.addImage(`data:image/png;base64,${devis.signature_base64}`, 'PNG', margin, sigY + 10, 55, 22)
    } catch (_) {}
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...TEXT_LT)
    const sigDate = new Date(devis.signe_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    doc.text(`Signé le ${sigDate}${devis.signe_par ? ` par ${devis.signe_par}` : ''}`, margin, sigY + 35)
  }

  drawFooter(doc, pageW, finalY + 54,
    'Devis valable 30 jours — TVA non applicable si micro-entreprise (art. 293B du CGI)')

  return doc
}

// ─────────────────────────────────────────────────────────────────
//  FACTURE
// ─────────────────────────────────────────────────────────────────
export function generateFacturePDF({ facture, client, lignes, entreprise, logoBase64 }) {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  const dateStr = new Date(facture.created_at || Date.now()).toLocaleDateString('fr-FR')
  drawHeader(doc, pageW, margin, 'FACTURE', facture.numero, dateStr, entreprise, logoBase64)
  drawClientBlock(doc, margin, client, pageW)

  // Bloc échéance (droite)
  if (facture.date_echeance) {
    const ecW = pageW / 2 - 22
    const ecX = margin + ecW + 12
    doc.setFillColor(...BLUE_LT)
    doc.setDrawColor(...BLUE)
    doc.setLineWidth(0.4)
    doc.roundedRect(ecX, 52, ecW, 44, 3, 3, 'FD')

    doc.setFillColor(...BLUE)
    doc.rect(ecX, 52, 3, 44, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...TEXT_LT)
    doc.text('DATE D\'ÉCHÉANCE', ecX + 8, 61)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...BLUE)
    doc.text(
      new Date(facture.date_echeance).toLocaleDateString('fr-FR'),
      ecX + 8, 74,
    )
  }

  // Tableau
  const rows = lignes.map((l, i) => [
    i + 1,
    l.designation,
    Number(l.quantite).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
    formatEuro(l.pu_ht),
    formatEuro(l.quantite * l.pu_ht),
  ])

  autoTable(doc, {
    startY: 103,
    head: [['#', 'Désignation', 'Qté', 'PU HT', 'Total HT']],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: BLUE,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: TEXT_DK,
      cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 5 },
    },
    alternateRowStyles: { fillColor: GRAY_BG },
    styles: { lineColor: BORDER, lineWidth: 0.3 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'right',  cellWidth: 24 },
      3: { halign: 'right',  cellWidth: 33 },
      4: { halign: 'right',  cellWidth: 33 },
    },
    margin: { left: margin, right: margin },
  })

  const totalHT  = lignes.reduce((s, l) => s + l.quantite * l.pu_ht, 0)
  const totalTVA = totalHT * TVA_RATE
  const totalTTC = totalHT + totalTVA
  const finalY   = doc.lastAutoTable.finalY + 10

  drawTotals(doc, pageW, margin, finalY, totalHT, totalTVA, totalTTC)

  drawFooter(doc, pageW, finalY + 54,
    'Paiement à réception de facture — TVA non applicable si micro-entreprise (art. 293B du CGI)')

  return doc
}

export function downloadPDF(doc, filename) {
  doc.save(filename)
}

export function getPDFBase64(doc) {
  return doc.output('datauristring').split(',')[1]
}
