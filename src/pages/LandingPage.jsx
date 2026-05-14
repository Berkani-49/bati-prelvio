import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './LandingPage.css'

export default function LandingPage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    document.title = 'Bati Prelvio — Logiciel de gestion pour plombiers et électriciens'
    return () => { document.title = 'Bati Prelvio' }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    )

    document
      .querySelectorAll(
        '.cp-landing .feature-card, .cp-landing .stat-item, .cp-landing .step, .cp-landing .pricing-card'
      )
      .forEach((el) => {
        el.style.opacity = '0'
        el.style.transform = 'translateY(24px)'
        el.style.transition = 'opacity 0.55s ease-out, transform 0.55s ease-out'
        observer.observe(el)
      })

    return () => observer.disconnect()
  }, [])

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="cp-landing">
      {/* NAV */}
      <nav>
        <Link to="/" className="lp-logo">
          <div className="lp-logo-icon">🏗️</div>
          <span>Bati Prelvio</span>
        </Link>
        <ul className="nav-links">
          <li><a href="#fonctionnalites">Fonctionnalités</a></li>
          <li><a href="#comment">Comment ça marche</a></li>
          <li><a href="#tarifs">Tarifs</a></li>
        </ul>
        <div className="nav-actions">
          <Link to="/login" className="lp-login-link">Connexion</Link>
          <Link to="/login" className="lp-cta-btn">Essai gratuit</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="accueil">
        <div className="hero-content">
          <div className="hero-text">
            <div className="lp-badge">🔧 Conçu pour les plombiers et électriciens</div>
            <h1>
              Fini la paperasse,<br />place aux <span className="gradient-text">chantiers</span>
            </h1>
            <p>
              Bati Prelvio est le logiciel de gestion pensé pour les artisans plombiers et électriciens.
              Devis professionnels en 2 minutes, suivi de chantier, facturation — tout en un, sans complication.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="lp-cta-btn">Commencer gratuitement</Link>
              <a href="#fonctionnalites" className="lp-secondary-btn">Voir les fonctionnalités</a>
            </div>
            <div className="trust-row">
              <span>Sans carte bancaire</span>
              <span>Gratuit 30 jours</span>
              <span>PDF professionnel inclus</span>
              <span>Catalogue plomberie / électricité</span>
            </div>
          </div>

          <div className="hero-visual">
            <div style={{ position: 'relative' }}>
              <div className="dashboard-mockup">
                <div className="mockup-topbar">
                  <div className="dot dot-red" />
                  <div className="dot dot-yellow" />
                  <div className="dot dot-green" />
                  <span className="mockup-topbar-title">batiprelvio.vercel.app/dashboard</span>
                </div>
                <div className="mockup-body">
                  <div className="mockup-header">
                    <h4>Tableau de bord</h4>
                    <span className="month-badge">Mai 2026</span>
                  </div>
                  <div className="mockup-stats">
                    <div className="mockup-stat">
                      <div className="mockup-stat-label">CA ce mois</div>
                      <div className="mockup-stat-value blue">14 850 €</div>
                    </div>
                    <div className="mockup-stat">
                      <div className="mockup-stat-label">En attente</div>
                      <div className="mockup-stat-value">4 devis</div>
                    </div>
                    <div className="mockup-stat">
                      <div className="mockup-stat-label">Acceptés</div>
                      <div className="mockup-stat-value green">5</div>
                    </div>
                  </div>
                  <div className="mockup-table-header">
                    <span>N°</span>
                    <span>Client</span>
                    <span>Montant</span>
                    <span>Statut</span>
                  </div>
                  <div className="mockup-row">
                    <span>DEV-031</span>
                    <span>M. Bernard</span>
                    <span>1 680 €</span>
                    <span><span className="status-badge accepted">Accepté</span></span>
                  </div>
                  <div className="mockup-row">
                    <span>DEV-030</span>
                    <span>Mme Fontaine</span>
                    <span>850 €</span>
                    <span><span className="status-badge sent">Envoyé</span></span>
                  </div>
                  <div className="mockup-row">
                    <span>DEV-029</span>
                    <span>Résid. Les Pins</span>
                    <span>4 200 €</span>
                    <span><span className="status-badge accepted">Accepté</span></span>
                  </div>
                  <div className="mockup-row">
                    <span>DEV-028</span>
                    <span>M. Lacroix</span>
                    <span>560 €</span>
                    <span><span className="status-badge draft">Brouillon</span></span>
                  </div>
                </div>
              </div>
              <div className="mockup-floating">
                <div className="mockup-floating-label">Devis accepté ✓</div>
                <div className="mockup-floating-value">+1 680 €</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">2 min</div>
            <div className="stat-label">Pour créer un devis complet</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Données sécurisées (Supabase)</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">0 €</div>
            <div className="stat-label">Pour démarrer</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">PDF</div>
            <div className="stat-label">Généré & envoyé automatiquement</div>
          </div>
        </div>
      </section>

      {/* METIERS BANNER */}
      <section className="metiers-banner">
        <div className="metiers-banner-inner">
          <div className="metier-pill">
            <span className="metier-emoji">🔧</span>
            <div>
              <strong>Plombiers</strong>
              <p>Remplacement chauffe-eau, débouchage, installation sanitaires — votre catalogue en 1 clic.</p>
            </div>
          </div>
          <div className="metier-divider" />
          <div className="metier-pill">
            <span className="metier-emoji">⚡</span>
            <div>
              <strong>Électriciens</strong>
              <p>Tableau électrique, bornes de recharge, VMC, mise en conformité — devis prêts en 2 min.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="fonctionnalites">
        <div className="section-header">
          <h2>Tout ce dont vous avez <span className="gradient-text">besoin</span></h2>
          <p>Des outils pensés pour les artisans plombiers et électriciens, pas pour les comptables.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Catalogue métier intégré</h3>
            <p>Plus de 40 prestations pré-remplies pour plombiers et électriciens. Insérez une ligne en un clic, ajustez le prix et c'est parti.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>PDF professionnel</h3>
            <p>Générez un devis ou une facture à vos couleurs avec logo, coordonnées et tableau des prestations — en un clic.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✉️</div>
            <h3>Envoi email automatique</h3>
            <p>Le PDF part directement par email à votre client depuis l'application. Pas de copier-coller, pas de pièce jointe manuelle.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏗️</div>
            <h3>Suivi des chantiers</h3>
            <p>Gérez chaque intervention : dates, avancement, tâches, journal de chantier. Tout au même endroit.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Facturation en 1 clic</h3>
            <p>Transformez un devis accepté en facture instantanément. Suivez les paiements et relancez les impayés.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Tableau de bord</h3>
            <p>CA mensuel, devis en attente, chantiers en cours, alertes véhicules — tout votre business en un coup d'œil.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="comment">
        <div className="section-header">
          <h2>Comment ça <span className="gradient-text">marche</span> ?</h2>
          <p>Opérationnel en moins de 5 minutes, sans formation, sans installation.</p>
        </div>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Créez votre compte</h3>
            <p>Inscription gratuite en 30 secondes. Choisissez votre métier (plombier ou électricien) pour activer le bon catalogue de prestations.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Choisissez dans votre catalogue</h3>
            <p>Lors du devis, cliquez sur "Catalogue métier" et sélectionnez vos prestations pré-remplies. Ajustez les quantités et les prix.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Envoyez le PDF par email</h3>
            <p>Prévisualisez le PDF professionnel, puis envoyez-le en un clic. Votre client reçoit un email soigné avec le devis en pièce jointe.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="tarifs">
        <div className="section-header">
          <h2>Des tarifs <span className="gradient-text">simples</span></h2>
          <p>Commencez gratuitement, passez Pro quand vous en avez besoin.</p>
        </div>
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="pricing-name">Gratuit</div>
            <div className="pricing-price">0 € <span>/ mois</span></div>
            <div className="pricing-description">Pour tester et démarrer.</div>
            <ul className="pricing-features">
              <li>5 devis par mois</li>
              <li>Génération PDF</li>
              <li>Envoi email</li>
              <li>Tableau de bord</li>
              <li className="muted">Chantiers illimités</li>
              <li className="muted">Facturation</li>
              <li className="muted">Logo entreprise sur PDF</li>
            </ul>
            <Link to="/login" className="pricing-cta secondary">Commencer gratuitement</Link>
          </div>

          <div className="pricing-card popular">
            <div className="popular-badge">Le plus populaire</div>
            <div className="pricing-name">Pro</div>
            <div className="pricing-price">29 € <span>/ mois</span></div>
            <div className="pricing-description">Pour les artisans actifs. Tout inclus.</div>
            <ul className="pricing-features">
              <li>Devis illimités</li>
              <li>Génération PDF personnalisé</li>
              <li>Envoi email automatique</li>
              <li>Tableau de bord avancé</li>
              <li>Gestion des chantiers</li>
              <li>Facturation complète</li>
              <li>Logo entreprise sur PDF</li>
            </ul>
            <Link to="/checkout" className="pricing-cta primary">Essayer 30 jours gratuit</Link>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <h2>Prêt à passer à la vitesse supérieure ?</h2>
        <p>
          Rejoignez les plombiers et électriciens qui gèrent leurs devis, chantiers et factures avec Bati Prelvio.
          Démarrez gratuitement, sans carte bancaire.
        </p>
        <Link to="/login" className="lp-cta-btn">Créer mon compte gratuit</Link>
        <p className="cta-note">Essai 30 jours — Sans engagement — Sans carte bancaire</p>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <div className="footer-logo-icon">🔧</div>
          <span>Bati Prelvio</span>
        </div>
        <p>© 2026 Bati Prelvio — Logiciel de gestion pour plombiers et électriciens. Tous droits réservés.</p>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
          <Link to="/mentions-legales" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>Mentions légales</Link>
          <Link to="/confidentialite" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>Politique de confidentialité</Link>
          <Link to="/cgu" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>CGU</Link>
          <a href="mailto:info@prelvio.com" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>Contact</a>
        </div>
      </footer>
    </div>
  )
}
