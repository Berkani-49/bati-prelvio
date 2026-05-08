import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoSrc from '../assets/logo.png'

const TVA_RATE = 0.20
const AMBER    = [180, 83, 9]
const AMBER_BG = [255, 237, 213]
const GRAY_BG  = [248, 250, 252]
const BORDER   = [226, 232, 240]
const TEXT_DK  = [15, 23, 42]
const TEXT_MD  = [71, 85, 105]
const TEXT_LT  = [148, 163, 184]
const WHITE    = [255, 255, 255]

function formatEuro(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

export function generateAvoirPDF({ avoir, client, lignes, entreprise, logoBase64, factureNumero }) {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const margin = 15

  // ── En-tête ambre ────────────────────────────────────────────────
  doc.setFillColor(180, 83, 9)
  doc.rect(0, 0, pageW, 44, 'F')

  try { doc.addImage(logoBase64 || logoSrc, 'PNG', margin, 9, 22, 22) } catch (_) {}

  const textX = margin + 28
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...WHITE)
  doc.text(entreprise?.nom || 'Votre Entreprise', textX, 19)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(253, 230, 138)
  const info = [entreprise?.adresse, entreprise?.tel, entreprise?.email].filter(Boolean).join('   ·   ')
  if (info) doc.text(info, textX, 27)
  if (entreprise?.siret) doc.text(`SIRET : ${entreprise.siret}`, textX, 34)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...WHITE)
  doc.text('AVOIR', pageW - margin, 18, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(253, 230, 138)
  doc.text(`N° ${avoir.numero}`, pageW - margin, 28, { align: 'right' })
  doc.text(`Date : ${new Date(avoir.created_at || Date.now()).toLocaleDateString('fr-FR')}`, pageW - margin, 36, { align: 'right' })

  // ── Bloc client ──────────────────────────────────────────────────
  const blockW = pageW / 2 - 22
  const blockY = 52

  doc.setFillColor(...GRAY_BG)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, blockY, blockW, 44, 3, 3, 'FD')
  doc.setFillColor(...AMBER)
  doc.rect(margin, blockY, 3, 44, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LT)
  doc.text('DESTINATAIRE', margin + 8, blockY + 9)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_DK)
  doc.text(client?.nom || '—', margin + 8, blockY + 19)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_MD)
  let cy = blockY + 28
  if (client?.adresse) { doc.text(client.adresse, margin + 8, cy); cy += 7 }
  if (client?.email)   { doc.text(client.email,   margin + 8, cy); cy += 7 }
  if (client?.tel)     { doc.text(client.tel,      margin + 8, cy) }

  // ── Référence facture (droite) ───────────────────────────────────
  if (factureNumero) {
    const refX = margin + blockW + 12
    const refW = pageW / 2 - 22
    doc.setFillColor(...AMBER_BG)
    doc.setDrawColor(...AMBER)
    doc.setLineWidth(0.4)
    doc.roundedRect(refX, blockY, refW, 44, 3, 3, 'FD')
    doc.setFillColor(...AMBER)
    doc.rect(refX, blockY, 3, 44, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...TEXT_LT)
    doc.text('EN AVOIR DE LA FACTURE', refX + 8, blockY + 9)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...AMBER)
    doc.text(`N° ${factureNumero}`, refX + 8, blockY + 22)
  }

  // ── Motif ────────────────────────────────────────────────────────
  let tableStartY = 103
  if (avoir.motif) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MD)
    doc.text(`Motif : ${avoir.motif}`, margin, 100)
    tableStartY = 107
  }

  // ── Tableau ──────────────────────────────────────────────────────
  const rows = lignes.map((l, i) => [
    i + 1,
    l.designation,
    Number(l.quantite).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
    formatEuro(l.pu_ht),
    formatEuro(l.quantite * l.pu_ht),
  ])

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Désignation', 'Qté', 'PU HT', 'Total HT']],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: AMBER,
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

  // ── Totaux ────────────────────────────────────────────────────────
  const totalHT  = lignes.reduce((s, l) => s + l.quantite * l.pu_ht, 0)
  const totalTVA = totalHT * TVA_RATE
  const totalTTC = totalHT + totalTVA
  const finalY   = doc.lastAutoTable.finalY + 10

  const boxW = 96
  const boxX = pageW - margin - boxW
  const padX = 10
  const valX = boxX + boxW - padX

  doc.setFillColor(...GRAY_BG)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.roundedRect(boxX, finalY, boxW, 30, 3, 3, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MD)
  doc.text('Total HT',  boxX + padX, finalY + 9)
  doc.text('TVA 20 %',  boxX + padX, finalY + 20)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_DK)
  doc.text(formatEuro(totalHT),  valX, finalY + 9,  { align: 'right' })
  doc.text(formatEuro(totalTVA), valX, finalY + 20, { align: 'right' })

  const sepY = finalY + 32
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(boxX + 6, sepY, boxX + boxW - 6, sepY)

  const ttcY = sepY + 4
  doc.setFillColor(...AMBER)
  doc.roundedRect(boxX, ttcY, boxW, 16, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...WHITE)
  doc.text('Total avoir TTC', boxX + padX, ttcY + 10.5)
  doc.text(formatEuro(totalTTC), valX, ttcY + 10.5, { align: 'right' })

  // ── Mentions + pied de page ───────────────────────────────────────
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...TEXT_LT)
  doc.text('Ce document est un avoir — crédit à déduire de votre prochaine facture ou à rembourser.', margin, finalY + 56)

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(15, 286, pageW - 15, 286)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LT)
  doc.text('Bati Prelvio — Logiciel de gestion BTP', pageW / 2, 291, { align: 'center' })

  return doc
}
