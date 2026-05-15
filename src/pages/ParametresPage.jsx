import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Save, Trash2, Upload, X, Users, UserPlus, Mail, CheckCircle, Clock, Zap, Crown, Wrench, Bell, BellOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { usePushNotifications } from '../hooks/usePushNotifications'
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
  metier:  z.enum(['plombier', 'electricien', 'autre']).optional().default('autre'),
})

function syncLocalStorage(data) {
  localStorage.setItem('cp_nom',     data.nom     || '')
  localStorage.setItem('cp_email',   data.email   || '')
  localStorage.setItem('cp_tel',     data.tel     || '')
  localStorage.setItem('cp_adresse', data.adresse || '')
  localStorage.setItem('cp_siret',   data.siret   || '')
  localStorage.setItem('cp_metier',  data.metier  || 'autre')
}

export default function ParametresPage() {
  const { user, deleteAccount }   = useAuth()
  const navigate                  = useNavigate()
  const fileInputRef              = useRef(null)
  const { isPro, loading: subLoading } = useSubscription()
  const { supported: pushSupported, subscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications(user?.id)
  const [portalLoading, setPortalLoading]    = useState(false)

  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [logoUrl, setLogoUrl]           = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Équipe
  const [membres, setMembres]         = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting]       = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', email: '', tel: '', adresse: '', siret: '', metier: 'autre' },
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('entreprise')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        reset({ nom: data.nom || '', email: data.email || '', tel: data.tel || '', adresse: data.adresse || '', siret: data.siret || '', metier: data.metier || 'autre' })
        syncLocalStorage(data)
        if (data.logo_url) setLogoUrl(data.logo_url)
      }
      setLoading(false)
    }
    if (user) load()
  }, [user, reset])

  useEffect(() => {
    if (user) fetchMembres()
  }, [user?.id])

  async function fetchMembres() {
    const { data } = await supabase
      .from('equipe_membres')
      .select('id, member_email, role, statut, created_at')
      .eq('owner_id', user.id)
      .order('created_at')
    setMembres(data || [])
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { member_email: inviteEmail.trim() },
      })
      if (error || data?.error) throw new Error(data?.error || error?.message)
      toast.success(`Invitation envoyée à ${inviteEmail}`)
      setInviteEmail('')
      fetchMembres()
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMembre(id) {
    const { error } = await supabase.from('equipe_membres').delete().eq('id', id)
    if (error) { toast.error('Erreur suppression'); return }
    setMembres(prev => prev.filter(m => m.id !== id))
    toast.success('Collaborateur retiré')
  }

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

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal')
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch {
      toast.error('Impossible d\'ouvrir le portail de facturation.')
    } finally {
      setPortalLoading(false)
    }
  }

  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    if (pwForm.next.length < 8) { toast.error('Mot de passe trop court (min 8 caractères)'); return }
    if (pwForm.next !== pwForm.confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) throw error
      toast.success('Mot de passe mis à jour')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setPwSaving(false)
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
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
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

        {/* Métier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Wrench size={13} className="text-gray-400" /> Votre métier
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'plombier',    label: 'Plombier',    emoji: '🔧' },
              { value: 'electricien', label: 'Électricien', emoji: '⚡' },
              { value: 'autre',       label: 'Autre BTP',   emoji: '🏗️' },
            ].map(opt => {
              const selected = watch('metier') === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('metier', opt.value, { shouldDirty: true })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    selected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              )
            })}
          </div>
          <input type="hidden" {...register('metier')} />
          <p className="text-xs text-gray-400 mt-1.5">Personnalise votre catalogue de prestations dans les devis.</p>
        </div>

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

      <div className="card p-5 bg-orange-50 border-orange-100">
        <p className="text-sm text-orange-800 font-medium mb-1">À savoir</p>
        <p className="text-sm text-orange-700">Le logo, numéro BCE, email, téléphone et adresse sont utilisés automatiquement sur vos PDF.</p>
      </div>

      {/* Section Équipe */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600" />
          <h2 className="section-title">Équipe</h2>
        </div>
        <p className="text-sm text-gray-500">
          Invitez des collaborateurs pour qu'ils accèdent à votre espace (devis, chantiers, factures).
        </p>

        {/* Liste des membres */}
        {membres.length > 0 && (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {membres.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-white">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    m.statut === 'actif' ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {m.statut === 'actif'
                      ? <CheckCircle size={14} className="text-green-600" />
                      : <Clock size={14} className="text-amber-600" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.member_email}</p>
                    <p className="text-xs text-gray-400">
                      {m.statut === 'actif' ? 'Actif' : 'Invitation en attente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMembre(m.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Retirer"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire invitation */}
        <form onSubmit={handleInvite} className="flex gap-2">
          <div className="flex-1 relative">
            <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@collaborateur.fr"
              required
              className="w-full h-9 pl-8 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button type="submit" size="sm" loading={inviting}>
            <UserPlus size={14} /> Inviter
          </Button>
        </form>
        <p className="text-xs text-gray-400">
          Le collaborateur recevra un email avec un lien pour rejoindre votre espace.
        </p>
      </div>

      {/* Abonnement */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Abonnement</h2>
          {!subLoading && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isPro ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
              {isPro ? <Crown size={12} /> : <Zap size={12} />}
              {isPro ? 'Plan Pro' : 'Plan Gratuit'}
            </span>
          )}
        </div>

        {subLoading ? (
          <Spinner size={18} />
        ) : isPro ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Vous bénéficiez de toutes les fonctionnalités Pro : devis illimités, chantiers, facturation et logo sur PDF.</p>
            <button
              type="button"
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {portalLoading ? <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" /> : <Crown size={14} />}
              Gérer mon abonnement
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Vous êtes sur le plan gratuit (10 devis / 3 factures par mois). Passez Pro pour tout débloquer.</p>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              <Zap size={14} />
              Passer en Pro — 29 €/mois
            </button>
          </div>
        )}
      </div>

      {/* Notifications push */}
      {pushSupported && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="section-title mb-1">Notifications push</h2>
              <p className="text-sm text-gray-500">
                Recevez des alertes sur votre téléphone : factures en retard, devis sans réponse.
              </p>
              {pushSubscribed && (
                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  <Bell size={12} /> Notifications activées
                </p>
              )}
            </div>
            <button
              onClick={pushSubscribed ? pushUnsubscribe : pushSubscribe}
              disabled={pushLoading}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                pushSubscribed
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {pushLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : pushSubscribed ? (
                <><BellOff size={15} /> Désactiver</>
              ) : (
                <><Bell size={15} /> Activer</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Changer mot de passe */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Mot de passe</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="form-label">Nouveau mot de passe</label>
            <input
              type="password"
              value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              placeholder="Min. 8 caractères"
              className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="form-label">Confirmer le mot de passe</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Répétez le mot de passe"
              className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button type="submit" size="sm" loading={pwSaving} disabled={!pwForm.next || !pwForm.confirm}>
            <Save size={14} /> Changer le mot de passe
          </Button>
        </form>
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
