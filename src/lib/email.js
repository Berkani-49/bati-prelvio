import { supabase } from './supabase'

async function callEdgeFunction(payload) {
  const { data, error } = await supabase.functions.invoke('send-email', { body: payload })
  if (error) throw new Error(error.message || 'Erreur envoi email')
  if (data?.error) throw new Error(data.error)
  return data
}

export async function sendDevisEmail({ to, clientName, devisNumero, pdfBase64 }) {
  return callEdgeFunction({ type: 'devis', to, clientName, numero: devisNumero, pdfBase64 })
}

export async function sendFactureEmail({ to, clientName, factureNumero, pdfBase64 }) {
  return callEdgeFunction({ type: 'facture', to, clientName, numero: factureNumero, pdfBase64 })
}

export async function sendRelanceEmail({ to, clientName, factureNumero, pdfBase64, montantTTC, dateEcheance }) {
  return callEdgeFunction({ type: 'relance', to, clientName, numero: factureNumero, pdfBase64, montantTTC, dateEcheance })
}

export async function sendSignatureRequestEmail({ to, clientName, devisNumero, signingUrl }) {
  return callEdgeFunction({ type: 'signature_request', to, clientName, numero: devisNumero, signingUrl })
}
