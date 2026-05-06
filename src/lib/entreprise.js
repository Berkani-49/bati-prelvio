import { supabase } from './supabase'

export async function getEntrepriseData() {
  const { data } = await supabase
    .from('entreprise')
    .select('nom, email, tel, adresse, siret, logo_url')
    .single()

  if (data) return data

  return {
    nom:      localStorage.getItem('cp_nom')     || 'Votre Entreprise',
    email:    localStorage.getItem('cp_email')   || '',
    tel:      localStorage.getItem('cp_tel')     || '',
    adresse:  localStorage.getItem('cp_adresse') || '',
    siret:    localStorage.getItem('cp_siret')   || '',
    logo_url: null,
  }
}

export async function fetchLogoBase64(logoUrl) {
  if (!logoUrl) return null
  try {
    const res  = await fetch(logoUrl)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror  = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
