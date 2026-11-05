/* ============ REVISAR (cartões) ============ */
let filaAtual = [], cartaoIdx = 0, mostrando = false;
function telaRevisar(app) {
  const filtro = st.filtroRev || "todos";
  const temasComCards = todosTemas().filter(t => CARDS.some(c => c.tema === t.id));
  filaAtual = shuffle(filaCartoes(filtro)); cartaoIdx = 0; mostrando = false;
  app.innerHTML = `<header class="cab"><div><h1>Revisão</h1><p class="sub">Responda de cabeça, vire o cartão e avalie com sinceridade. Até ${NOVOS_DIA} cartões novos por dia.</p></div>
    <div class="campo"><label for="filtro">Tema</label><select id="filtro"><option value="todos">Todos os temas</option>${temasComCards.map(t => `<option value="${t.id}" ${t.id === filtro ? "selected" : ""}>${esc(t.nome)}</option>`).join("")}</select></div></header>
    <section id="fcbox" class="revisao"></section>`;
  $("#filtro").onchange = e => { st.filtroRev = e.target.value; salvar(); telaRevisar(app); };
  $("#fcbox").insertAdjacentHTML("afterend", `<section class="row centro"><button class="btn ghost sm" id="anki">${ico("baixar")}Exportar para o Anki (.csv)</button></section>`);
  $("#anki").onclick = () => {
    const linhas = ["#separator:semicolon", "#html:true", "#deck column:3"].concat(cardsDoTema(filtro).map(c => { const t = tema(c.tema); return [c.f, c.v, "estudaai::" + (t ? t.nome.replace(/[^\p{L}\p{N} ]/gu, "").trim() : c.tema)].map(x => String(x).replace(/;/g, ",").replace(/\n/g, " ")).join(";"); }));
    baixarArquivo("estudaai-anki.csv", linhas.join("\n"), "text/csv;charset=utf-8", "Arquivo gerado: importe no Anki em Arquivo → Importar");
  };
  desenharCartao();
}
function desenharCartao() {
  const box = $("#fcbox"); const c = filaAtual[cartaoIdx];
  if (!c) { box.innerHTML = `<div class="fc vazio"><div><span class="ico-t lg" style="--c:var(--ok)">${ico("festa")}</span><h2>Tudo revisado por hoje</h2><p class="sub">Volte amanhã: o estudaai traz cada cartão no momento certo.</p><a class="btn pri" href="#inicio">Próximo passo do dia${ico("seta")}</a></div></div>`; if (filaAtual.length) { marcarFeito("cartoes"); salvar(); } topo("revisar"); return; }
  const t = tema(c.tema);
  const NOTAS = [["Errei", "de novo hoje", "var(--bad)"], ["Difícil", prevIntervalo(c, 1), "var(--warn)"], ["Bom", prevIntervalo(c, 2), "var(--ac)"], ["Fácil", prevIntervalo(c, 3), "var(--ok)"]];
  box.innerHTML = `<div class="sessao"><div class="bar fino"><i style="width:${cartaoIdx / filaAtual.length * 100}%"></i></div><span class="sub">${cartaoIdx + 1} de ${filaAtual.length}</span></div>
    <div class="fc" style="--c:${t ? t.cor : "var(--ac)"}">${t ? `<span class="tag">${iconeTema(t, "sm")}${esc(t.nome)}</span>` : ""}<div><div class="frente">${limparHTML(c.f)}</div>${mostrando ? `<div class="verso">${limparHTML(c.v)}</div>` : ""}</div></div>
    ${mostrando ? `<div class="notas">${NOTAS.map(([n, s, cor], i) => `<button class="btn nota" data-n="${i}" style="--c:${cor}"><span>${n}</span><small>${s}</small><kbd>${i + 1}</kbd></button>`).join("")}</div>`
      : `<div class="row centro"><button class="btn pri lg" id="virar">Mostrar resposta <kbd>espaço</kbd></button></div>`}`;
  if ($("#virar")) $("#virar").onclick = () => { mostrando = true; desenharCartao(); };
  box.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { const n = +b.dataset.n; responderCartao(c, n); if (n === 0) filaAtual.push(c); cartaoIdx++; mostrando = false; desenharCartao(); });
}
function prevIntervalo(c, n) { const s = st.cards[c.id]; const i = FSRS.proximo(s && s.S ? s : null, n + 1).int; return i + (i > 1 ? " dias" : " dia"); }
document.addEventListener("keydown", e => {
  if (!location.hash.startsWith("#revisar") || /input|textarea|select/i.test(document.activeElement.tagName)) return;
  if (e.code === "Space" && !mostrando && $("#virar")) { e.preventDefault(); $("#virar").click(); }
  if (mostrando && ["1", "2", "3", "4"].includes(e.key)) { const b = document.querySelector(`[data-n="${+e.key - 1}"]`); if (b) b.click(); }
});
