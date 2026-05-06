import DevisList from '../../components/devis/DevisList'

export default function DevisListPage() {
  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Devis</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez et suivez tous vos devis.</p>
      </div>
      <DevisList />
    </div>
  )
}
