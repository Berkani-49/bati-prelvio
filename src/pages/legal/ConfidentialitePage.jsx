import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8">
          <ArrowLeft size={15} /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : mai 2026 — conforme au RGPD (Règlement UE 2016/679) et à la loi belge du 30 juillet 2018</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement de vos données personnelles est <strong>Prelvio</strong>,
              indépendant établi à Charleroi, Belgique.
              Contact : <a href="mailto:info@prelvio.com" className="text-blue-600">info@prelvio.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Données collectées et finalités</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Donnée</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Finalité</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Base légale</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-2">Email & mot de passe</td>
                    <td className="px-4 py-2">Authentification</td>
                    <td className="px-4 py-2">Exécution du contrat</td>
                    <td className="px-4 py-2">Durée du compte</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Données entreprise (nom, BCE, adresse, tél)</td>
                    <td className="px-4 py-2">Génération des PDF devis/factures</td>
                    <td className="px-4 py-2">Exécution du contrat</td>
                    <td className="px-4 py-2">Durée du compte</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Données clients (nom, email, tél, adresse)</td>
                    <td className="px-4 py-2">Création de devis et factures</td>
                    <td className="px-4 py-2">Intérêt légitime</td>
                    <td className="px-4 py-2">Durée du compte + 7 ans</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Devis & factures (montants, prestations)</td>
                    <td className="px-4 py-2">Gestion commerciale</td>
                    <td className="px-4 py-2">Obligation légale (comptabilité)</td>
                    <td className="px-4 py-2">7 ans (Code des sociétés belge)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Sous-traitants et transferts</h2>
            <p>Vos données sont traitées par les sous-traitants suivants, qui offrent des garanties suffisantes au titre du RGPD :</p>
            <ul className="mt-3 space-y-3 list-none pl-0">
              <li className="p-3 bg-gray-50 rounded-lg">
                <strong>Supabase Inc.</strong> — Authentification et base de données.<br />
                <span className="text-gray-500 text-xs">Données hébergées dans l'UE. DPA disponible sur supabase.com/legal/dpa</span>
              </li>
              <li className="p-3 bg-gray-50 rounded-lg">
                <strong>Vercel Inc.</strong> — Hébergement de l'application front-end.<br />
                <span className="text-gray-500 text-xs">Réseau Edge mondial. DPA disponible sur vercel.com/legal/dpa</span>
              </li>
              <li className="p-3 bg-gray-50 rounded-lg">
                <strong>Brevo (Sendinblue SAS)</strong> — Envoi d'emails transactionnels (devis, factures).<br />
                <span className="text-gray-500 text-xs">Société française, données hébergées en Europe. Certifié ISO 27001.</span>
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              Aucune donnée n'est vendue ou transmise à des tiers à des fins commerciales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Cookies et stockage local</h2>
            <p>
              Bati Prelvio utilise <strong>exclusivement des cookies de session strictement nécessaires</strong> au
              fonctionnement de l'authentification (Supabase Auth). Ces cookies ne peuvent pas être désactivés
              sans empêcher le fonctionnement du service.
            </p>
            <p className="mt-2">
              Certaines données de configuration sont stockées dans le <strong>localStorage</strong> de votre navigateur.
              Vous pouvez les effacer via les paramètres de votre navigateur.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Aucun cookie analytique, publicitaire ou de tracking tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Sécurité</h2>
            <ul className="space-y-1 list-disc pl-4">
              <li>Authentification gérée par Supabase Auth (mots de passe hachés)</li>
              <li>Accès aux données limité par Row Level Security — chaque utilisateur ne voit que ses propres données</li>
              <li>Communications chiffrées via HTTPS/TLS</li>
              <li>Clés API stockées côté serveur (Edge Function), jamais exposées au client</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Vos droits (RGPD Art. 15-22)</h2>
            <p>Conformément au RGPD et à la loi belge du 30 juillet 2018, vous disposez des droits suivants :</p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                ['Droit d\'accès (Art. 15)', 'Obtenir une copie de vos données'],
                ['Droit de rectification (Art. 16)', 'Corriger vos informations depuis la page Paramètres'],
                ['Droit à l\'effacement (Art. 17)', 'Supprimer votre compte depuis Paramètres — toutes vos données sont supprimées immédiatement'],
                ['Droit à la portabilité (Art. 20)', 'Recevoir vos données dans un format structuré'],
                ['Droit d\'opposition (Art. 21)', 'Vous opposer à un traitement basé sur l\'intérêt légitime'],
              ].map(([droit, desc]) => (
                <li key={droit} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-600 font-medium text-sm whitespace-nowrap">{droit}</span>
                  <span className="text-sm text-gray-600">{desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Pour exercer ces droits : <a href="mailto:info@prelvio.com" className="text-blue-600">info@prelvio.com</a>.
              Nous répondons dans un délai maximum de <strong>30 jours</strong>.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Vous pouvez également introduire une réclamation auprès de l'
              <strong>APD — Autorité de Protection des Données</strong> (autorité de contrôle belge) :{' '}
              <a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener noreferrer" className="text-blue-600">
                autoriteprotectiondonnees.be
              </a>
              {' '}— Rue de la Presse 35, 1000 Bruxelles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Contact</h2>
            <p>
              Toute demande relative à vos données personnelles :{' '}
              <a href="mailto:info@prelvio.com" className="text-blue-600">info@prelvio.com</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-6 text-sm text-gray-400">
          <Link to="/mentions-legales" className="hover:text-gray-700">Mentions légales</Link>
          <Link to="/cgu" className="hover:text-gray-700">CGU</Link>
        </div>
      </div>
    </div>
  )
}
