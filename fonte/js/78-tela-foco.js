/* ============ acrescentou.ai: contador de foco ============
   Automático: aula, revisão de cartões e revisão com IA (blocos de 20 min). Fica só na memória deste aparelho,
   com um "pulso" no localStorage para sobreviver a um recarregar. Pausa com a aba escondida ou 5 min sem atividade.
   Manual: aba Foco (blocos de 30 min), em st.foco.atual, para seguir entre aparelhos. Não pausa sozinho. */
const PULSO = "estudaai.foco.auto";
let focoAuto = null, ultimoPlacar = null, _pulsoLido = false;

function atividadeDaRota(h) {
  if (h.startsWith("aula-")) { const m = h.slice(5).match(/^(.*?)(?:-(mapa|lembre|aprenda|pratique|teste|explique|feito))?$/); const a = aula(m[1]); const info = acharTopico(m[1]);
    return a ? { tipo: "aula", ref: m[1], rotulo: a.titulo, tema: info ? info.tema.id : null, fim: m[2] === "feito" } : null; }
  if (h === "revisar") return { tipo: "cartoes", ref: "cartoes", rotulo: "Revisão de cartões" };
  if (h === "ia") return { tipo: "ia", ref: "ia", rotulo: "Revisão com IA" };
  return null;
}
const sessaoFoco = () => st.foco.atual || focoAuto;

/* Guarda a sessão no histórico (se passou de 1 min) e devolve o registro. */
function guardarSessao(s, agora) {
  const r = FOCO.encerrar(s, agora);
  if (r.seg < FOCO.MINIMO) return null;
  st.foco.sessoes.push(r); salvar(); return r;
}
function fecharAuto(mostrar) {
  if (!focoAuto) return null;
  const r = guardarSessao(focoAuto, Date.now()); focoAuto = null; localStorage.removeItem(PULSO);
  if (r) { ultimoPlacar = r; if (mostrar) mostrarPlacar(r); }
  return r;
}
/* Chamada pelo roteador antes de desenhar cada tela. */
function focoRota(h) {
  const alvo = atividadeDaRota(h);
  if (!_pulsoLido) { _pulsoLido = true; lerPulso(alvo); }
  if (focoAuto && (!alvo || alvo.tipo !== focoAuto.tipo || alvo.ref !== focoAuto.ref || alvo.fim)) fecharAuto(!(alvo && alvo.fim));
  if (alvo && !alvo.fim && !focoAuto && !st.foco.atual) { focoAuto = FOCO.novo(alvo.tipo, alvo.ref, alvo.rotulo, Date.now()); focoAuto.tema = alvo.tema || null; pulsar(); }
}
/* Recarregou a página: retoma a sessão automática se for a mesma atividade e o pulso for recente; se não, guarda o que tinha. */
function lerPulso(alvo) {
  let p = null; try { p = JSON.parse(localStorage.getItem(PULSO)); } catch (e) { } localStorage.removeItem(PULSO);
  if (!p || !p.s) return;
  FOCO.pausar(p.s, Math.min(Date.now(), p.t));
  if (alvo && !alvo.fim && alvo.tipo === p.s.tipo && alvo.ref === p.s.ref && Date.now() - p.t < FOCO.OCIOSO * 1000) { focoAuto = FOCO.retomar(p.s, Date.now()); return; }
  const r = guardarSessao(p.s, p.t); if (r) ultimoPlacar = r;
}
function pulsar() { if (focoAuto) try { localStorage.setItem(PULSO, JSON.stringify({ s: focoAuto, t: Date.now() })); } catch (e) { } }

/* ---------- sinais de atividade, aba escondida e o relógio de 1 s ---------- */
let _ultSinal = 0;
function sinal() { const agora = Date.now(); if (!focoAuto || document.hidden || agora - _ultSinal < 1000) return; _ultSinal = agora; const pausada = focoAuto.desde == null; FOCO.atividade(focoAuto, agora); if (pausada) atualizarFoco(); }
["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"].forEach(ev => window.addEventListener(ev, sinal, { passive: true, capture: true }));
document.addEventListener("visibilitychange", () => {
  if (!focoAuto) return;
  if (document.hidden) { FOCO.pausar(focoAuto, Date.now()); pulsar(); } else FOCO.retomar(focoAuto, Date.now());
  atualizarFoco();
});
window.addEventListener("pagehide", pulsar);
let _tique = 0;
setInterval(() => {
  if (!st) return;
  if (focoAuto && FOCO.verificarOcio(focoAuto, Date.now())) toast("acrescentou.ai pausado: 5 min sem atividade. Mexa na tela para continuar.");
  if (focoAuto && ++_tique % 5 === 0) pulsar();
  atualizarFoco();
}, 1000);

/* ---------- chip no topo ---------- */
function chipFoco() {
  const s = sessaoFoco(); if (!s) return "";
  return `<a class="chip foco ${s.desde == null ? "pausado" : ""}" id="foco-chip" href="#foco" title="acrescentou.ai: ${esc(s.rotulo)}${s.desde == null ? " (pausado)" : ""}">${conteudoChip(s)}</a>`;
}
function conteudoChip(s) { const p = FOCO.placar(FOCO.decorrido(s, Date.now()), s.bloco); return `<i class="anel" style="--p:${(p.p * 100).toFixed(1)}%" aria-hidden="true"></i><b>+${p.somas}</b><span class="t">${FOCO.relogio(p.seg)}</span>`; }
function atualizarFoco() {
  const c = document.getElementById("foco-chip"), s = sessaoFoco();
  if (!!c !== !!s) { topo((location.hash || "#inicio").slice(1)); }
  else if (c) { c.innerHTML = conteudoChip(s); c.classList.toggle("pausado", s.desde == null); }
  if (location.hash === "#foco") painelFoco();
}

/* ---------- placar ---------- */
function textoPlacar(r) {
  const p = FOCO.placar(r.seg, r.bloco), bl = Math.round(r.bloco / 60);
  return p.somas ? `${FOCO.dur(r.seg)} de foco · ${Math.floor(p.resto / 60)} min rumo à próxima soma` : `Faltaram ${Math.ceil(p.falta / 60)} min para a primeira soma (blocos de ${bl} min)`;
}
function placarHTML(r) {
  if (!r) return "";
  const num = r.somas ? `+${r.somas}<small>${r.somas === 1 ? "soma" : "somas"}</small>` : `${Math.floor(r.seg / 60)}<small>min guardados</small>`;   /* sem bloco fechado: o tempo é o destaque, nunca um "+0" */
  return `<div class="placar-in" style="--c:var(--ok)"><span class="eyebrow">acrescentou.ai</span><div class="placar-num">${num}</div><p class="sub">${textoPlacar(r)}</p></div>`;
}
function mostrarPlacar(r) {
  document.querySelectorAll(".placar").forEach(x => x.remove());
  const d = document.createElement("button"); d.className = "placar"; d.setAttribute("aria-live", "polite"); d.title = "Fechar";
  d.innerHTML = placarHTML(r) + `<span class="placar-rot">${esc(r.rotulo)}</span>`;
  d.onclick = () => d.remove(); document.body.appendChild(d); setTimeout(() => d.remove(), 6000);
}

/* ---------- tela Foco ---------- */
const nomeCat = id => { const c = st.foco.cats.find(x => x.id === id); return c ? c.nome : "Sem categoria"; };
const catsAtivas = () => st.foco.cats.filter(c => !c.off);
function telaFoco(app) {
  app.innerHTML = `<header class="cab"><div><h1>acrescentou.ai</h1><p class="sub">Seu foco vira pontos e o número só cresce. Cada <b>30 min</b> fechados aqui valem <b>+1 soma</b>. Nas aulas e revisões ele roda sozinho, com blocos de 20 min.</p></div></header>
    <section class="card foco-painel" id="fpainel"></section>
    <section class="card grid" style="gap:12px" id="fhoje"></section>
    <section class="card grid" style="gap:12px"><div><h3>Suas categorias</h3><p class="sub">Crie as opções uma vez. Depois é só tocar para marcar cada sessão.</p></div>
      <div class="row" id="fcats"></div>
      <form class="row" id="fnova"><label for="fcat" class="sr">Nova categoria</label><input id="fcat" maxlength="30" placeholder="Ex.: Violão, Livro de anatomia, Inglês" style="flex:1;min-width:200px"><button class="btn">${ico("mais")}Criar</button></form></section>`;
  $("#fnova").onsubmit = e => { e.preventDefault(); const nome = $("#fcat").value.trim(); if (!nome) return;
    const ja = st.foco.cats.find(c => c.nome.toLowerCase() === nome.toLowerCase()); if (ja) ja.off = false; else st.foco.cats.push({ id: slug(nome, 24) + "-" + sufixo(3), nome, cor: CORES[st.foco.cats.length % CORES.length] });
    salvar(); $("#fcat").value = ""; desenharFoco(); };
  desenharFoco();
}
function desenharFoco() { painelFoco(true); listaHoje(); listaCats(); }
let _painelChave = "";
function painelFoco(forcar) {
  const el = $("#fpainel"); if (!el) return;
  const s = sessaoFoco(), auto = !!focoAuto, manual = st.foco.atual;
  const chave = (s ? s.tipo + s.ref + (s.desde == null) + s.cat : "nada") + catsAtivas().length;
  const hoje = FOCO.resumo(st.foco.sessoes.filter(x => x.dia === hojeStr())).total;
  if (forcar || chave !== _painelChave) {
    _painelChave = chave;
    el.innerHTML = `<div class="foco-num" aria-live="off"><span class="mais">+</span><b id="fsomas"></b><small id="frot"></small></div>
      <div class="foco-tempo"><span id="frel"></span><div class="bar"><i id="fbar"></i></div><span class="sub" id="ffalta"></span></div>
      ${auto ? `<p class="exp">${ico("play")}<span>Rodando sozinho: <b>${esc(focoAuto.rotulo)}</b>${focoAuto.desde == null ? " (pausado, mexa na tela para continuar)" : ""}. Ele encerra quando você sair da atividade.</span></p>`
        : `<div class="row centro">${!manual ? `<button class="btn pri lg" id="fini">${ico("play")}Começar a contar</button>`
          : `${manual.desde == null ? `<button class="btn pri lg" id="fret">${ico("play")}Continuar</button>` : `<button class="btn lg" id="fpau">Pausar</button>`}<button class="btn ghost lg" id="ffim">${ico("check")}Encerrar e guardar</button>`}</div>
          <div class="grid" style="gap:8px"><span class="eyebrow">O que você está estudando?</span><div class="row centro" id="fesc">${catsAtivas().length ? catsAtivas().map(c => `<button class="btn sm cat ${(manual ? manual.cat : st.foco.ultimaCat) === c.id ? "on" : ""}" data-cat="${c.id}" style="--c:${c.cor}" aria-pressed="${(manual ? manual.cat : st.foco.ultimaCat) === c.id}">${esc(c.nome)}</button>`).join("") : `<span class="sub">Crie suas categorias logo abaixo. Dá para marcar depois também.</span>`}</div></div>`}`;
    if ($("#fini")) $("#fini").onclick = () => { st.foco.atual = FOCO.novo("manual", null, "Foco livre", Date.now()); st.foco.atual.cat = st.foco.ultimaCat || null; salvar(); topo("foco"); desenharFoco(); };
    if ($("#fpau")) $("#fpau").onclick = () => { FOCO.pausar(st.foco.atual, Date.now()); salvar(); painelFoco(true); atualizarFoco(); };
    if ($("#fret")) $("#fret").onclick = () => { FOCO.retomar(st.foco.atual, Date.now()); salvar(); painelFoco(true); atualizarFoco(); };
    if ($("#ffim")) $("#ffim").onclick = () => { const s2 = st.foco.atual; st.foco.atual = null; const r = guardarSessao(s2, Date.now()); salvar(); topo("foco"); desenharFoco();
      if (r) mostrarPlacar(r); else toast("Menos de 1 minuto: essa sessão não foi guardada."); };
    el.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { const id = b.dataset.cat; const novo = (manual ? manual.cat : st.foco.ultimaCat) === id ? null : id;
      st.foco.ultimaCat = novo; if (manual) manual.cat = novo; salvar(); painelFoco(true); });
  }
  /* números que mudam a cada segundo */
  if (s) { const p = FOCO.placar(FOCO.decorrido(s, Date.now()), s.bloco);
    $("#fsomas").textContent = p.somas; $("#frot").textContent = p.somas === 1 ? "soma nesta sessão" : "somas nesta sessão";
    $("#frel").textContent = FOCO.relogio(p.seg); $("#fbar").style.width = (p.p * 100) + "%";
    $("#ffalta").textContent = s.desde == null ? "pausado" : `faltam ${Math.ceil(p.falta / 60)} min para a próxima soma`; }
  else { $("#fsomas").textContent = hoje.somas; $("#frot").textContent = hoje.somas === 1 ? "soma hoje" : "somas hoje";
    $("#frel").textContent = FOCO.dur(hoje.seg) + " hoje"; $("#fbar").style.width = "0"; $("#ffalta").textContent = "Aperte começar quando for estudar algo fora do app."; }
}
function listaHoje() {
  const el = $("#fhoje"); if (!el) return;
  const regs = st.foco.sessoes.filter(x => x.dia === hojeStr()).slice().reverse(); const t = FOCO.resumo(regs).total;
  const hora = ms => new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  el.innerHTML = `<div class="row entre"><h3>Hoje</h3><span class="sub" style="font-variant-numeric:tabular-nums"><b style="color:var(--ok)">+${t.somas}</b> ${t.somas === 1 ? "soma" : "somas"} · ${FOCO.dur(t.seg)}</span></div>
    ${regs.length ? `<ul class="foco-lista">${regs.map(r => `<li><span class="pill ${r.somas ? "ok" : ""}">+${r.somas}</span><div><b>${esc(r.tipo === "manual" ? nomeCat(r.cat) : r.rotulo)}</b><span class="sub">${FOCO.NOMES[r.tipo]} · ${hora(r.ini)} · ${FOCO.dur(r.seg)}</span></div>
      ${r.tipo === "manual" ? `<label class="sr" for="c-${r.id}">Categoria</label><select id="c-${r.id}" data-reg="${r.id}"><option value="">Sem categoria</option>${st.foco.cats.filter(c => !c.off || c.id === r.cat).map(c => `<option value="${c.id}" ${c.id === r.cat ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select>` : ""}</li>`).join("")}</ul>`
      : `<p class="sub">Nada ainda hoje. A primeira soma chega com 20 min de aula ou 30 min aqui.</p>`}`;
  el.querySelectorAll("[data-reg]").forEach(sel => sel.onchange = () => { const r = st.foco.sessoes.find(x => x.id === sel.dataset.reg); r.cat = sel.value || null; salvar(); listaHoje(); });
}
function listaCats() {
  const el = $("#fcats"); if (!el) return; const cs = catsAtivas();
  el.innerHTML = cs.length ? cs.map(c => `<span class="pill cat-pill" style="--c:${c.cor}"><i class="ponto"></i>${esc(c.nome)}<button class="x" data-off="${c.id}" aria-label="Remover ${esc(c.nome)}">×</button></span>`).join("") : `<span class="sub">Nenhuma categoria ainda.</span>`;
  el.querySelectorAll("[data-off]").forEach(b => b.onclick = () => { const c = st.foco.cats.find(x => x.id === b.dataset.off); c.off = true; if (st.foco.ultimaCat === c.id) st.foco.ultimaCat = null; salvar(); desenharFoco(); toast(`"${c.nome}" removida. As sessões antigas continuam com ela.`); });
}

/* ---------- bloco da tela Progresso ---------- */
function secaoFocoProgresso() {
  const regs = st.foco.sessoes; const r = FOCO.resumo(regs);
  const semana = []; for (let i = 6; i >= 0; i--) semana.push(addDias(-i));
  const s7 = semana.reduce((a, d) => a + ((r.dia[d] || {}).somas || 0), 0);
  const sy = ultimaSync();
  const syncTxt = MODO === "arquivo" ? "Modo arquivo: não sincroniza, o progresso fica só neste navegador."
    : sy ? `Última sincronização: <b>${sy.toLocaleDateString("pt-BR")} às ${sy.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</b>` : "Ainda não sincronizou neste aparelho.";
  const barras = (obj, nome, cor) => { const ks = Object.keys(obj).sort((a, b) => obj[b].seg - obj[a].seg); const max = Math.max(1, ...ks.map(k => obj[k].seg));
    return ks.length ? ks.map(k => `<div style="--c:${cor(k)}"><div class="row entre"><b>${esc(nome(k))}</b><span class="sub" style="font-variant-numeric:tabular-nums">+${obj[k].somas} · ${FOCO.dur(obj[k].seg)}</span></div><div class="bar"><i style="width:${obj[k].seg / max * 100}%"></i></div></div>`).join("") : `<p class="sub">Sem dados ainda.</p>`; };
  const manuais = FOCO.resumo(regs.filter(x => x.tipo === "manual")).cat;
  const semCat = regs.filter(x => x.tipo === "manual" && !x.cat); if (semCat.length) manuais["__sem"] = FOCO.resumo(semCat).total;
  const corCat = k => (st.foco.cats.find(c => c.id === k) || {}).cor || "var(--mu2)";
  const COR_TIPO = { aula: "var(--ac)", cartoes: "var(--teal)", ia: "#a98bf0", manual: "var(--ok)" };
  return `<section class="card grid" style="gap:16px"><div class="row entre"><h3>${ico("foco")} acrescentou.ai</h3><a class="link" href="#foco">Abrir o contador ${ico("dir")}</a></div>
    <div class="grid g3"><div class="bloco"><div class="grande" style="--c:var(--ok)">+${r.total.somas}</div><span class="sub">somas no total</span></div><div class="bloco"><div class="grande" style="--c:var(--teal)">${FOCO.dur(r.total.seg)}</div><span class="sub">de foco registrado</span></div><div class="bloco"><div class="grande" style="--c:var(--warn)">+${s7}</div><span class="sub">somas nos últimos 7 dias</span></div></div>
    <div class="grid g2" style="gap:22px"><div class="grid" style="gap:12px"><h3>Por atividade</h3>${barras(r.tipo, k => FOCO.NOMES[k] || k, k => COR_TIPO[k] || "var(--ac)")}</div>
    <div class="grid" style="gap:12px"><h3>Foco livre por categoria</h3>${barras(manuais, k => k === "__sem" ? "Sem categoria" : nomeCat(k), corCat)}</div></div>
    <p class="sub">${ico("nuvem")} ${syncTxt}</p></section>`;
}
