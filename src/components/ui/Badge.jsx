const styles = {
  // Devis
  brouillon:    'bg-gray-100 text-gray-700',
  envoye:       'bg-orange-100 text-orange-700',
  accepte:      'bg-green-100 text-green-700',
  refuse:       'bg-red-100 text-red-700',
  // Chantiers
  en_attente:   'bg-amber-100 text-amber-700',
  en_cours:     'bg-orange-100 text-orange-700',
  termine:      'bg-green-100 text-green-700',
  annule:       'bg-gray-100 text-gray-500',
  // Factures
  envoyee:      'bg-orange-100 text-orange-700',
  payee:        'bg-green-100 text-green-700',
  en_retard:    'bg-red-100 text-red-700',
  // Véhicules
  disponible:   'bg-green-100 text-green-700',
  en_service:   'bg-orange-100 text-orange-700',
  maintenance:  'bg-amber-100 text-amber-700',
  hors_service: 'bg-red-100 text-red-700',
}

const labels = {
  brouillon:    'Brouillon',
  envoye:       'Envoyé',
  accepte:      'Accepté',
  refuse:       'Refusé',
  en_attente:   'En attente',
  en_cours:     'En cours',
  termine:      'Terminé',
  annule:       'Annulé',
  envoyee:      'Envoyée',
  payee:        'Payée',
  en_retard:    'En retard',
  disponible:   'Disponible',
  en_service:   'En service',
  maintenance:  'Maintenance',
  hors_service: 'Hors service',
}

export default function Badge({ statut }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[statut] || styles.brouillon}`}>
      {labels[statut] || statut}
    </span>
  )
}
