export function escaparHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function semAcentos(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function formatarData(dataIso) {
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

export function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatarPorcentagem(valor) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
}

export function diasDesde(dataIso) {
  const umDiaEmMs = 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - new Date(dataIso).getTime()) / umDiaEmMs);
}

export function contarPorCampo(lista, campo) {
  const contagem = {};
  for (const item of lista) {
    const valor = item[campo];
    contagem[valor] = (contagem[valor] ?? 0) + 1;
  }
  return contagem;
}
