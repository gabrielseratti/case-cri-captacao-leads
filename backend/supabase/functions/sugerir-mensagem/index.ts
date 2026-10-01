import { createClient } from "@supabase/supabase-js";
import { gerarMensagem } from "../_shared/mensagem.ts";

const cabecalhosCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function responder(corpo: object, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors, "Content-Type": "application/json" },
  });
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (requisicao) => {
  if (requisicao.method === "OPTIONS") {
    return new Response("ok", { headers: cabecalhosCors });
  }

  const { lead_id } = await requisicao.json();
  if (!lead_id) {
    return responder({ erro: "Envie o lead_id." }, 400);
  }

  const { data: lead, error: erroBusca } = await supabase
    .from("leads")
    .select("id, nome, imovel_interesse, origem")
    .eq("id", lead_id)
    .single();

  if (erroBusca) {
    return responder({ erro: "Lead não encontrado." }, 404);
  }

  try {
    const mensagem = await gerarMensagem(lead);

    await supabase
      .from("leads")
      .update({ mensagem_sugerida: mensagem, mensagem_gerada_em: new Date().toISOString() })
      .eq("id", lead.id);

    return responder({ mensagem });
  } catch (erro) {
    console.error(erro);
    return responder({ erro: (erro as Error).message }, 500);
  }
});
