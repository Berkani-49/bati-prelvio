import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Save, Trash2, Upload, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ConfirmModal from '../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const schema = z.object({
  nom:     z.string().min(1, 'Nom obligatoire'),
  email:   z.string().email('Email invalide').or(z.literal('')),
  tel:     z.string().optional().default(''),
  adresse: z.string().optional().default(''),
  siret:   z.string().optional().default(''),
})

function syncLocalStorage(data) {
  localStorage.setItem('cp_nom',     data.nom     || '')
  localStorage.setItem('cp_email',   data.email   || '')
  localStorage.setItem('cp_tel',     data.tel     || '')
  localStorage.setItem('cp_adresse', data.adresse || '')
  localStorage.setItem('cp_siret',   data.siret   || '')
}

export default function ParametresPage() {
  const { user, deleteAccount }   = useAuth()
  const navigate                  = useNavigate()
  const fileInputRef              = useRef(null)

  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [logoUrl, setLogoUrl]           = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', email: '', tel: '', adresse: '', siret: '' },
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('entreprise')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        reset({ nom: data.nom || '', email: data.email || '', tel: data.tel || '', adresse: data.adresse || '', siret: data.siret || '' })
        syncLocalStorage(data)
        if (data.logo_url) setLogoUrl(data.logo_url)
      }
      setLoading(false)
    }
    if (user) load()
  }, [user, reset])

  async function onSubmit(formData) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('entreprise')
        .upsert({ user_id: user.id, ...formData }, { onConflict: 'user_id' })
      if (error) throw error
      syncLocalStorage(formData)
      toast.success('Paramètres enregistrés')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo trop lourd (max 2 MB)'); return }
    if (!file.type.startsWith('image/')) { toast.error('Format non supporté'); return }

    setUploadingLogo(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/logo.${ext}`

      const { error: upErr } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

      const { error: dbErr } = await supabase
        .from('entreprise')
        .upsert({ user_id: user.id, logo_url: publicUrl }, { onConflict: 'user_id' })
      if (dbErr) throw dbErr

      setLogoUrl(publicUrl + `?t=${Date.now()}`)
      toast.success('Logo mis à jour')
    } catch (err) {
      toast.error(err.message || 'Erreur upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleLogoDelete() {
    try {
      await supabase.storage.from('logos').remove([`${user.id}/logo.png`, `${user.id}/logo.jpg`, `${user.id}/logo.jpeg`, `${user.id}/logo.webp`])
      await supabase.from('entreprise').update({ logo_url: null }).eq('user_id', user.id)
      setLogoUrl(null)
      toast.success('Logo supprimé')
    } catch (err) {
      toast.error(err.message || 'Erreur suppression logo')
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Compte supprimé')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression')
      setDeleting(false)
    }
    setConfirmDelete(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl">
          <Building2 size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ces informations apparaissent sur vos devis et factures PDF</p>
        </div>
      </div>

      {/* Logo */}
      <div className="card p-5 space-y-3">
        <h2 className="section-title">Logo entreprise</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
              : <Upload size={20} className="text-gray-300" />
            }
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">PNG, JPG ou WebP · Max 2 MB</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploadingLogo}>
                <Upload size={13} /> {logoUrl ? 'Changer' : 'Importer'}
              </Button>
              {logoUrl && (
                <button onClick={handleLogoDelete} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      </div>

      {/* Informations */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <h2 className="section-title">Informations entreprise</h2>
        <Input label="Nom de l'entreprise *" placeholder="Bâti Pro SARL" error={errors.nom?.message} {...register('nom')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Numéro BCE" placeholder="0XXX.XXX.XXX" {...register('siret')} />
          <Input label="Téléphone" type="tel" placeholder="06 12 34 56 78" {...register('tel')} />
        </div>
        <Input label="Email professionnel" type="email" placeholder="contact@votreentreprise.fr" error={errors.email?.message} {...register('email')} />
        <Input label="Adresse" placeholder="12 rue de la Paix, 6000 Charleroi" {...register('adresse')} />
        <div className="pt-2 border-t border-gray-100">
          <Button type="submit" loading={saving}><Save size={14} /> Enregistrer les paramètres</Button>
        </div>
      </form>

      <div className="card p-5 bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-800 font-medium mb-1">💡 À savoir</p>
        <p className="text-sm text-blue-700">Le logo, numéro BCE, email, téléphone et adresse sont utilisés automatiquement sur vos PDF.</p>
      </div>

      {/* Zone danger */}
      <div className="card p-6 border border-red-100">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Zone de danger</h2>
        <p className="text-sm text-gray-500 mb-4">
          La suppression de votre compte est <strong>définitive et irréversible</strong>.
          Toutes vos données seront supprimées (RGPD Art. 17).
        </p>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {deleting ? 'Suppression en cours…' : 'Supprimer mon compte'}
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer définitivement votre compte ?"
          message="Cette action est irréversible. Toutes vos données seront supprimées immédiatement."
          confirmLabel="Oui, supprimer mon compte"
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
