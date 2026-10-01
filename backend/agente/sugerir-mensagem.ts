import { parseArgs } from "node:util";
import { gerarMensagem, type Lead } from "../supabase/functions/_shared/mensagem.ts";

const leadsDeExemplo: Lead[] = [
  {
    nome: "Helena Martins",
    origem: "indicacao",
    imovel_interesse: "Cobertura no Jardim Europa, indicada pela família Rocha. Busca 4 suítes e piscina privativa.",
  },
  {
    nome: "Juliana Castro",
    origem: "whatsapp",
    imovel_interesse: "Casa na Granja Viana com espaço para home office e quintal para cachorro.",
  },
  {
    nome: "Luciana Barros",
    origem: "site",
    imovel_interesse: "Gostaria de mais informações.",
  },
];

function lerLeadDosArgumentos(): Lead | null {
  const { values } = parseArgs({
    options: {
      nome: { type: "string" },
      imovel: { type: "string" },
      origem: { type: "string" },
    },
  });

  if (!values.nome || !values.imovel) {
    return null;
  }

  return {
    nome: values.nome,
    imovel_interesse: values.imovel,
    origem: values.origem ?? null,
  };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Defina a ANTHROPIC_API_KEY no arquivo .env (veja o .env.example).");
    process.exit(1);
  }

  const leadDigitado = lerLeadDosArgumentos();
  const leads = leadDigitado ? [leadDigitado] : leadsDeExemplo;

  for (const lead of leads) {
    console.log(`\n=== ${lead.nome} (${lead.origem ?? "sem origem"}) ===`);
    console.log(`Procura: ${lead.imovel_interesse}\n`);

    try {
      const mensagem = await gerarMensagem(lead);
      console.log(mensagem);
    } catch (erro) {
      console.error("Erro ao gerar a mensagem:", (erro as Error).message);
    }
  }
}

main();
