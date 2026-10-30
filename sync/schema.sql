-- Supabase Postgres setup. Run as project owner. No service key belongs in YouView.
create table if not exists public.youview_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1,
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.youview_state enable row level security;
drop policy if exists "Read own YouView state" on public.youview_state;
create policy "Read own YouView state" on public.youview_state for select to authenticated using ((select auth.uid()) = user_id);
-- Writes go through revision checking; direct writes are not granted.
revoke all on public.youview_state from anon, authenticated;
grant select on public.youview_state to authenticated;
create or replace function public.save_youview_state(expected_revision bigint, next_state jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); new_revision bigint;
begin
  if owner_id is null then raise exception 'Sign in required'; end if;
  if jsonb_typeof(next_state) <> 'object' or next_state is null then raise exception 'Invalid state'; end if;
  if octet_length(next_state::text) > 2000000 then raise exception 'State exceeds 2 MB'; end if;
  -- Only private viewing state, never API keys or the indexed video catalogue.
  if next_state - array['channels','progress','history','shortOverrides','deletedChannels','deletedHistory','deviceId','updatedAt'] <> '{}'::jsonb then raise exception 'Unsupported state fields'; end if;
  if expected_revision = 0 then
    insert into public.youview_state(user_id,state) values(owner_id,next_state) on conflict do nothing returning revision into new_revision;
  else
    update public.youview_state set state=next_state, revision=revision+1, updated_at=now()
    where user_id=owner_id and revision=expected_revision returning revision into new_revision;
  end if;
  if new_revision is null then raise exception 'Sync conflict: fetch latest state before retrying'; end if;
  return new_revision;
end $$;
revoke all on function public.save_youview_state(bigint,jsonb) from public, anon;
grant execute on function public.save_youview_state(bigint,jsonb) to authenticated;
