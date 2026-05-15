import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8">
          <ArrowLeft size={15} /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : mai 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
              du service <strong>Bati Prelvio</strong>, logiciel de gestion de devis, chantiers et facturation
              destiné aux artisans et PME du bâtiment, édité par Prelvio (indépendant établi en Belgique).
            </p>
            <p className="mt-2">
              En créant un compte, vous acceptez sans réserve les présentes CGU dans leur intégralité.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Accès au service</h2>
            <ul className="space-y-2 list-disc pl-4">
              <li>Le service est accessible après création d'un compte (email + mot de passe).</li>
              <li>L'accès est personnel et non cessible.</li>
              <li>Vous êtes responsable de la confidentialité de vos identifiants.</li>
              <li>Bati Prelvio se réserve le droit de suspendre un compte en cas d'usage abusif ou frauduleux.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Utilisation du service</h2>
            <p>Le service Bati Prelvio est fourni à des fins professionnelles uniquement. Il est interdit de :</p>
            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>Utiliser le service à des fins illicites ou contraires aux bonnes mœurs</li>
              <li>Tenter d'accéder aux données d'autres utilisateurs</li>
              <li>Reproduire, copier ou exploiter tout ou partie du service sans autorisation</li>
              <li>Utiliser des robots ou scripts automatisés non autorisés</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Données et responsabilité</h2>
            <p>
              Vous êtes seul responsable des données que vous saisissez (informations clients, montants, prestations).
              Bati Prelvio agit en qualité de <strong>sous-traitant</strong> au sens du RGPD pour les données de
              vos clients — vous en êtes le responsable du traitement.
            </p>
            <p className="mt-2">
              Bati Prelvio ne saurait être tenu responsable de pertes de données liées à une mauvaise
              utilisation du service ou à une défaillance technique indépendante de sa volonté.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Tarification et facturation</h2>
            <ul className="space-y-2 list-disc pl-4">
              <li>Un plan gratuit est disponible avec des fonctionnalités limitées.</li>
              <li>Le plan Pro est payant selon les tarifs indiqués sur la page d'accueil.</li>
              <li>Les prix sont indiqués en euros HTVA (hors TVA belge applicable).</li>
              <li>Tout abonnement est résilié à la demande de l'utilisateur — aucun renouvellement automatique sans consentement explicite.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Disponibilité du service</h2>
            <p>
              Bati Prelvio s'efforce de maintenir le service accessible 24h/24, 7j/7.
              Des interruptions peuvent survenir pour maintenance ou en cas de force majeure.
              Nous ne garantissons pas une disponibilité sans interruption.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Résiliation et suppression du compte</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis la page <strong>Paramètres</strong>.
              La suppression entraîne l'effacement définitif de toutes vos données (clients, devis, chantiers,
              factures), sous réserve des obligations légales de conservation comptable (7 ans conformément
              au Code des sociétés et associations belge).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Propriété intellectuelle</h2>
            <p>
              Le service Bati Prelvio, son code, son interface et ses contenus sont la propriété de Prelvio
              et protégés par la loi belge du 30 juin 1994 relative au droit d'auteur.
              L'utilisateur bénéficie d'une licence d'utilisation personnelle, non exclusive et non transférable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Modification des CGU</h2>
            <p>
              Bati Prelvio se réserve le droit de modifier les présentes CGU. En cas de modification
              substantielle, vous serez informé par email au moins 15 jours avant l'entrée en vigueur
              des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont soumises au <strong>droit belge</strong>. En cas de litige,
              et à défaut de résolution amiable, les <strong>tribunaux de l'arrondissement judiciaire de
              Charleroi</strong> seront seuls compétents.
            </p>
            <p className="mt-2">
              Contact : <a href="mailto:info@prelvio.com" className="text-orange-600">info@prelvio.com</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-6 text-sm text-gray-400">
          <Link to="/mentions-legales" className="hover:text-gray-700">Mentions légales</Link>
          <Link to="/confidentialite" className="hover:text-gray-700">Politique de confidentialité</Link>
        </div>
      </div>
    </div>
  )
}
