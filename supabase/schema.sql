-- Run once in your Supabase project's SQL editor.

create table if not exists public.workspaces (
  user_id text primary key,
  business_name text not null,
  website text not null,
  audience text not null check (audience in ('founder', 'in_house', 'agency', 'freelancer', 'other')),
  status text not null default 'setting_up' check (status in ('setting_up', 'ready', 'failed')),
  brand_profile jsonb,
  brand_voice jsonb,
  customer_profiles jsonb,
  pages_read text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.welcome_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  business_name text not null,
  audience text not null check (audience in ('founder', 'in_house', 'agency', 'freelancer', 'other')),
  subject text not null,
  body text not null,
  agent_note text not null default '',
  token_id text unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz
);

create index if not exists welcome_drafts_status_created_at_idx
  on public.welcome_drafts (status, created_at desc);

-- No policies: the browser can't read these tables. Only the server, using the secret key, can.
alter table public.workspaces enable row level security;
alter table public.welcome_drafts enable row level security;

-- Explicit grants, so this works with "Grant API access to new tables automatically" turned off.
revoke all on public.workspaces, public.welcome_drafts from anon, authenticated;
grant select, insert, update, delete on public.workspaces, public.welcome_drafts to service_role;

-- Tell the Data API about the new tables straight away.
notify pgrst, 'reload schema';
