import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8">
          <ArrowLeft size={15} /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions légales</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : mai 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Éditeur du site</h2>
            <p>Le site <strong>Bati Prelvio</strong> (accessible à l'adresse bati-prelvio.vercel.app) est édité par :</p>
            <ul className="mt-2 space-y-1 list-none pl-0">
              <li><strong>Raison sociale :</strong> Prelvio</li>
              <li><strong>Forme juridique :</strong> Indépendant (personne physique)</li>
              <li><strong>Numéro d'entreprise BCE :</strong> [À COMPLÉTER — format 0XXX.XXX.XXX]</li>
              <li><strong>Numéro de TVA :</strong> BE + numéro BCE (si assujetti)</li>
              <li><strong>Adresse :</strong> Charleroi, Belgique</li>
              <li><strong>Email :</strong> <a href="mailto:info@prelvio.com" className="text-blue-600">info@prelvio.com</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Responsable de la publication</h2>
            <p>[À COMPLÉTER — Prénom Nom, en qualité de responsable de l'entreprise]</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Hébergement</h2>
            <p>Le site est hébergé par :</p>
            <ul className="mt-2 space-y-2 list-none pl-0">
              <li>
                <strong>Vercel Inc.</strong> — 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis
                (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600">vercel.com</a>)
                — hébergement front-end
              </li>
              <li>
                <strong>Supabase Inc.</strong> — 970 Toa Payoh North #07-04, Singapour
                (<a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600">supabase.com</a>)
                — base de données et authentification (données hébergées dans l'UE)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble des éléments constituant ce site (textes, logos, images, interface)
              sont la propriété exclusive de Prelvio et sont protégés par le droit d'auteur belge
              (Loi du 30 juin 1994 relative au droit d'auteur et aux droits voisins).
              Toute reproduction, représentation, modification ou diffusion sans autorisation expresse est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Limitation de responsabilité</h2>
            <p>
              Bati Prelvio s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées.
              Cependant, nous ne saurions être tenus responsables des erreurs, omissions ou résultats
              obtenus par mauvais usage des informations fournies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Contact</h2>
            <p>
              Pour toute question relative au présent site :{' '}
              <a href="mailto:info@prelvio.com" className="text-blue-600">info@prelvio.com</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-6 text-sm text-gray-400">
          <Link to="/confidentialite" className="hover:text-gray-700">Politique de confidentialité</Link>
          <Link to="/cgu" className="hover:text-gray-700">CGU</Link>
        </div>
      </div>
    </div>
  )
}
