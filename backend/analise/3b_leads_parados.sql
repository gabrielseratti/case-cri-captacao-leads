select
  id,
  nome,
  origem,
  created_at::date as criado_em,
  date_part('day', timestamptz '2026-09-29 12:00-03' - created_at)::int as dias_sem_contato
from public.leads
where status = 'novo'
  and created_at < timestamptz '2026-09-29 12:00-03' - interval '7 days'
order by dias_sem_contato desc;
