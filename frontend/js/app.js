import { api, modoDemo } from "./api.js";
import {
  escaparHtml,
  semAcentos,
  formatarData,
  formatarDataHora,
  formatarPorcentagem,
  diasDesde,
  contarPorCampo,
} from "./formatacao.js";

const STATUS = {
  novo: "Novo",
  em_contato: "Em contato",
  qualificado: "Qualificado",
  perdido: "Perdido",
};

const ORIGENS = {
  whatsapp: "WhatsApp",
  site: "Site",
  indicacao: "Indicação",
};

const DIAS_PARA_CONSIDERAR_PARADO = 7;

let todosOsLeads = [];
let leadDaMensagem = null;
const filtros = { status: "todos", origem: "todas", busca: "" };

const tela = {
  aviso: document.querySelector("#aviso"),
  selo: document.querySelector("#modo"),
  cards: document.querySelector("#cards"),
  legenda: document.querySelector("#legenda"),
  barras: document.querySelector("#barras"),
  contagem: document.querySelector("#contagem"),
  linhas: document.querySelector("#linhas"),
  formulario: document.querySelector("#form-lead"),
  filtroStatus: document.querySelector("#f-status"),
  filtroOrigem: document.querySelector("#f-origem"),
  busca: document.querySelector("#f-busca"),
  dialogo: document.querySelector("#dlg-msg"),
  dialogoLead: document.querySelector("#msg-lead"),
  dialogoStatus: document.querySelector("#msg-status"),
  dialogoTexto: document.querySelector("#msg-texto"),
  dialogoInfo: document.querySelector("#msg-meta"),
  botaoGerarDeNovo: document.querySelector("#msg-regerar"),
  botaoCopiar: document.querySelector("#msg-copiar"),
  linkWhatsapp: document.querySelector("#msg-whats"),
  toast: document.querySelector("#toast"),
};


function estaParado(lead) {
  return lead.status === "novo" && diasDesde(lead.created_at) > DIAS_PARA_CONSIDERAR_PARADO;
}

function aplicarFiltros() {
  const termo = semAcentos(filtros.busca.trim());

  return todosOsLeads.filter((lead) => {
    const passaNoStatus = filtros.status === "todos" || lead.status === filtros.status;
    const passaNaOrigem = filtros.origem === "todas" || lead.origem === filtros.origem;
    const textoDoLead = semAcentos(lead.nome + " " + lead.imovel_interesse);
    const passaNaBusca = termo === "" || textoDoLead.includes(termo);

    return passaNoStatus && passaNaOrigem && passaNaBusca;
  });
}

function atualizarTela() {
  mostrarCards();
  mostrarBarrasPorOrigem();
  mostrarTabela();
}


function criarCard({ titulo, valor, detalhe, cor, selecionado, alerta, aoClicar }) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = alerta ? "card alerta" : "card";
  card.setAttribute("aria-pressed", selecionado);

  const bolinha = cor ? `<i class="bolinha" style="background: var(--st-${cor})"></i>` : "";
  card.innerHTML = `
    <span class="rotulo">${bolinha}${titulo}</span>
    <span class="valor">${valor}</span>
    <span class="pct">${detalhe}</span>
  `;
  card.addEventListener("click", aoClicar);
  return card;
}

function mostrarCards() {
  const total = todosOsLeads.length;
  const quantidadePorStatus = contarPorCampo(todosOsLeads, "status");
  const quantidadeParados = todosOsLeads.filter(estaParado).length;

  const cards = [];

  cards.push(
    criarCard({
      titulo: "Total",
      valor: total,
      detalhe: "leads cadastrados",
      selecionado: filtros.status === "todos",
      aoClicar: () => filtrarPorStatus("todos"),
    })
  );

  for (const [status, nome] of Object.entries(STATUS)) {
    const quantidade = quantidadePorStatus[status] ?? 0;
    const porcentagem = total > 0 ? (quantidade / total) * 100 : 0;

    cards.push(
      criarCard({
        titulo: nome,
        valor: quantidade,
        detalhe: `${formatarPorcentagem(porcentagem)} do total`,
        cor: status,
        selecionado: filtros.status === status,
        aoClicar: () => filtrarPorStatus(filtros.status === status ? "todos" : status),
      })
    );
  }

  cards.push(
    criarCard({
      titulo: `Sem contato há +${DIAS_PARA_CONSIDERAR_PARADO} dias`,
      valor: quantidadeParados,
      detalhe: "precisam de retorno",
      selecionado: false,
      alerta: quantidadeParados > 0,
      aoClicar: () => filtrarPorStatus("novo"),
    })
  );

  tela.cards.replaceChildren(...cards);
}

function mostrarBarrasPorOrigem() {
  tela.legenda.innerHTML = Object.entries(STATUS)
    .map(([status, nome]) => `<span><i class="bolinha" style="background: var(--st-${status})"></i>${nome}</span>`)
    .join("");

  const linhas = [];

  for (const [origem, nomeOrigem] of Object.entries(ORIGENS)) {
    const leadsDaOrigem = todosOsLeads.filter((lead) => lead.origem === origem);
    const quantidadePorStatus = contarPorCampo(leadsDaOrigem, "status");
    const total = leadsDaOrigem.length;

    let segmentos = "";
    for (const [status, nomeStatus] of Object.entries(STATUS)) {
      const quantidade = quantidadePorStatus[status] ?? 0;
      if (quantidade === 0) continue;

      const porcentagem = formatarPorcentagem((quantidade / total) * 100);
      segmentos += `
        <div class="seg" data-st="${status}"
             style="flex: ${quantidade}; background: var(--st-${status})"
             title="${nomeOrigem} - ${nomeStatus}: ${quantidade} de ${total} (${porcentagem})">
          ${quantidade}
        </div>`;
    }

    const linha = document.createElement("div");
    linha.className = "barra-linha";
    linha.innerHTML = `
      <span class="nome">${nomeOrigem}</span>
      <div class="barra">${segmentos}</div>
      <span class="total">${total} leads</span>
    `;
    linhas.push(linha);
  }

  tela.barras.replaceChildren(...linhas);
}


function criarLinhaDaTabela(lead) {
  const opcoesDeStatus = Object.entries(STATUS)
    .map(([status, nome]) => `<option value="${status}" ${status === lead.status ? "selected" : ""}>${nome}</option>`)
    .join("");

  const avisoParado = estaParado(lead)
    ? `<span class="parado">sem contato há ${diasDesde(lead.created_at)} dias</span>`
    : "";

  const avisoMensagem = lead.mensagem_sugerida ? `<span class="tem-msg">mensagem já gerada</span>` : "";

  const linha = document.createElement("tr");
  linha.innerHTML = `
    <td class="nome">
      <strong>${escaparHtml(lead.nome)}</strong>
      <span class="tel">${escaparHtml(lead.telefone)}</span>
    </td>
    <td class="imovel">${escaparHtml(lead.imovel_interesse)}</td>
    <td>${ORIGENS[lead.origem]}</td>
    <td>
      <div class="status-sel">
        <i class="bolinha" style="background: var(--st-${lead.status})"></i>
        <select>${opcoesDeStatus}</select>
      </div>
      ${avisoParado}
    </td>
    <td class="data">${formatarData(lead.created_at)}</td>
    <td>
      <button type="button" class="btn">Sugerir mensagem</button>
      ${avisoMensagem}
    </td>
  `;

  linha.querySelector("select").addEventListener("change", (evento) => mudarStatus(lead, evento.target.value));
  linha.querySelector("button").addEventListener("click", () => abrirMensagem(lead));
  return linha;
}

function mostrarTabela() {
  const leads = aplicarFiltros();
  tela.contagem.textContent = `(${leads.length} de ${todosOsLeads.length})`;

  if (leads.length === 0) {
    tela.linhas.innerHTML = `<tr><td colspan="6" class="vazio">Nenhum lead encontrado com esses filtros.</td></tr>`;
    return;
  }

  tela.linhas.replaceChildren(...leads.map(criarLinhaDaTabela));
}


function filtrarPorStatus(status) {
  filtros.status = status;
  tela.filtroStatus.value = status;
  atualizarTela();
}

async function mudarStatus(lead, novoStatus) {
  try {
    await api.atualizarStatus(lead.id, novoStatus);
    lead.status = novoStatus;
    mostrarToast(`${lead.nome} agora está como "${STATUS[novoStatus]}".`);
  } catch (erro) {
    mostrarToast(`Não foi possível atualizar o status: ${erro.message}`);
  }
  atualizarTela();
}

async function cadastrarLead(evento) {
  evento.preventDefault();

  const campos = new FormData(tela.formulario);
  const botaoSalvar = tela.formulario.querySelector("button[type=submit]");
  botaoSalvar.disabled = true;

  try {
    const novoLead = await api.cadastrarLead({
      nome: campos.get("nome").trim(),
      telefone: campos.get("telefone").trim(),
      imovel_interesse: campos.get("imovel_interesse").trim(),
      origem: campos.get("origem"),
    });

    todosOsLeads.unshift(novoLead);
    tela.formulario.reset();
    atualizarTela();
    mostrarToast(`${novoLead.nome} foi cadastrado.`);

    if (campos.get("gerar")) {
      abrirMensagem(novoLead, true);
    }
  } catch (erro) {
    mostrarToast(`Erro ao cadastrar: ${erro.message}`);
  } finally {
    botaoSalvar.disabled = false;
  }
}


function abrirMensagem(lead, gerarNova = false) {
  leadDaMensagem = lead;
  tela.dialogoLead.textContent = `${lead.nome} · ${ORIGENS[lead.origem]} · "${lead.imovel_interesse}"`;
  tela.dialogo.showModal();

  if (lead.mensagem_sugerida && !gerarNova) {
    mostrarMensagem(lead.mensagem_sugerida, lead.mensagem_gerada_em);
  } else {
    gerarMensagem();
  }
}

async function gerarMensagem() {
  const lead = leadDaMensagem;

  tela.dialogoStatus.className = "msg-status";
  tela.dialogoStatus.textContent = "Gerando mensagem...";
  tela.dialogoTexto.value = "";
  tela.dialogoInfo.textContent = "";
  tela.botaoGerarDeNovo.disabled = true;
  atualizarLinkWhatsapp();

  try {
    const mensagem = await api.sugerirMensagem(lead.id);
    lead.mensagem_sugerida = mensagem;
    lead.mensagem_gerada_em = new Date().toISOString();
    mostrarMensagem(mensagem, lead.mensagem_gerada_em);
    mostrarTabela();
  } catch (erro) {
    tela.dialogoStatus.className = "msg-status erro";
    tela.dialogoStatus.textContent = `Não foi possível gerar: ${erro.message}`;
  } finally {
    tela.botaoGerarDeNovo.disabled = false;
  }
}

function mostrarMensagem(mensagem, geradaEm) {
  tela.dialogoStatus.textContent = "";
  tela.dialogoTexto.value = mensagem;
  tela.dialogoInfo.textContent = `Gerada em ${formatarDataHora(geradaEm)}. Revise antes de enviar.`;
  atualizarLinkWhatsapp();
}

function atualizarLinkWhatsapp() {
  const numero = leadDaMensagem.telefone.replace(/\D/g, "");
  const texto = encodeURIComponent(tela.dialogoTexto.value);
  tela.linkWhatsapp.href = `https://wa.me/${numero}?text=${texto}`;
}

async function copiarMensagem() {
  await navigator.clipboard.writeText(tela.dialogoTexto.value);
  mostrarToast("Mensagem copiada.");
}


function mostrarAviso(texto) {
  tela.aviso.textContent = texto;
  tela.aviso.hidden = false;
}

let timerDoToast;
function mostrarToast(texto) {
  tela.toast.textContent = texto;
  tela.toast.hidden = false;
  clearTimeout(timerDoToast);
  timerDoToast = setTimeout(() => (tela.toast.hidden = true), 3000);
}


tela.formulario.addEventListener("submit", cadastrarLead);
tela.filtroStatus.addEventListener("change", (evento) => filtrarPorStatus(evento.target.value));
tela.filtroOrigem.addEventListener("change", (evento) => {
  filtros.origem = evento.target.value;
  mostrarTabela();
});
tela.busca.addEventListener("input", (evento) => {
  filtros.busca = evento.target.value;
  mostrarTabela();
});
tela.dialogoTexto.addEventListener("input", atualizarLinkWhatsapp);
tela.botaoGerarDeNovo.addEventListener("click", gerarMensagem);
tela.botaoCopiar.addEventListener("click", copiarMensagem);

async function iniciar() {
  if (modoDemo) {
    tela.selo.hidden = false;
    tela.selo.textContent = "Modo demonstração";
    mostrarAviso(
      "Modo demonstração: os dados são fictícios e nada é salvo. " +
        "Para conectar ao banco, preencha o arquivo frontend/js/config.js com a URL e a anon key do Supabase."
    );
  }

  try {
    todosOsLeads = await api.listarLeads();
    atualizarTela();
  } catch (erro) {
    mostrarAviso(`Erro ao carregar os leads: ${erro.message}`);
  }
}

iniciar();
