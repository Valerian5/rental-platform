-- Tables et colonnes pour intégrer Stripe Billing

-- 1) Étendre les plans avec références Stripe
alter table if exists pricing_plans
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_monthly_id text,
  add column if not exists stripe_price_yearly_id text;

-- 2) Étendre agency_subscriptions pour stocker lier abonnement Stripe
alter table if exists agency_subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_status text;

-- 3) Journalisation des événements Stripe (debug/traçabilité)
create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null,
  created_at timestamp with time zone default now()
);

-- 4) Achats à l'acte pour modules (one-off)
create table if not exists one_off_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id uuid not null,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  currency text not null default 'eur',
  status text not null default 'succeeded',
  created_at timestamp with time zone default now()
);


