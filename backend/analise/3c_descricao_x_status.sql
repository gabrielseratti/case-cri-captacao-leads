select
  status,
  count(*) as leads,
  round(avg(length(imovel_interesse))) as media_caracteres,
  min(length(imovel_interesse)) as min_caracteres
from public.leads
group by status
order by media_caracteres desc;

select
  case
    when length(imovel_interesse) < 40 then 'curta (< 40 caracteres)'
    else 'detalhada (>= 40 caracteres)'
  end as descricao,
  count(*) as leads,
  count(*) filter (where status = 'qualificado') as qualificados,
  count(*) filter (where status = 'perdido') as perdidos
from public.leads
group by descricao
order by descricao;
