import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoSrc from '../assets/logo.png'

const TVA_RATE = 0.20

export function generateDevisPDF({ devis, client, lignes, entreprise }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  // ── En-tête entreprise ──────────────────────────────────────────────
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 38, 'F')

  try { doc.addImage(logoSrc, 'PNG', margin, 7, 20, 20) } catch (_) {}

  const textX = margin + 24
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text(entreprise?.nom || 'Votre Entreprise', textX, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const entrepriseInfo = [
    entreprise?.adresse,
    entreprise?.tel,
    entreprise?.email,
  ].filter(Boolean).join('  |  ')
  if (entrepriseInfo) doc.text(entrepriseInfo, textX, 24)
  if (entreprise?.siret) doc.text(`SIRET : ${entreprise.siret}`, textX, 30)

  // Numéro de devis (droite)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('DEVIS', pageW - margin, 16, { align: 'right' })
  doc.setFontSize(10)
  doc.text(`N° ${devis.numero}`, pageW - margin, 24, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const dateStr = new Date(devis.created_at || Date.now()).toLocaleDateString('fr-FR')
  doc.text(`Date : ${dateStr}`, pageW - margin, 30, { align: 'right' })

  // ── Bloc client ──────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, 46, pageW / 2 - 20, 42, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('DESTINATAIRE', margin + 4, 54)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(20, 20, 20)
  doc.text(client?.nom || '—', margin + 4, 63)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  let clientY = 70
  if (client?.adresse) { doc.text(client.adresse, margin + 4, clientY); clientY += 6 }
  if (client?.email)   { doc.text(client.email,   margin + 4, clientY); clientY += 6 }
  if (client?.tel)     { doc.text(client.tel,      margin + 4, clientY) }

  // ── Tableau des articles ─────────────────────────────────────────────
  const tableTop = 97

  const rows = lignes.map((l, i) => [
    i + 1,
    l.designation,
    Number(l.quantite).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
    formatEuro(l.pu_ht),
    formatEuro(l.quantite * l.pu_ht),
  ])

  autoTable(doc, {
    startY: tableTop,
    head: [['#', 'Désignation', 'Qté', 'PU HT', 'Total HT']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'right', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  })

  // ── Totaux ────────────────────────────────────────────────────────────
  const totalHT  = lignes.reduce((s, l) => s + l.quantite * l.pu_ht, 0)
  const totalTVA = totalHT * TVA_RATE
  const totalTTC = totalHT + totalTVA

  const finalY = doc.lastAutoTable.finalY + 8
  const colX = pageW - margin - 80

  doc.setDrawColor(220, 220, 220)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(colX - 5, finalY - 5, 85, 42, 3, 3, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text('Total HT',       colX,          finalY + 5)
  doc.text('TVA (20%)',      colX,          finalY + 13)
  doc.setDrawColor(200, 200, 200)
  doc.line(colX - 5, finalY + 19, colX + 79, finalY + 19)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(37, 99, 235)
  doc.text('Total TTC',      colX,          finalY + 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(formatEuro(totalHT),  colX + 79, finalY + 5,  { align: 'right' })
  doc.text(formatEuro(totalTVA), colX + 79, finalY + 13, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(37, 99, 235)
  doc.text(formatEuro(totalTTC), colX + 79, finalY + 28, { align: 'right' })

  // ── Notes / mentions légales ──────────────────────────────────────────
  const notesY = finalY + 52
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'Devis valable 30 jours — TVA non applicable si micro-entreprise (art. 293B du CGI)',
    margin,
    notesY,
  )

  // ── Pied de page ──────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Bati Prelvio — Logiciel de gestion BTP', pageW / 2, 290, { align: 'center' })

  return doc
}

export function generateFacturePDF({ facture, client, lignes, entreprise }) {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  // En-tête entreprise
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 38, 'F')

  try { doc.addImage(logoSrc, 'PNG', margin, 7, 20, 20) } catch (_) {}

  const textX = margin + 24
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text(entreprise?.nom || 'Votre Entreprise', textX, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const info = [entreprise?.adresse, entreprise?.tel, entreprise?.email].filter(Boolean).join('  |  ')
  if (info) doc.text(info, textX, 24)
  if (entreprise?.siret) doc.text(`SIRET : ${entreprise.siret}`, textX, 30)

  // Numéro de facture (droite)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('FACTURE', pageW - margin, 16, { align: 'right' })
  doc.setFontSize(10)
  doc.text(`N° ${facture.numero}`, pageW - margin, 24, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Date : ${new Date(facture.created_at || Date.now()).toLocaleDateString('fr-FR')}`, pageW - margin, 30, { align: 'right' })

  // Bloc client
  doc.setTextColor(30, 30, 30)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, 46, pageW / 2 - 20, 42, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('DESTINATAIRE', margin + 4, 54)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(20, 20, 20)
  doc.text(client?.nom || '—', margin + 4, 63)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  let cy = 70
  if (client?.adresse) { doc.text(client.adresse, margin + 4, cy); cy += 6 }
  if (client?.email)   { doc.text(client.email,   margin + 4, cy); cy += 6 }
  if (client?.tel)     { doc.text(client.tel,      margin + 4, cy) }

  // Bloc échéance (droite)
  if (facture.date_echeance) {
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(pageW / 2 + 5, 46, pageW / 2 - 20, 20, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(37, 99, 235)
    doc.text('DATE D\'ÉCHÉANCE', pageW / 2 + 9, 54)
    doc.setFontSize(10)
    doc.text(new Date(facture.date_echeance).toLocaleDateString('fr-FR'), pageW / 2 + 9, 62)
  }

  // Tableau des articles
  const rows = lignes.map((l, i) => [
    i + 1,
    l.designation,
    Number(l.quantite).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
    formatEuro(l.pu_ht),
    formatEuro(l.quantite * l.pu_ht),
  ])

  autoTable(doc, {
    startY: 97,
    head: [['#', 'Désignation', 'Qté', 'PU HT', 'Total HT']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'right', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  })

  // Totaux
  const totalHT  = lignes.reduce((s, l) => s + l.quantite * l.pu_ht, 0)
  const totalTVA = totalHT * TVA_RATE
  const totalTTC = totalHT + totalTVA

  const finalY = doc.lastAutoTable.finalY + 8
  const colX   = pageW - margin - 80

  doc.setFillColor(249, 250, 251)
  doc.roundedRect(colX - 5, finalY - 5, 85, 42, 3, 3, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text('Total HT',  colX, finalY + 5)
  doc.text('TVA (20%)', colX, finalY + 13)
  doc.setDrawColor(200, 200, 200)
  doc.line(colX - 5, finalY + 19, colX + 79, finalY + 19)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(37, 99, 235)
  doc.text('Total TTC', colX, finalY + 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(formatEuro(totalHT),  colX + 79, finalY + 5,  { align: 'right' })
  doc.text(formatEuro(totalTVA), colX + 79, finalY + 13, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(37, 99, 235)
  doc.text(formatEuro(totalTTC), colX + 79, finalY + 28, { align: 'right' })

  // Mentions légales
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Paiement à réception de facture — TVA non applicable si micro-entreprise (art. 293B du CGI)', margin, finalY + 52)

  // Pied de page
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Bati Prelvio — Logiciel de gestion BTP', pageW / 2, 290, { align: 'center' })

  return doc
}

export function downloadPDF(doc, filename) {
  doc.save(filename)
}

export function getPDFBase64(doc) {
  return doc.output('datauristring').split(',')[1]
}

function formatEuro(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0)
}
