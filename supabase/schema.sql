create extension if not exists pgcrypto;

create table public.game_nights (
  id uuid primary key default gen_random_uuid(),
  game text not null check (char_length(game) between 1 and 80),
  starts_at timestamptz not null,
  platform text not null check (char_length(platform) between 1 and 40),
  host_name text not null check (char_length(host_name) between 1 and 32),
  max_players integer not null check (max_players between 2 and 32),
  notes text check (notes is null or char_length(notes) <= 300),
  created_at timestamptz not null default now()
);

create table public.signups (
  id uuid primary key default gen_random_uuid(),
  game_night_id uuid not null references public.game_nights(id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 32),
  created_at timestamptz not null default now()
);

create unique index signups_one_name_per_night
  on public.signups (game_night_id, lower(player_name));
create index game_nights_starts_at on public.game_nights (starts_at);
create index signups_game_night_id on public.signups (game_night_id);

alter table public.game_nights enable row level security;
alter table public.signups enable row level security;

create function public.join_game_night(p_game_night_id uuid, p_player_name text)
returns table (id uuid, game_night_id uuid, player_name text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  player_limit integer;
begin
  select gn.max_players into player_limit
  from public.game_nights as gn
  where gn.id = p_game_night_id
  for update;

  if not found then
    raise exception 'GAME_NIGHT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if (select gn.starts_at <= now() from public.game_nights as gn where gn.id = p_game_night_id) then
    raise exception 'GAME_NIGHT_PAST' using errcode = 'P0001';
  end if;

  if (select count(*) from public.signups as s where s.game_night_id = p_game_night_id) >= player_limit then
    raise exception 'GAME_NIGHT_FULL' using errcode = 'P0001';
  end if;

  return query
  insert into public.signups as s (game_night_id, player_name)
  values (p_game_night_id, btrim(p_player_name))
  returning s.id, s.game_night_id, s.player_name, s.created_at;
end;
$$;

revoke all on function public.join_game_night(uuid, text) from public, anon, authenticated;
grant execute on function public.join_game_night(uuid, text) to service_role;
