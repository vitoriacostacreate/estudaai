/* ============ roteador ============ */
/* Abas do topo (no celular viram a barra de baixo). "Novo tema" é uma ação dentro de Temas, não uma aba. */
const ROTAS = [["inicio", "Início"], ["temas", "Temas"], ["revisar", "Revisar"], ["biblioteca", "Biblioteca"], ["foco", "Foco"], ["progresso", "Progresso"]];
const abaDaRota = r => r.startsWith("tema-") || r.startsWith("aula-") || r === "novo" ? "temas" : (ROTAS.find(([id]) => r.startsWith(id)) || ["inicio"])[0];
function topo(rota) {
  const fila = filaCartoes("todos").length; const aba = abaDaRota(rota);
  $("#tabs").innerHTML = ROTAS.map(([id, nome]) => `<a href="#${id}" class="${id === aba ? "on" : ""}" ${id === aba ? 'aria-current="page"' : ""}>${ico(id)}<span>${nome}</span>${id === "revisar" && fila ? `<b class="badge" aria-label="${fila} cartões para hoje">${fila}</b>` : ""}</a>`).join("");
  let seq = 0; for (const d = new Date(); st.dias[isoLocal(d)]; d.setDate(d.getDate() - 1)) seq++;
  const prova = diasAte("2027-01-17");
  $("#chips").innerHTML = (prova >= 0 ? `<span class="chip" title="Prova da UFMS em 17/01/2027">${ico("calendario")}<b>${prova}</b><span class="l">dias para a prova</span></span>` : "")
    + `<span class="chip ${seq ? "quente" : ""}" title="Dias seguidos com estudo">${ico("chama")}<b>${seq}</b><span class="l">${seq === 1 ? "dia seguido" : "dias seguidos"}</span></span>`
    + (MODO === "nuvem" ? `<span class="chip" id="sync"></span>` : "") + chipFoco();
  if (MODO === "nuvem") marcarSync();
}
function rotear() {
  pararAudio();
  const h = (location.hash || "#inicio").slice(1);
  focoRota(h); topo(h); window.scrollTo(0, 0);
  const app = $("#app");
  if (h.startsWith("tema-")) return telaTema(app, h.slice(5));
  if (h === "ia" || h === "ia-duvidas") return telaIA(app, h === "ia-duvidas");
  if (h.startsWith("aula-")) { const resto = h.slice(5); const m = resto.match(/^(.*?)(?:-(mapa|lembre|aprenda|pratique|teste|explique|feito))?$/); return telaAula(app, m[1], m[2] || "mapa"); }
  ({ temas: telaTemas, biblioteca: telaBiblioteca, revisar: telaRevisar, novo: telaNovo, progresso: telaProgresso, foco: telaFoco }[h] || telaInicio)(app);
}
window.addEventListener("hashchange", rotear);
function rodape() {
  const f = document.querySelector("footer"); if (!f) return;
  f.innerHTML = MODO === "local" ? `Rodando no seu PC · progresso salvo em <code>dados/estado.json</code> · estudaai ${INFO.versao}`
    : MODO === "nuvem" ? `Progresso salvo na sua conta Claude: abre igual no PC, no notebook e no celular. <a href="#progresso">Sincronizar agora</a>`
    : `Modo arquivo: o progresso fica neste navegador. Faça backup em <a href="#progresso">Progresso</a>.`;
}
