select
  origem,
  count(*) as total_leads,
  count(*) filter (where status = 'qualificado') as qualificados,
  round(100.0 * count(*) filter (where status = 'qualificado') / count(*), 1) as pct_qualificados
from public.leads
group by origem
order by pct_qualificados desc;
