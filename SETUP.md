# ChantierPro — Guide Setup (15 min)

## 1. Prérequis

- Node.js 18+ installé
- Compte Supabase (gratuit) → supabase.com
- Compte Vercel (gratuit) → vercel.com
- Compte Resend (gratuit) → resend.com *(pour l'envoi email)*

---

## 2. Supabase Setup (5 min)

### a) Créer le projet
1. Aller sur [app.supabase.com](https://app.supabase.com)
2. **New Project** → Choisir un nom (ex: `chantierpro`) → Créer
3. Attendre ~2 min que le projet soit prêt

### b) Créer les tables
1. Aller dans **SQL Editor** (menu gauche)
2. Cliquer **New query**
3. Copier-coller tout le contenu de `supabase/schema.sql`
4. Cliquer **Run** (ou `Ctrl+Enter`)
5. Vérifier dans **Table Editor** que les tables `clients`, `devis`, `lignes_devis`, `entreprise` existent

### c) Récupérer les clés
1. Aller dans **Settings → API**
2. Copier :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## 3. Resend Setup (2 min)

1. Créer un compte sur [resend.com](https://resend.com)
2. Aller dans **API Keys** → **Create API Key**
3. Copier la clé → `VITE_RESEND_API_KEY`
4. Ajouter votre domaine email dans **Domains** (ou utiliser `@resend.dev` pour les tests)

---

## 4. Installation locale

```bash
# Cloner / aller dans le dossier
cd chantierpro

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos vraies clés
nano .env   # ou ouvrir avec VS Code

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'app tourne sur **http://localhost:5173**

---

## 5. Variables d'environnement (.env)

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_RESEND_API_KEY=re_xxxxxxxxxxxx
VITE_FROM_EMAIL=devis@votre-domaine.fr
VITE_FROM_NAME=ChantierPro
```

---

## 6. Premier lancement

1. Ouvrir **http://localhost:5173**
2. Cliquer **S'inscrire** → créer votre compte
3. Vérifier votre email (Supabase envoie un lien de confirmation)
4. Se connecter
5. Créer votre premier devis ! 🎉

---

## 7. Déploiement Vercel (2 min)

```bash
# Option A : Via GitHub (recommandé)
git init
git add .
git commit -m "feat: init chantierpro v1"
# Pousser sur GitHub, puis connecter le repo dans Vercel

# Option B : CLI Vercel
npm i -g vercel
vercel
```

**Variables d'environnement sur Vercel :**
1. Aller dans votre projet Vercel → **Settings → Environment Variables**
2. Ajouter les 4 variables de votre `.env`
3. **Redéployer**

---

## 8. Paramètres entreprise

Les coordonnées de votre entreprise (qui apparaissent sur les PDFs) sont stockées en `localStorage`.

Pour les configurer, ouvrez la console du navigateur et exécutez :

```javascript
localStorage.setItem('cp_nom',     'Ma Société BTP SARL')
localStorage.setItem('cp_email',   'contact@masociete.fr')
localStorage.setItem('cp_tel',     '04 72 XX XX XX')
localStorage.setItem('cp_adresse', '12 rue des Artisans, 69000 Lyon')
localStorage.setItem('cp_siret',   '123 456 789 00012')
```

*(La page Paramètres sera ajoutée en V2)*

---

## Structure du projet

```
chantierpro/
├── src/
│   ├── components/
│   │   ├── layout/        # Sidebar, AppLayout
│   │   ├── ui/            # Button, Input, Badge, Spinner
│   │   └── devis/         # DevisForm, Steps, DevisList
│   ├── hooks/             # useAuth
│   ├── lib/               # supabase.js, pdf.js, email.js
│   └── pages/             # LoginPage, Dashboard, DevisListPage, DevisNewPage
├── supabase/
│   └── schema.sql         # Tables + RLS + Index
└── .env.example
```

---

## Stack utilisée

| Layer      | Tech                     | Coût  |
|-----------|--------------------------|-------|
| Frontend  | React + Vite + Tailwind  | 0€    |
| Backend   | Supabase (auth + DB)     | 0€    |
| PDF       | jsPDF + autotable        | 0€    |
| Email     | Resend (3000/mois free)  | 0€    |
| Hosting   | Vercel                   | 0€    |
| **Total** |                          | **0€** |
