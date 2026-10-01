select
  origem,
  count(*) filter (where status = 'novo')        as novo,
  count(*) filter (where status = 'em_contato')  as em_contato,
  count(*) filter (where status = 'qualificado') as qualificado,
  count(*) filter (where status = 'perdido')     as perdido,
  round(
    100.0 * count(*) filter (where status = 'qualificado')
    / nullif(count(*) filter (where status in ('qualificado', 'perdido')), 0),
    1
  ) as pct_qualif_entre_decididos
from public.leads
group by origem
order by origem;
