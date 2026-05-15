import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './LandingPage.css'

export default function LandingPage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    document.title = 'Bati Prelvio — Logiciel de gestion pour artisans du BTP'
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
      .querySelectorAll('.cp-landing .feature-card, .cp-landing .stat-item, .cp-landing .step, .cp-landing .pricing-card')
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
          <div className="lp-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
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
            <div className="lp-badge">
              <span className="badge-dot" />
              Nouveau : Planning d'équipe &amp; pointage terrain
            </div>
            <h1>
              Pilotez vos chantiers,<br />
              <span className="orange-text">boostez votre</span><br />
              <span className="orange-text">rentabilité</span> sans effort.
            </h1>
            <p>
              Devis, factures, chantiers, trésorerie — tout au même endroit.
              L'outil conçu par et pour les artisans du bâtiment, qui vous fait gagner 2h par jour.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="lp-cta-btn hero-cta">
                Démarrer mon essai gratuit <span className="btn-arrow">→</span>
              </Link>
              <a href="#comment" className="lp-secondary-btn">
                <span className="play-icon">▶</span> Voir comment ça marche
              </a>
            </div>
            <div className="trust-row">
              <span>Gratuit pour démarrer — sans carte bancaire</span>
              <span>Conforme facturation 2026</span>
              <span>Données hébergées en France</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="mockup-wrapper">

              {/* Floating revenue card (top right) */}
              <div className="mockup-float-revenue">
                <div className="float-revenue-icon">€</div>
                <div>
                  <div className="float-revenue-value">+12 340 €</div>
                  <div className="float-revenue-trend">+23% ce mois</div>
                </div>
              </div>

              {/* Main app mockup */}
              <div className="dashboard-mockup">
                <div className="mockup-topbar">
                  <div className="dot dot-red" />
                  <div className="dot dot-yellow" />
                  <div className="dot dot-green" />
                  <span className="mockup-topbar-title">app.batiprelvio.com/dashboard</span>
                </div>
                <div className="mockup-app">
                  {/* Sidebar */}
                  <div className="mockup-sidebar">
                    <div className="mockup-sidebar-logo">BP</div>
                    <div className="mockup-sidebar-label">GESTION</div>
                    <div className="mockup-nav-item active">
                      <span>⊞</span> Accueil
                    </div>
                    <div className="mockup-nav-item">
                      <span>◧</span> Devis &amp; Factures
                    </div>
                    <div className="mockup-nav-item new-badge-item">
                      <span>✦</span> Devis IA
                      <span className="nav-new">NEW</span>
                    </div>
                    <div className="mockup-nav-item">
                      <span>⬡</span> Chantiers
                    </div>
                    <div className="mockup-nav-item">
                      <span>◉</span> Clients
                    </div>
                    <div className="mockup-sidebar-label">ORGANISATION</div>
                    <div className="mockup-nav-item">
                      <span>▦</span> Planning
                    </div>
                    <div className="mockup-nav-item">
                      <span>⏱</span> Pointage
                    </div>
                    <div className="mockup-nav-item">
                      <span>◈</span> Trésorerie
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="mockup-main">
                    <div className="mockup-main-header">
                      <h4>Tableau de bord</h4>
                      <span className="month-badge">Mai 2026</span>
                    </div>
                    <div className="mockup-stats">
                      <div className="mockup-stat">
                        <div className="mockup-stat-label">CA ce mois</div>
                        <div className="mockup-stat-value orange-val">14 850 €</div>
                      </div>
                      <div className="mockup-stat">
                        <div className="mockup-stat-label">En attente</div>
                        <div className="mockup-stat-value">4 devis</div>
                      </div>
                      <div className="mockup-stat">
                        <div className="mockup-stat-label">Acceptés</div>
                        <div className="mockup-stat-value green-val">5</div>
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
                  </div>
                </div>
              </div>

              {/* Floating notification (bottom left) */}
              <div className="mockup-float-notif">
                <div className="notif-check">✓</div>
                <div>
                  <div className="notif-title">Devis #031 accepté</div>
                  <div className="notif-time">il y a 2 min</div>
                </div>
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
            <div className="stat-number">10</div>
            <div className="stat-label">Modules métier inclus</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">0 €</div>
            <div className="stat-label">Pour démarrer</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">2h</div>
            <div className="stat-label">Gagnées par jour en moyenne</div>
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
              <p>Chauffe-eau, débouchage, sanitaires — votre catalogue prêt en 1 clic.</p>
            </div>
          </div>
          <div className="metier-divider" />
          <div className="metier-pill">
            <span className="metier-emoji">⚡</span>
            <div>
              <strong>Électriciens</strong>
              <p>Tableau électrique, bornes, VMC, mise en conformité — devis en 2 min.</p>
            </div>
          </div>
          <div className="metier-divider" />
          <div className="metier-pill">
            <span className="metier-emoji">🧱</span>
            <div>
              <strong>Maçons &amp; Carreleurs</strong>
              <p>Chantiers de rénovation, suivi d'avancement, planning équipe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="fonctionnalites">
        <div className="section-header">
          <h2>Tout ce dont vous avez <span className="orange-text">besoin</span></h2>
          <p>Des outils pensés pour les artisans du BTP, pas pour les comptables.</p>
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
            <p>Gérez chaque intervention : dates, avancement, tâches, journal, photos. Tout au même endroit.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Facturation en 1 clic</h3>
            <p>Transformez un devis accepté en facture instantanément. Suivez les paiements et relancez les impayés automatiquement.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Planning équipe + pointage</h3>
            <p>Organisez vos équipes sur desktop et mobile. Exportez les heures en CSV pour la paie.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Trésorerie &amp; prévisions</h3>
            <p>CA mensuel, prévisions cumulatives, export Sage/EBP — pilotez votre business en temps réel.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Portail client sécurisé</h3>
            <p>Vos clients consultent devis et factures via un lien unique. Sans compte, sans friction.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚗</div>
            <h3>Véhicules &amp; matériel</h3>
            <p>Suivez votre parc, planifiez les révisions, attribuez véhicules et matériel par chantier.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="comment">
        <div className="section-header">
          <h2>Opérationnel en <span className="orange-text">5 minutes</span></h2>
          <p>Sans formation, sans installation, sans carte bancaire.</p>
        </div>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Créez votre compte</h3>
            <p>Inscription gratuite en 30 secondes. Choisissez votre métier pour activer le bon catalogue de prestations.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Créez votre premier devis</h3>
            <p>Cliquez sur "Catalogue métier", sélectionnez vos prestations pré-remplies. Ajustez quantités et prix en quelques secondes.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Envoyez le PDF par email</h3>
            <p>Prévisualisez le PDF professionnel avec votre logo, puis envoyez-le en un clic directement à votre client.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="tarifs">
        <div className="section-header">
          <h2>Des tarifs <span className="orange-text">transparents</span></h2>
          <p>Commencez gratuitement, passez Pro quand vous en avez besoin.</p>
        </div>
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="pricing-name">Gratuit</div>
            <div className="pricing-price">0 € <span>/ mois</span></div>
            <div className="pricing-description">Pour tester sans risque.</div>
            <ul className="pricing-features">
              <li>5 devis par mois</li>
              <li>Génération PDF</li>
              <li>Envoi email</li>
              <li>Tableau de bord</li>
              <li className="muted">Chantiers &amp; facturation</li>
              <li className="muted">Logo entreprise sur PDF</li>
              <li className="muted">Planning &amp; pointage</li>
            </ul>
            <Link to="/login" className="pricing-cta secondary">Commencer gratuitement</Link>
          </div>

          <div className="pricing-card popular">
            <div className="popular-badge">Le plus populaire</div>
            <div className="pricing-name">Pro</div>
            <div className="pricing-price">29 € <span>/ mois</span></div>
            <div className="pricing-description">Pour les artisans actifs. Tout inclus.</div>
            <ul className="pricing-features">
              <li>Devis &amp; factures illimités</li>
              <li>PDF personnalisé avec logo</li>
              <li>Envoi email automatique</li>
              <li>Gestion des chantiers complète</li>
              <li>Planning équipe + pointage terrain</li>
              <li>Trésorerie &amp; prévisions</li>
              <li>Portail client sécurisé</li>
              <li>Export Sage / EBP</li>
            </ul>
            <Link to="/checkout" className="pricing-cta primary">Essayer 30 jours gratuit</Link>
          </div>
        </div>
        <p className="pricing-note">Moins d'une heure de travail facturé. Récupéré dès le 1er devis envoyé.</p>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <h2>Prêt à gagner 2h par jour ?</h2>
        <p>
          Rejoignez les artisans qui pilotent leurs devis, chantiers et factures depuis un seul outil.
          Démarrez gratuitement, sans carte bancaire.
        </p>
        <Link to="/login" className="lp-cta-btn cta-hero-btn">
          Créer mon compte gratuit →
        </Link>
        <p className="cta-note">Essai 30 jours — Sans engagement — Sans carte bancaire</p>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <div className="footer-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span>Bati Prelvio</span>
        </div>
        <p>© 2026 Bati Prelvio — Logiciel de gestion pour artisans du BTP. Tous droits réservés.</p>
        <div className="footer-links">
          <Link to="/mentions-legales">Mentions légales</Link>
          <Link to="/confidentialite">Politique de confidentialité</Link>
          <Link to="/cgu">CGU</Link>
          <a href="mailto:info@prelvio.com">Contact</a>
        </div>
      </footer>
    </div>
  )
}
