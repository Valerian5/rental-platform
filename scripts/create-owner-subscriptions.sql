-- Table pour les abonnements OWNER (indépendants des agences)
create table if not exists owner_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  plan_id uuid not null references pricing_plans(id),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'trial')),
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone,
  trial_ends_at timestamp with time zone,
  is_trial boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_status text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(owner_id)
);

-- Index pour les requêtes fréquentes
create index if not exists idx_owner_subscriptions_owner_id on owner_subscriptions(owner_id);
create index if not exists idx_owner_subscriptions_plan_id on owner_subscriptions(plan_id);
create index if not exists idx_owner_subscriptions_status on owner_subscriptions(status);
