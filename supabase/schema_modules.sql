-- ============================================================
-- ChantierPro — Modules 2 à 5
-- À exécuter dans l'éditeur SQL Supabase (après schema.sql)
-- ============================================================

-- ── Table: chantiers ─────────────────────────────────────────
create table if not exists chantiers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  client_id   uuid references clients(id) on delete set null,
  nom         text not null,
  adresse     text,
  statut      text not null default 'en_attente'
                check (statut in ('en_attente', 'en_cours', 'termine', 'annule')),
  date_debut  date,
  date_fin    date,
  description text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger chantiers_updated_at
  before update on chantiers
  for each row execute function update_updated_at();

alter table chantiers enable row level security;

create policy "chantiers: select own" on chantiers for select  using (auth.uid() = user_id);
create policy "chantiers: insert own" on chantiers for insert  with check (auth.uid() = user_id);
create policy "chantiers: update own" on chantiers for update  using (auth.uid() = user_id);
create policy "chantiers: delete own" on chantiers for delete  using (auth.uid() = user_id);

create index if not exists idx_chantiers_user   on chantiers(user_id);
create index if not exists idx_chantiers_statut on chantiers(statut);

-- ── Table: factures ──────────────────────────────────────────
create table if not exists factures (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  client_id     uuid references clients(id) on delete set null,
  devis_id      uuid references devis(id) on delete set null,
  numero        text unique not null,
  statut        text not null default 'brouillon'
                  check (statut in ('brouillon', 'envoyee', 'payee', 'en_retard')),
  total_ht      numeric(12, 2) default 0,
  total_tva     numeric(12, 2) default 0,
  total_ttc     numeric(12, 2) default 0,
  date_echeance date,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create trigger factures_updated_at
  before update on factures
  for each row execute function update_updated_at();

alter table factures enable row level security;

create policy "factures: select own" on factures for select  using (auth.uid() = user_id);
create policy "factures: insert own" on factures for insert  with check (auth.uid() = user_id);
create policy "factures: update own" on factures for update  using (auth.uid() = user_id);
create policy "factures: delete own" on factures for delete  using (auth.uid() = user_id);

create index if not exists idx_factures_user   on factures(user_id);
create index if not exists idx_factures_statut on factures(statut);

-- ── Table: lignes_facture ────────────────────────────────────
create table if not exists lignes_facture (
  id          uuid primary key default gen_random_uuid(),
  facture_id  uuid references factures(id) on delete cascade not null,
  designation text not null,
  quantite    numeric(10, 2) default 1,
  pu_ht       numeric(12, 2) not null,
  total_ht    numeric(12, 2) not null,
  created_at  timestamptz default now()
);

alter table lignes_facture enable row level security;

create policy "lignes_facture: select own" on lignes_facture for select
  using (exists (select 1 from factures f where f.id = facture_id and f.user_id = auth.uid()));
create policy "lignes_facture: insert own" on lignes_facture for insert
  with check (exists (select 1 from factures f where f.id = facture_id and f.user_id = auth.uid()));
create policy "lignes_facture: update own" on lignes_facture for update
  using (exists (select 1 from factures f where f.id = facture_id and f.user_id = auth.uid()));
create policy "lignes_facture: delete own" on lignes_facture for delete
  using (exists (select 1 from factures f where f.id = facture_id and f.user_id = auth.uid()));

create index if not exists idx_lignes_facture_id on lignes_facture(facture_id);
