import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { leadsDemo } from "./dados-demo.js";

export const modoDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY;

function criarApiSupabase() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function listarLeads() {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  async function cadastrarLead(lead) {
    const { data, error } = await supabase.from("leads").insert(lead).select().single();

    if (error) throw error;
    return data;
  }

  async function atualizarStatus(id, status) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);

    if (error) throw error;
  }

  async function sugerirMensagem(id) {
    const { data, error } = await supabase.functions.invoke("sugerir-mensagem", {
      body: { lead_id: id },
    });

    if (error) {
      const detalhes = await error.context.json().catch(() => ({}));
      throw new Error(detalhes.erro ?? error.message);
    }
    return data.mensagem;
  }

  return { listarLeads, cadastrarLead, atualizarStatus, sugerirMensagem };
}

function criarApiDemo() {
  const leads = structuredClone(leadsDemo);
  let proximoId = leads.length + 1;

  async function listarLeads() {
    return [...leads];
  }

  async function cadastrarLead(lead) {
    const agora = new Date().toISOString();
    const novoLead = {
      ...lead,
      id: proximoId++,
      status: "novo",
      created_at: agora,
      mensagem_sugerida: null,
      mensagem_gerada_em: null,
    };
    leads.unshift(novoLead);
    return novoLead;
  }

  async function atualizarStatus() {}

  async function sugerirMensagem() {
    throw new Error("O agente de IA só funciona com o Supabase configurado.");
  }

  return { listarLeads, cadastrarLead, atualizarStatus, sugerirMensagem };
}

export const api = modoDemo ? criarApiDemo() : criarApiSupabase();
