# Captação de Leads - Case técnico CRI

Mini sistema para registrar leads de compradores de imóveis, analisar os dados e gerar com IA uma sugestão de primeira mensagem para cada lead.

- Interface publicada: https://gabrielseratti.github.io/case-cri-captacao-leads/

## Estrutura

```
backend/
  supabase/
    migrations/001_create_leads.sql   tabela, trigger e permissões (Etapa 1)
    seed.sql                          24 leads fictícios (Etapa 1)
    functions/
      _shared/mensagem.ts             agente de IA (Etapa 4)
      sugerir-mensagem/index.ts       Edge Function chamada pela interface (Etapa 4)
  analise/                            consultas SQL e resultados (Etapa 2)
  agente/sugerir-mensagem.ts          agente pela linha de comando (Etapa 4)

frontend/
  index.html, style.css               tela (Etapa 3)
  js/app.js                           lógica da tela
  js/api.js                           acesso ao Supabase
  js/formatacao.js                    funções auxiliares
  js/config.js                        URL e chave do Supabase
```

Como funciona:

```
frontend  --(supabase-js)-->  Supabase (tabela leads)
frontend  --(botão "Sugerir mensagem")-->  Edge Function  -->  OpenAI
                                                     |
                                                     +--> salva a mensagem no lead
```

---

## Etapa 1 - Banco de dados

### O que fiz

Criei a tabela `leads` no Supabase com os campos pedidos: nome, telefone, imóvel de interesse, origem, status e data de criação. Adicionei mais três:

- `updated_at`, atualizado automaticamente por um trigger;
- `mensagem_sugerida` e `mensagem_gerada_em`, onde fica a mensagem gerada pela IA.

O seed tem 24 leads com nomes, bairros e pedidos parecidos com o que uma imobiliária de alto padrão em São Paulo receberia.

### Ferramentas e decisões

- Supabase, porque é o que a CRI usa e já vem com banco, API e Edge Functions. Não precisei criar um servidor.
- Para origem e status usei `text` com `check`, e não `enum`. Funciona igual, mas é mais fácil adicionar um canal novo depois (ex: instagram).
- Os valores no banco não têm acento nem espaço (`em_contato`, `indicacao`). O texto bonito aparece só na tela.
- As datas do seed são fixas para que a análise dê o mesmo resultado para qualquer pessoa.
- Permissões: a interface usa a chave pública do Supabase (anon key), que fica visível no navegador. Por isso configurei o RLS para que essa chave só consiga ler, cadastrar leads e mudar o status. Ela não consegue apagar leads nem escrever a mensagem da IA; só a Edge Function consegue, usando a chave de serviço, que fica no servidor.

### Dificuldades

- No começo o seed tinha um `update` no final para igualar `updated_at` a `created_at`, mas o trigger que eu mesmo criei sobrescrevia com a data atual. Resolvi preenchendo `updated_at` direto no `insert`.
- Testei a migration, o seed e as permissões num Postgres local (PGlite), simulando o usuário anônimo, para confirmar que o `delete` realmente era bloqueado.

### Com mais tempo

- Login para os corretores, com permissões por usuário.
- Histórico de mudanças de status, para medir quanto tempo o lead fica em cada etapa.
- Validar e padronizar o telefone e evitar leads duplicados.

---

## Etapa 2 - Interpretação de dados

As consultas estão em `backend/analise/` (um arquivo por pergunta) e os resultados, com as tabelas, em [`resultados.md`](backend/analise/resultados.md).

### Respostas

1. O WhatsApp gerou mais leads: 10 de 24 (41,7%).
2. Qualificados por origem: indicação 50%, WhatsApp 20%, site 12,5%.
3. Outros padrões:
   - considerando só os leads que já tiveram desfecho, o site perde 3 de cada 4;
   - 3 leads estão há mais de 7 dias sem contato, 2 deles do site;
   - nenhum lead com descrição vaga do imóvel foi qualificado.

### Ferramentas e decisões

- SQL direto no Supabase. Usei `count(*) filter (where ...)` para contar por status e `over ()` para os percentuais.
- Além do percentual pedido, olhei o funil inteiro. Dividir os qualificados pelo total prejudica canais com muitos leads recentes, que ainda nem tiveram resposta.
- Usei a análise na construção do resto: os leads parados viraram um alerta na tela, e as descrições vagas viraram uma regra no prompt do agente.

### Dificuldades

Separar o que os dados realmente mostram do que eu mesmo coloquei neles, já que o seed foi criado por mim. Deixei isso explícito no documento de resultados.

### Com mais tempo

Usaria a IA para extrair do texto livre informações como bairro, tipo de imóvel e faixa de preço, e cruzaria isso com a conversão.

---

## Etapa 3 - Interface

### O que fiz

Uma página com:

- cards com a quantidade de leads por status (clicar no card filtra a lista);
- um card de alerta com os leads sem contato há mais de 7 dias;
- barras com a distribuição de status em cada origem;
- lista de leads com filtro por status, por origem e busca por nome ou imóvel;
- troca de status direto na lista;
- formulário para cadastrar um lead novo, com opção de já gerar a mensagem;
- janela com a mensagem sugerida, onde dá para editar, copiar ou abrir no WhatsApp.

### Ferramentas e decisões

- HTML, CSS e JavaScript puro, sem framework. Para uma tela desse tamanho, React ia adicionar configuração e build sem muito ganho. O Supabase é carregado por CDN.
- Separei o JavaScript em arquivos: `api.js` cuida só da comunicação com o banco, `formatacao.js` tem funções pequenas de apoio e `app.js` monta a tela.
- Se o `config.js` estiver vazio, a página abre em modo demonstração com os dados do seed, para dar para ver a tela sem configurar nada.
- Todo texto que vem do lead passa por `escaparHtml` antes de ir para a tela, para evitar que alguém cadastre um nome com código HTML/JS.
- As cores dos status foram escolhidas para continuarem distinguíveis para daltônicos, e sempre aparecem junto com o nome do status.
- A publicação é feita pelo GitHub Pages, com o workflow em `.github/workflows/pages.yml`.

### Dificuldades

- No celular a página rolava para o lado. Descobri que os itens do CSS Grid cresciam até a largura da tabela; resolvi com `min-width: 0`.
- Ter um modo demonstração sem encher o código de `if`. Resolvi criando duas versões da `api` com as mesmas funções: uma usa o Supabase e a outra usa os dados locais.

### Com mais tempo

- Atualizar a lista em tempo real quando outro corretor mudar um lead (Supabase Realtime).
- Paginação.
- Página de detalhes do lead.
- Testes automatizados da interface.

---

## Etapa 4 - Agente de automação

### O que fiz

Uma função que recebe um lead (nome, imóvel de interesse e origem) e pede para um modelo da OpenAI escrever uma primeira mensagem personalizada, no estilo WhatsApp. A função fica em `backend/supabase/functions/_shared/mensagem.ts` e é usada de dois jeitos:

1. Pela interface: o botão "Sugerir mensagem" chama a Edge Function `sugerir-mensagem`, que busca o lead no banco, gera a mensagem, salva no lead e devolve para a tela.
2. Pelo terminal: `npm run agente` gera mensagens para 3 leads de exemplo, ou para um lead passado por parâmetro.

### Ferramentas e decisões

- OpenAI (`gpt-5.4-mini`) pelo SDK oficial. Escolhi a versão mini porque a tarefa é curta e simples: uma mensagem de até 90 palavras não precisa do modelo maior, e assim a resposta sai mais rápida e mais barata.
- Toda a parte de IA fica isolada em `mensagem.ts`. Comecei com o Claude e troquei para a OpenAI no meio do caminho, e só esse arquivo mudou; a Edge Function, o script e a tela continuaram iguais.
- A chamada fica numa Edge Function e não no navegador, para a chave da API não ficar exposta.
- A mesma função é usada pela Edge Function (Deno) e pelo script (Node). O `deno.json` da função faz o Deno importar o SDK com o mesmo nome que o Node usa.
- O que eu pedi no prompt:
  - tom cordial e profissional;
  - citar o que a pessoa pediu, para ela ver que alguém leu;
  - terminar com uma pergunta para entender melhor o que ela quer;
  - mudar a abordagem conforme a origem (agradecer a indicação, citar o site);
  - no máximo 90 palavras;
  - não inventar preço, imóvel ou condição;
  - se o pedido for vago, perguntar em vez de supor (veio da análise da Etapa 2).
- O texto do lead vem de um formulário público, então ele vai dentro de `<lead>` e o prompt diz para tratar esse conteúdo como informação, não como instrução.
- A mensagem é só uma sugestão: o corretor revisa e envia.

### Dificuldades

- Usar o mesmo código TypeScript no Deno e no Node sem precisar compilar. O Node 22.18 já roda `.ts` direto, e o `deno.json` resolveu a diferença de imports.
- Tratar os erros: resposta cortada, recusa do modelo, chave inválida. Na interface, o erro aparece dentro da janela da mensagem.

### Exemplo de saída

Saída real de `npm run agente`:

```
=== Helena Martins (indicacao) ===
Procura: Cobertura no Jardim Europa, indicada pela família Rocha. Busca 4 suítes e piscina privativa.

Olá, Helena! Obrigado pela indicação da família Rocha.

Vi que você procura uma cobertura no Jardim Europa, com 4 suítes e piscina privativa. Vou te ajudar com essa busca por um imóvel de alto padrão no perfil que você descreveu ✨

Para eu seguir com mais precisão, qual é a faixa de valor e o prazo ideal para a mudança?
Equipe CRI

=== Juliana Castro (whatsapp) ===
Procura: Casa na Granja Viana com espaço para home office e quintal para cachorro.

Olá, Juliana! Tudo bem? 😊

Obrigado por me chamar por aqui. Entendi que você procura uma casa na Granja Viana, com espaço para home office e quintal para cachorro.

Para eu te ajudar melhor, qual faixa de valor você está considerando?

Equipe CRI

=== Luciana Barros (site) ===
Procura: Gostaria de mais informações.

Oi, Luciana! Tudo bem? Recebemos seu contato pelo site, obrigada por escrever.

Você pediu mais informações, então quero entender melhor o que você procura para te atender com precisão: região, tipo de imóvel e tamanho.

Qual é a sua prioridade hoje?
Equipe CRI
```

No caso da Luciana, o pedido é vago, e o agente pergunta o que ela procura em vez de inventar um imóvel. Era isso que eu queria com a regra que veio da análise da Etapa 2.

### Com mais tempo

- Gerar a mensagem automaticamente quando um lead é inserido no banco (Database Webhook do Supabase), sem precisar clicar.
- Fazer a IA devolver também dados estruturados do lead (tipo de imóvel, bairro, faixa de preço).
- Montar um conjunto de leads de teste para comparar versões do prompt antes de mudar alguma coisa.
- Limitar o número de chamadas por minuto para controlar custo.

---

## Como rodar

Precisa de Node 22.18 ou mais novo, uma conta no Supabase e uma chave da API da OpenAI.

### Banco

1. Crie um projeto no Supabase.
2. No SQL Editor, rode `backend/supabase/migrations/001_create_leads.sql` e depois `backend/supabase/seed.sql`.
3. Rode os arquivos de `backend/analise/` para ver as análises.

### Agente pelo terminal

```bash
cd backend
npm install
cp .env.example .env        # coloque sua OPENAI_API_KEY
npm run agente
npm run agente -- --nome "Ana Souza" --imovel "Casa no Morumbi com 4 suítes" --origem indicacao
```

### Edge Function

```bash
cd backend
npx supabase login
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref <ref-do-projeto>
npx supabase functions deploy sugerir-mensagem --project-ref <ref-do-projeto> --use-api
```

### Interface

1. Coloque a Project URL e a anon key (Project Settings > API) em `frontend/js/config.js`.
2. Rode:
   ```bash
   python -m http.server 5173 --bind 127.0.0.1 --directory frontend
   ```
3. Abra http://127.0.0.1:5173.

Sem o passo 1, a tela abre em modo demonstração.

Para publicar, suba o repositório no GitHub e em Settings > Pages escolha "GitHub Actions" como source.

---

## Uso de IA

Usei o Claude Code (assistente de programação da Anthropic) durante o desenvolvimento para discutir a estrutura do projeto, escrever partes do código e testar o SQL e a interface. Revisei o que foi gerado e as decisões descritas acima são minhas.
