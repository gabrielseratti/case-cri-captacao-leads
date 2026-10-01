# Etapa 2 - Interpretação dos dados

Cada pergunta tem um arquivo `.sql` nesta pasta. Rodei todos no SQL Editor do Supabase em cima dos 24 leads do `seed.sql`.

Uma ressalva antes: os dados são fictícios e fui eu que criei. Montei o seed tentando imitar um comportamento realista (indicação convertendo mais, por exemplo), então o que vale aqui é o raciocínio e as consultas, não os números em si. Com 24 leads, um lead a mais ou a menos já muda bastante os percentuais.

## 1. Qual origem gerou mais leads?

Arquivo: `1_origem_com_mais_leads.sql`

| origem    | leads | % do total |
|-----------|------:|-----------:|
| whatsapp  | 10    | 41,7%      |
| site      | 8     | 33,3%      |
| indicacao | 6     | 25,0%      |

O WhatsApp trouxe mais leads.

Para calcular o percentual usei `sum(count(*)) over ()`, que soma o total de todas as linhas sem precisar de subconsulta.

## 2. Percentual de qualificados por origem

Arquivo: `2_qualificados_por_origem.sql`

| origem    | leads | qualificados | % qualificados |
|-----------|------:|-------------:|---------------:|
| indicacao | 6     | 3            | 50,0%          |
| whatsapp  | 10    | 2            | 20,0%          |
| site      | 8     | 1            | 12,5%          |

A indicação é o canal com menos leads, mas é o que mais qualifica: metade dos leads. Faz sentido para imóvel de alto padrão, porque quem chega indicado já confia na empresa.

O `count(*) filter (where ...)` conta só as linhas que batem com a condição. É uma forma mais curta de fazer `sum(case when ... then 1 else 0 end)`.

## 3. Outros padrões

### 3a. Olhando o funil inteiro

Arquivo: `3a_funil_por_origem.sql`

| origem    | novo | em contato | qualificado | perdido | % qualif. entre decididos |
|-----------|-----:|-----------:|------------:|--------:|--------------------------:|
| indicacao | 1    | 1          | 3           | 1       | 75,0%                     |
| whatsapp  | 3    | 3          | 2           | 2       | 50,0%                     |
| site      | 3    | 1          | 1           | 3       | 25,0%                     |

A taxa da pergunta 2 trata como "não qualificado" quem ainda está em andamento. Por isso também calculei a taxa só entre os leads que já tiveram um desfecho (qualificado ou perdido).

- O site é o canal que mais perde: de 4 leads decididos, 3 foram perdidos.
- O WhatsApp ainda tem 6 dos 10 leads em aberto, então os 20% da pergunta 2 podem subir.

### 3b. Leads parados

Arquivo: `3b_leads_parados.sql`

| id | nome            | origem   | criado em  | dias sem contato |
|---:|-----------------|----------|------------|-----------------:|
| 16 | Marcelo Viana   | site     | 08/09/2026 | 20               |
| 17 | Renata Cordeiro | site     | 14/09/2026 | 14               |
| 8  | Thiago Moura    | whatsapp | 19/09/2026 | 9                |

3 dos 7 leads com status "novo" estão há mais de uma semana sem contato, e 2 deles vieram do site. Isso ajuda a explicar o item anterior: o site perde mais leads e também é onde eles esperam mais tempo por uma resposta.

A consulta usa a data fixa de 29/09/2026 para o resultado não mudar a cada dia. Em produção seria `now()`.

Coloquei esse alerta na interface também (card "Sem contato há +7 dias").

### 3c. Descrição vaga x detalhada

Arquivo: `3c_descricao_x_status.sql`

| status      | leads | média de caracteres |
|-------------|------:|--------------------:|
| qualificado | 6     | 86                  |
| em_contato  | 5     | 68                  |
| novo        | 7     | 39                  |
| perdido     | 6     | 32                  |

| descrição                   | leads | qualificados | perdidos |
|-----------------------------|------:|-------------:|---------:|
| curta (< 40 caracteres)     | 10    | 0            | 5        |
| detalhada (>= 40 caracteres) | 14    | 6            | 1        |

Nenhum lead com descrição curta ("Quero saber valores.", "Cobertura em Pinheiros.") foi qualificado. Quem já sabe dizer bairro, tamanho e número de suítes está mais perto de comprar.

Usei isso no agente da Etapa 4: quando o pedido é vago, ele pergunta o que a pessoa procura em vez de tentar adivinhar.

O tamanho do texto é uma medida bem simples. Com mais tempo, eu usaria a IA para extrair do texto campos como bairro, tipo de imóvel e faixa de preço, e cruzaria esses campos com o status.

## Resumo

1. WhatsApp traz volume, indicação traz qualidade.
2. O site perde mais leads e demora mais para responder.
3. Responder rápido e fazer a pergunta certa para leads vagos são os dois pontos que o agente tenta resolver.
