select
  origem,
  count(*) as total_leads,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as pct_do_total
from public.leads
group by origem
order by total_leads desc;
