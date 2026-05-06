import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, UserPlus, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Input from '../ui/Input'
import Button from '../ui/Button'

const schema = z.object({
  nom:     z.string().min(2, 'Nom requis'),
  email:   z.string().email('Email invalide').or(z.literal('')),
  tel:     z.string().optional(),
  adresse: z.string().optional(),
})

export default function StepClient({ data, onNext }) {
  const [search, setSearch]       = useState('')
  const [clients, setClients]     = useState([])
  const [searching, setSearching] = useState(false)
  const [mode, setMode]           = useState('search') // 'search' | 'new' | 'selected'
  const debounceRef               = useRef(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: data?.client || {},
  })

  useEffect(() => {
    if (data?.client) {
      reset(data.client)
      setMode('selected')
    }
  }, [])

  async function doSearch(term) {
    if (!term.trim()) { setClients([]); return }
    setSearching(true)
    const { data: rows } = await supabase
      .from('clients')
      .select('*')
      .ilike('nom', `%${term}%`)
      .limit(6)
    setClients(rows || [])
    setSearching(false)
  }

  function selectClient(client) {
    reset(client)
    setMode('selected')
    setSearch('')
    setClients([])
  }

  function onSubmit(values) {
    onNext({ client: values })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Client</h2>
        <p className="text-sm text-gray-500 mt-1">Recherchez un client existant ou créez-en un nouveau.</p>
      </div>

      {/* Recherche */}
      {mode === 'search' && (
        <div className="relative">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => {
                const val = e.target.value
                setSearch(val)
                clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => doSearch(val), 300)
              }}
              placeholder="Rechercher un client par nom…"
              className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {clients.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {clients.map(c => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectClient(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{c.nom}</p>
                    <p className="text-xs text-gray-500">{c.email} {c.tel && `· ${c.tel}`}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Nouveau client */}
      {mode === 'search' && (
        <button
          type="button"
          onClick={() => setMode('new')}
          className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <UserPlus size={15} />
          Nouveau client
        </button>
      )}

      {/* Formulaire client */}
      {(mode === 'new' || mode === 'selected') && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mode === 'selected' && (
            <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <span className="text-sm text-primary-700 font-medium">Client sélectionné</span>
              <button
                type="button"
                onClick={() => { setMode('search'); reset({}) }}
                className="text-xs text-primary-600 hover:text-primary-800 underline"
              >
                Changer
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Nom / Raison sociale *" placeholder="Dupont Maçonnerie" error={errors.nom?.message} {...register('nom')} />
            </div>
            <Input label="Email" type="email" placeholder="contact@exemple.fr" error={errors.email?.message} {...register('email')} />
            <Input label="Téléphone" type="tel" placeholder="06 12 34 56 78" {...register('tel')} />
            <div className="sm:col-span-2">
              <Input label="Adresse" placeholder="12 rue des Artisans, 69000 Lyon" {...register('adresse')} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">
              Suivant <ChevronRight size={15} />
            </Button>
          </div>
        </form>
      )}

      {mode === 'search' && (
        <p className="text-xs text-gray-400">
          {searching ? 'Recherche…' : 'Tapez pour rechercher ou créez un nouveau client.'}
        </p>
      )}
    </div>
  )
}
