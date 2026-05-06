import { supabase } from './supabase'

export async function getEntrepriseData() {
  const { data } = await supabase
    .from('entreprise')
    .select('nom, email, tel, adresse, siret')
    .single()

  if (data) return data

  return {
    nom:     localStorage.getItem('cp_nom')     || 'Votre Entreprise',
    email:   localStorage.getItem('cp_email')   || '',
    tel:     localStorage.getItem('cp_tel')     || '',
    adresse: localStorage.getItem('cp_adresse') || '',
    siret:   localStorage.getItem('cp_siret')   || '',
  }
}
