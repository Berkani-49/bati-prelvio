-- ============================================================
-- ChantierPro — Schema PostgreSQL (Supabase)
-- Copier-coller dans l'éditeur SQL de Supabase
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Table: clients ───────────────────────────────────────────
create table if not exists clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  nom        text not null,
  email      text,
  tel        text,
  adresse    text,
  created_at timestamptz default now()
);

-- ── Table: devis ─────────────────────────────────────────────
create table if not exists devis (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  client_id  uuid references clients(id) on delete set null,
  numero     text not null,
  statut     text not null default 'brouillon'
               check (statut in ('brouillon', 'envoye', 'accepte', 'refuse')),
  total_ht   numeric(12, 2) default 0,
  total_tva  numeric(12, 2) default 0,
  total_ttc  numeric(12, 2) default 0,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Table: lignes_devis ──────────────────────────────────────
create table if not exists lignes_devis (
  id          uuid primary key default gen_random_uuid(),
  devis_id    uuid references devis(id) on delete cascade not null,
  designation text not null,
  quantite    numeric(10, 2) default 1,
  pu_ht       numeric(12, 2) not null,
  total_ht    numeric(12, 2) not null,
  created_at  timestamptz default now()
);

-- ── Table: entreprise (paramètres par user) ──────────────────
create table if not exists entreprise (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade unique not null,
  nom        text,
  email      text,
  tel        text,
  adresse    text,
  siret      text,
  logo_url   text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Trigger: updated_at auto ─────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger devis_updated_at
  before update on devis
  for each row execute function update_updated_at();

create trigger entreprise_updated_at
  before update on entreprise
  for each row execute function update_updated_at();

-- ── Row Level Security (RLS) ─────────────────────────────────
-- Chaque utilisateur ne voit que SES données

alter table clients    enable row level security;
alter table devis      enable row level security;
alter table lignes_devis enable row level security;
alter table entreprise enable row level security;

-- Policies clients
create policy "clients: select own"  on clients for select  using (auth.uid() = user_id);
create policy "clients: insert own"  on clients for insert  with check (auth.uid() = user_id);
create policy "clients: update own"  on clients for update  using (auth.uid() = user_id);
create policy "clients: delete own"  on clients for delete  using (auth.uid() = user_id);

-- Policies devis
create policy "devis: select own"    on devis for select  using (auth.uid() = user_id);
create policy "devis: insert own"    on devis for insert  with check (auth.uid() = user_id);
create policy "devis: update own"    on devis for update  using (auth.uid() = user_id);
create policy "devis: delete own"    on devis for delete  using (auth.uid() = user_id);

-- Policies lignes_devis (via devis.user_id)
create policy "lignes: select own"   on lignes_devis for select
  using (exists (select 1 from devis d where d.id = devis_id and d.user_id = auth.uid()));

create policy "lignes: insert own"   on lignes_devis for insert
  with check (exists (select 1 from devis d where d.id = devis_id and d.user_id = auth.uid()));

create policy "lignes: update own"   on lignes_devis for update
  using (exists (select 1 from devis d where d.id = devis_id and d.user_id = auth.uid()));

create policy "lignes: delete own"   on lignes_devis for delete
  using (exists (select 1 from devis d where d.id = devis_id and d.user_id = auth.uid()));

-- Policies entreprise
create policy "entreprise: select own" on entreprise for select  using (auth.uid() = user_id);
create policy "entreprise: insert own" on entreprise for insert  with check (auth.uid() = user_id);
create policy "entreprise: update own" on entreprise for update  using (auth.uid() = user_id);
create policy "entreprise: delete own" on entreprise for delete  using (auth.uid() = user_id);

-- ── Index performance ────────────────────────────────────────
create index if not exists idx_clients_user    on clients(user_id);
create index if not exists idx_devis_user      on devis(user_id);
create index if not exists idx_devis_client    on devis(client_id);
create index if not exists idx_devis_statut    on devis(statut);
alter table devis add constraint devis_user_numero_unique unique (user_id, numero);
create index if not exists idx_lignes_devis_id on lignes_devis(devis_id);
