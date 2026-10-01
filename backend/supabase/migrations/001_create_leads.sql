create table if not exists public.leads (
  id                 bigint generated always as identity primary key,
  nome               text        not null,
  telefone           text        not null,
  imovel_interesse   text        not null,
  origem             text        not null check (origem in ('site', 'whatsapp', 'indicacao')),
  status             text        not null default 'novo'
                                 check (status in ('novo', 'em_contato', 'qualificado', 'perdido')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  mensagem_sugerida  text,
  mensagem_gerada_em timestamptz
);

create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_origem_idx     on public.leads (origem);
create index if not exists leads_created_at_idx on public.leads (created_at desc);


create or replace function public.atualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_atualizar_updated_at on public.leads;
create trigger leads_atualizar_updated_at
  before update on public.leads
  for each row execute function public.atualizar_updated_at();


alter table public.leads enable row level security;

drop policy if exists "qualquer_um_pode_ler" on public.leads;
create policy "qualquer_um_pode_ler"
  on public.leads for select
  to anon, authenticated
  using (true);

drop policy if exists "qualquer_um_pode_cadastrar" on public.leads;
create policy "qualquer_um_pode_cadastrar"
  on public.leads for insert
  to anon, authenticated
  with check (status = 'novo');

drop policy if exists "qualquer_um_pode_atualizar" on public.leads;
create policy "qualquer_um_pode_atualizar"
  on public.leads for update
  to anon, authenticated
  using (true);


revoke insert, update on public.leads from anon, authenticated;
grant select                                     on public.leads to anon, authenticated;
grant insert (nome, telefone, imovel_interesse, origem) on public.leads to anon, authenticated;
grant update (status)                            on public.leads to anon, authenticated;
