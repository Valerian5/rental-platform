-- Supabase RLS policies for billing/subscriptions and premium access
-- Run this in your Supabase project SQL editor (or via migrations)

-- 1) pricing_plans: public readable (only active plans)
alter table if exists pricing_plans enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'pricing_plans' and policyname = 'Allow public read active plans'
  ) then
    create policy "Allow public read active plans" on pricing_plans
      for select
      using (is_active = true);
  end if;
end $$;

-- 2) owner_subscriptions: owners can read their own row. Writes via service role only (webhooks)
alter table if exists owner_subscriptions enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'owner_subscriptions' and policyname = 'Owner can read own subscription'
  ) then
    create policy "Owner can read own subscription" on owner_subscriptions
      for select
      using (owner_id = auth.uid());
  end if;
end $$;

-- Optional: block non-service writes explicitly (fallback is deny by default when RLS enabled)
-- No insert/update/delete policies provided here → only service role can write.

-- 3) agency_subscriptions: users can read subscription of their agency
alter table if exists agency_subscriptions enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agency_subscriptions' and policyname = 'Agency members can read subscription'
  ) then
    create policy "Agency members can read subscription" on agency_subscriptions
      for select
      using (
        exists (
          select 1 from users u
          where u.id = auth.uid() and u.agency_id = agency_subscriptions.agency_id
        )
      );
  end if;
end $$;

-- 4) site_settings: restrict to admins only (reads and writes). Public APIs use service role anyway.
alter table if exists site_settings enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'site_settings' and policyname = 'Admins can read site settings'
  ) then
    create policy "Admins can read site settings" on site_settings
      for select
      using (
        exists (
          select 1 from users u
          where u.id = auth.uid() and coalesce(u.user_type,'') = 'admin'
        )
      );
  end if;
end $$;

-- Writes for site_settings are reserved to service role (no write policies).

-- 5) billing_events: service-role only (no policies → denied for anon/auth)
alter table if exists billing_events enable row level security;
-- Intentionally no select/insert policy for authenticated users

-- 6) one_off_purchases: service-role only (no policies → denied for anon/auth)
alter table if exists one_off_purchases enable row level security;
-- Intentionally no select/insert policy for authenticated users

-- 7) premium_modules / agency_module_usage (if present): deny by default, service role for writes
alter table if exists premium_modules enable row level security;
alter table if exists agency_module_usage enable row level security;
-- Add read/write policies as needed. Default deny keeps data private; APIs with service role can manage usage.

-- 8) users: ensure users can read their own row (commonly already present in templates)
alter table if exists users enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can read self'
  ) then
    create policy "Users can read self" on users
      for select
      using (id = auth.uid());
  end if;
end $$;

-- Notes:
-- - Webhooks and admin APIs should use the service role key, bypassing RLS.
-- - End-user APIs (owner) should authenticate (Bearer/cookies) so the SELECT
--   policies above allow only their own subscription (or their agency's).
-- - pricing_plans stays publicly readable for plan selection UI.


