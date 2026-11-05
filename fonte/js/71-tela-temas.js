/* ============ TEMAS ============ */
function telaTemas(app) {
  const temas = todosTemas(); const prontos = temas.filter(t => !t.doc && !t.user), meus = temas.filter(t => t.doc || t.user);
  const grupo = (titulo, lista) => lista.length ? `<section><h2 class="titulo-sec">${titulo}</h2><div class="temas">${lista.map(t => tileTema(t, true)).join("")}</div></section>` : "";
  app.innerHTML = `<header class="cab"><div><h1>Temas</h1><p class="sub">Cada tema tem a sua cor e a sua trilha de tópicos.</p></div><a class="btn pri" href="#novo">${ico("mais")}Novo tema</a></header>
    ${grupo("Trilhas prontas", prontos)}${grupo("Seus PDFs e temas criados", meus)}`;
}

/* ============ TRILHA DE UM TEMA ============ */
const SITUACOES = [["novo", "Novo"], ["estudado", "Estudado"], ["revisar", "Revisar hoje"], ["dominado", "Dominado"]];
function telaTema(app, id) {
  const t = tema(id); if (!t) { app.innerHTML = `<div class="card">Tema não encontrado. <a href="#temas">Voltar</a></div>`; return; }
  const ts = topicos(t); const pr = progressoTema(t);
  const nRev = ts.filter(x => situacao(x.id) === "revisar").length; const nAulas = ts.filter(x => aula(x.id)).length;
  const nCards = filaCartoes(t.id).length; const temCards = CARDS.some(c => c.tema === t.id);
  const prox = proximaAula(t); const principal = t.id === st.principal;
  app.innerHTML = `<section class="tema-cab" style="--c:${t.cor}">
    <a class="migalha" href="#temas">${ico("voltar")}Temas</a>
    <div class="id">${iconeTema(t, "lg")}<div><h1>${esc(t.nome)}</h1>${t.desc ? `<p class="sub">${esc(t.desc)}</p>` : ""}</div></div>
    <div class="progresso-tema"><div class="bar"><i style="width:${pr.p * 100}%"></i></div>
      <div class="stats"><span><b>${pr.v}</b> de ${pr.n} tópicos estudados</span>${nRev ? `<span class="aviso"><b>${nRev}</b> para revisar</span>` : ""}<span><b>${nAulas}</b> aulas prontas</span></div></div>
    <div class="row">
      ${prox ? `<button class="btn pri" id="continuar">${ico("play")}<span>Continuar: <b>${esc(prox.t.length > 48 ? prox.t.slice(0, 46) + "…" : prox.t)}</b></span></button>` : `<span class="pill ok">${ico("check")}Todos os tópicos já foram estudados</span>`}
      ${temCards ? `<a class="btn" href="#revisar" id="revtema">${ico("revisar")}Revisar cartões${nCards ? ` <b class="badge">${nCards}</b>` : ""}</a>` : ""}
      <span class="sep"></span>
      ${principal ? `<span class="pill ac">${ico("estrela")}Tema principal</span>` : `<button class="btn ghost sm" id="principal">${ico("estrela")}Tornar principal</button>`}
      <button class="btn ghost sm" id="cor">${ico("paleta")}Cor</button>
      ${MODO !== "arquivo" ? `<a class="btn ghost sm" href="#biblioteca">${ico("enviar")}Adicionar PDF</a>` : ""}
      ${t.user ? `<button class="btn ghost sm" id="apagar">${ico("lixo")}Apagar</button>` : ""}
    </div></section>
    ${t.id === "concurso" ? widgetCalcProva() : ""}
    <div class="legenda" aria-label="Legenda">${SITUACOES.map(([s, n]) => `<span class="leg ${s}"><span class="sit"></span>${n}</span>`).join("")}<span class="leg sem">${ico("brilho")}Sem aula ainda: toque para gerar</span></div>
    ${t.disciplinas.map(d => { const feitos = d.topicos.filter(x => situacao(x.id) !== "novo").length;
      return `<section class="disc" style="--c:${t.cor}"><header><i class="dot" style="background:${d.cor || t.cor}"></i><h2>${esc(d.nome)}</h2>${d.questoes ? `<span class="sub">${d.questoes} questões · ${d.pontos} pts</span>` : ""}<span class="conta">${feitos}/${d.topicos.length}</span></header>
      <div class="topicos">${d.topicos.map(linhaTopico).join("")}</div></section>`; }).join("")}`;
  if ($("#continuar")) $("#continuar").onclick = () => abrirTopico(prox.id);
  if ($("#principal")) $("#principal").onclick = () => { st.principal = t.id; salvar(); toast("Tema principal: " + t.nome); rotear(); };
  if ($("#revtema")) $("#revtema").onclick = () => { st.filtroRev = t.id; salvar(); };
  $("#cor").onclick = () => escolherCor(t);
  if ($("#apagar")) $("#apagar").onclick = () => abrirModal(`<h2>Apagar "${esc(t.nome)}"?</h2><p class="sub">Os tópicos e as aulas importadas deste tema somem deste navegador.</p><div class="row fim"><button class="btn" data-fechar>Cancelar</button><button class="btn perigo" id="sim">Apagar</button></div>`, m => { $("#sim", m).onclick = () => { st.temasUser = st.temasUser.filter(x => x.id !== t.id); salvar(); fecharModal(); location.hash = "temas"; }; });
  app.querySelectorAll(".topico").forEach(b => b.onclick = () => abrirTopico(b.dataset.t));
  if (t.id === "concurso") ligarCalcProva();
}
function linhaTopico(x) {
  const s = situacao(x.id); const a = aula(x.id); const i = st.top[x.id];
  const meta = [(x.p || 2) === 3 ? `<span class="prio">prioridade alta</span>` : "", a && a.auto && !st.aulasUser[x.id] ? "aula automática" : "", x.pi ? "p. " + x.pi : "", i && i.prox ? "revisar " + fmt(i.prox) : ""].filter(Boolean).join(" · ");
  const icone = s === "dominado" ? ico("check") : s === "revisar" ? ico("refazer") : "";
  return `<button class="topico ${s} ${a ? "" : "sem"}" data-t="${x.id}" ${a ? "" : 'title="Ainda sem aula: toque para gerar com IA"'}><span class="sit">${icone}</span><span class="t">${esc(x.t)}${meta ? `<small>${meta}</small>` : ""}</span>${ico(a ? "dir" : "brilho", "fim")}</button>`;
}
const abrirTopico = tid => { if (aula(tid)) location.hash = "aula-" + tid; else modalGerar(tid); };
function escolherCor(t) {
  const atual = t.cor;
  abrirModal(`<h2>Cor de "${esc(t.nome)}"</h2><p class="sub">A cor marca o tema em todo o app: trilha, aulas, cartões e início.</p>
    <div class="cores">${CORES.map(c => `<button class="cor ${c === atual ? "on" : ""}" data-c="${c}" style="--c:${c}" aria-label="Cor ${c}">${c === atual ? ico("check") : ""}</button>`).join("")}</div>
    <div class="row fim"><button class="btn ghost" id="auto">Cor automática</button><button class="btn" data-fechar>Fechar</button></div>`, m => {
    const usar = c => { st.coresTema ||= {}; if (c) st.coresTema[t.id] = c; else delete st.coresTema[t.id]; salvar(); fecharModal(); rotear(); };
    m.querySelectorAll("[data-c]").forEach(b => b.onclick = () => usar(b.dataset.c));
    $("#auto", m).onclick = () => usar(null);
  });
}
