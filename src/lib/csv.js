function escapeCell(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCSV(headers, rows) {
  const lines = [
    headers.join(';'),
    ...rows.map(row => row.map(escapeCell).join(';')),
  ]
  return '﻿' + lines.join('\n') // BOM UTF-8 pour Excel
}

export function downloadCSV(filename, headers, rows) {
  const csv  = buildCSV(headers, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportDevisCSV(devis) {
  downloadCSV(
    `devis-${new Date().toISOString().slice(0,10)}.csv`,
    ['N° Devis', 'Client', 'Statut', 'Total HT (€)', 'TVA (€)', 'Total TTC (€)', 'Date'],
    devis.map(d => [
      d.numero,
      d.clients?.nom || '',
      d.statut,
      (d.total_ht  || 0).toFixed(2),
      (d.total_tva || 0).toFixed(2),
      (d.total_ttc || 0).toFixed(2),
      new Date(d.created_at).toLocaleDateString('fr-FR'),
    ])
  )
}

export function exportFacturesCSV(factures) {
  downloadCSV(
    `factures-${new Date().toISOString().slice(0,10)}.csv`,
    ['N° Facture', 'Client', 'Statut', 'Total HT (€)', 'TVA (€)', 'Total TTC (€)', 'Échéance', 'Date'],
    factures.map(f => [
      f.numero,
      f.clients?.nom || '',
      f.statut,
      (f.total_ht  || 0).toFixed(2),
      (f.total_tva || 0).toFixed(2),
      (f.total_ttc || 0).toFixed(2),
      f.date_echeance ? new Date(f.date_echeance + 'T12:00:00').toLocaleDateString('fr-FR') : '',
      new Date(f.created_at).toLocaleDateString('fr-FR'),
    ])
  )
}

// Journal des ventes — format compatible Sage/EBP/comptable
export function exportJournalVentes(factures) {
  const rows = factures.map(f => {
    const date    = new Date(f.created_at).toLocaleDateString('fr-FR')
    const ht      = (f.total_ht  || 0).toFixed(2)
    const tva     = (f.total_tva || 0).toFixed(2)
    const ttc     = (f.total_ttc || 0).toFixed(2)
    const statut  = { brouillon: 'Brouillon', envoyee: 'Émise', payee: 'Payée', en_retard: 'En retard', annulee: 'Annulée' }[f.statut] || f.statut
    const echeance = f.date_echeance ? new Date(f.date_echeance + 'T12:00:00').toLocaleDateString('fr-FR') : ''
    return [
      'VE',           // Code journal (Ventes)
      date,           // Date de pièce
      f.numero,       // N° de pièce
      f.clients?.nom || '',  // Libellé / raison sociale client
      f.clients?.email || '',
      '411000',       // Compte client (plan comptable général)
      ht,             // Base HT
      tva,            // TVA collectée
      ttc,            // Total TTC
      '20',           // Taux TVA (%)
      '445710',       // Compte TVA collectée (PCG)
      '706000',       // Compte produit prestation (PCG)
      echeance,       // Date d'échéance
      statut,         // Statut paiement
    ]
  })

  downloadCSV(
    `journal-ventes-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      'Journal', 'Date', 'N° Pièce', 'Client', 'Email client',
      'Cpte client', 'Montant HT (€)', 'TVA (€)', 'Montant TTC (€)',
      'Taux TVA (%)', 'Cpte TVA', 'Cpte produit', 'Échéance', 'Statut',
    ],
    rows
  )
}
