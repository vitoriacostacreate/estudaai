/* ============ AULA ============ */
const PASSOS = [["mapa", "Mapa"], ["lembre", "Lembre"], ["aprenda", "Aprenda"], ["pratique", "Pratique"], ["teste", "Teste"], ["explique", "Explique"], ["feito", "Feito"]];
let sessao = {};
function telaAula(app, tid, passo) {
  const a = aula(tid); const info = acharTopico(tid);
  if (!a || !info) { app.innerHTML = `<div class="card">Aula não encontrada. <a href="#temas">Voltar aos temas</a></div>`; return; }
  if (sessao.tid !== tid) sessao = { tid, quiz: {}, qi: 0 };
  const t = info.tema; const cor = t.cor;   /* a cor do tema identifica a aula; a da disciplina fica só na trilha */
  const passos = PASSOS.filter(p => p[0] !== "pratique" || a.widget);
  const idx = passos.findIndex(p => p[0] === passo); const atual = idx < 0 ? 0 : idx;
  app.style.setProperty("--c", cor);
  const ferramentas = [
    a.fonte && MODO !== "arquivo" ? `<a class="btn sm ghost" href="${urlPDF(a.fonte.doc, a.fonte.pi)}" target="_blank" rel="noopener">${ico("arquivo")}Abrir no PDF · p. ${a.fonte.pi}${a.fonte.pf > a.fonte.pi ? "–" + a.fonte.pf : ""}</a>` : "",
    a.fonte && MODO !== "arquivo" ? `<button class="btn sm ghost" id="trecho">${ico("ler")}Ler o trecho original</button>` : "",
    a.auto ? `<button class="btn sm" id="melhorar">${ico("brilho")}${INFO.ia ? "Melhorar com IA" : "Melhorar com IA (copiar pedido)"}</button>` : "",
  ].filter(Boolean).join("");
  app.innerHTML = `<section class="aula-cab" style="--c:${cor}">
    <a class="migalha" href="#tema-${t.id}">${ico("voltar")}${iconeTema(t, "sm")}${esc(t.nome)}<span class="sep-m">/</span>${esc(info.disc.nome)}</a>
    <h1>${esc(a.titulo)}</h1>${a.ideia ? `<p class="ideia">${esc(a.ideia)}</p>` : ""}
    ${ferramentas ? `<div class="row ferramentas">${ferramentas}</div>` : ""}
    ${a.auto ? `<p class="aviso-auto">${ico("brilho")}<span>Aula <b>automática</b>, montada do PDF sem IA. Serve para revisar; com IA fica bem mais completa.</span></p>` : ""}
    <nav class="steps" aria-label="Passos da aula">${passos.map((p, i) => `<button class="${i === atual ? "on" : ""} ${i < atual ? "ok" : ""}" data-p="${p[0]}" ${i === atual ? 'aria-current="step"' : ""}><span>${i < atual ? ico("check") : i + 1}</span>${p[1]}</button>`).join("")}</nav></section>
    <section id="corpo" style="--c:${cor}"></section>
    <nav class="aula-nav" style="--c:${cor}" aria-label="Navegar entre passos">
      ${atual > 0 ? `<button class="btn ghost" id="ant">${ico("voltar")}<span class="l">${passos[atual - 1][1]}</span></button>` : `<a class="btn ghost" href="#tema-${t.id}">${ico("voltar")}<span class="l">Trilha</span></a>`}
      <span class="sub">Passo ${atual + 1} de ${passos.length}</span>
      ${atual < passos.length - 1 ? `<button class="btn pri" id="prox"><span class="l">Próximo:</span> ${passos[atual + 1][1]}${ico("seta")}</button>` : `<a class="btn pri" href="#inicio">Próximo passo do dia${ico("seta")}</a>`}
    </nav>`;
  app.querySelectorAll(".steps button").forEach(b => b.onclick = () => location.hash = `aula-${tid}-${b.dataset.p}`);
  const passoAtual = $(".steps .on"); if (passoAtual) passoAtual.scrollIntoView({ inline: "center", block: "nearest" });   /* no celular a faixa rola até o passo atual */
  if ($("#trecho")) $("#trecho").onclick = () => { const texto = textoTopico(tid); abrirModal(`<div class="eyebrow">Trecho original · p. ${a.fonte.pi}–${a.fonte.pf}</div><h2>${esc(a.titulo)}</h2><div style="white-space:pre-wrap;max-width:72ch">${esc(texto)}</div><div class="row"><button class="btn" data-fechar>Fechar</button></div>`); };
  if ($("#melhorar")) $("#melhorar").onclick = () => INFO.ia ? gerarComIA(tid) : modalGerar(tid);
  if ($("#ant")) $("#ant").onclick = () => location.hash = `aula-${tid}-${passos[atual - 1][0]}`;
  if ($("#prox")) $("#prox").onclick = () => location.hash = `aula-${tid}-${passos[atual + 1][0]}`;
  const corpo = $("#corpo"); const p = passos[atual][0];
  if (p === "mapa") passoMapa(corpo, a, cor);
  if (p === "lembre") passoLembre(corpo, a, tid);
  if (p === "aprenda") corpo.innerHTML = `<div class="conteudo">${a.blocos.map(b => `<article class="bloco"><h3>${esc(b.t)}</h3>${limparHTML(b.html)}</article>`).join("")}</div>`;
  if (p === "pratique") { corpo.innerHTML = `<div class="conteudo" id="wbox"></div>`; montarWidget($("#wbox"), a, cor); }
  if (p === "teste" && $("#prox")) {
    const prox = $("#prox"); const padrao = prox.innerHTML; const irPasso = prox.onclick;
    passoTeste(corpo, a, tid, (rotulo, avancar) => {      /* enquanto há questão na tela, o botão de baixo anda pelas questões */
      prox.innerHTML = rotulo ? `${rotulo}${ico("seta")}` : padrao;
      prox.onclick = rotulo ? avancar : irPasso;
    });
  } else if (p === "teste") passoTeste(corpo, a, tid);
  if (p === "explique") passoExplique(corpo, a, tid);
  if (p === "feito") passoFeito(corpo, a, tid, info);
}
function passoMapa(el, a, cor) {
  el.innerHTML = `<div class="conteudo" style="max-width:none"><div class="row entre instrucao"><p class="sub">Olhe o mapa por 1 minuto. Depois esconda e tente dizer em voz alta o que tinha em cada ramo.</p><button class="btn sm" id="esconder">Esconder detalhes</button></div>
  <div class="mapa" id="mapa"><div class="raiz">${esc(a.mapa.raiz)}</div>${a.mapa.ramos.map((r, i) => `<div class="ramo" style="--rc:${CORES[i % CORES.length]}"><b>${esc(r[0])}</b><ul>${r[1].map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div></div>`;
  $("#esconder").onclick = e => { const m = $("#mapa"); m.classList.toggle("oculto"); e.target.textContent = m.classList.contains("oculto") ? "Mostrar detalhes" : "Esconder detalhes"; };
}
function passoLembre(el, a, tid) {
  const n = st.notas[tid] || {};
  el.innerHTML = `<div class="lembre"><p class="sub">Antes de aprender, tente responder <b>sem olhar</b>. Errar agora é bom: o cérebro fica curioso e guarda melhor a resposta certa depois.</p>
  ${a.recupere.map((q, i) => `<div><label for="r${i}">${i + 1}. ${esc(q)}</label><textarea id="r${i}" placeholder="Escreva o que vier à cabeça…">${esc((n.lembre || [])[i] || "")}</textarea></div>`).join("")}</div>`;
  el.querySelectorAll("textarea").forEach((ta, i) => ta.oninput = () => { st.notas[tid] ||= {}; (st.notas[tid].lembre ||= [])[i] = ta.value; salvar(); });
}
/* Teste: uma questão por vez. A resposta fica guardada (s.resp) e reaparece ao voltar à questão;
   o placar leva a qualquer questão; o botão "Próximo" de baixo anda pelas questões antes de ir ao passo seguinte. */
function passoTeste(el, a, tid, nav) {
  const qz = a.quiz; const s = sessao; s.resp ||= {};
  const placar = () => `<div class="placar" role="group" aria-label="Questões">${qz.map((_, k) => `<button class="${s.quiz[k] === true ? "c" : s.quiz[k] === false ? "e" : ""} ${k === s.qi ? "on" : ""}" data-q="${k}" aria-label="Questão ${k + 1}${s.quiz[k] === undefined ? "" : s.quiz[k] ? ", acertou" : ", errou"}"></button>`).join("")}</div>`;
  const ir = i => { s.qi = Math.max(0, Math.min(i, qz.length)); desenhar(); };
  const feedback = (i, rolar) => {
    const q = qz[i]; const k = s.resp[i]; const certo = s.quiz[i];
    el.querySelectorAll(".opt").forEach(b => { b.disabled = true; const bk = +b.dataset.k; if (bk === q.a) b.classList.add("certa"); else if (bk === k) b.classList.add("errada"); });
    $("#fb").innerHTML = `<div class="exp"><b>${certo ? "Isso!" : "Quase."}</b> ${esc(q.e || "")}</div><div class="row" style="margin-top:10px"><button class="btn pri" id="seg">${i + 1 < qz.length ? "Próxima questão" : "Ver resultado"}${ico("seta")}</button></div>`;
    $("#seg").onclick = () => ir(i + 1);
    if (rolar) $("#fb").scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const desenhar = () => {
    const i = s.qi;
    if (nav) nav(i < qz.length ? (i + 1 < qz.length ? "Próxima questão" : "Ver resultado") : null, () => ir(i + 1));
    if (i >= qz.length) {
      const ac = Object.values(s.quiz).filter(Boolean).length; const resp = Object.keys(s.quiz).length;
      el.innerHTML = `<div class="q"><h3>Resultado: ${ac} de ${qz.length}</h3>${placar()}<p class="sub">${resp < qz.length ? `Faltam ${qz.length - resp} questões: toque numa barrinha cinza para responder.` : ac / qz.length >= .8 ? "Excelente. Agora explique com suas palavras." : ac / qz.length >= .6 ? "Bom. Os erros vão para a Revisão com IA." : "Normal errar no começo. A Revisão com IA explica cada erro."}</p><div class="row"><button class="btn" id="refazer">${ico("refazer")}Refazer o teste</button></div></div>`;
      $("#refazer").onclick = () => { s.quiz = {}; s.resp = {}; s.qi = 0; desenhar(); };
    } else {
      const q = qz[i]; const ordem = s["ord" + i] ||= shuffle(q.o.map((_, k) => k));
      el.innerHTML = `<div class="q">${placar()}<span class="eyebrow">Questão ${i + 1} de ${qz.length}</span><h3>${esc(q.q)}</h3>${ordem.map((k, n) => `<button class="opt" data-k="${k}"><b class="letra">${"ABCDEFG"[n]}</b>${esc(q.o[k])}</button>`).join("")}<div id="fb" aria-live="polite"></div></div>`;
      if (s.quiz[i] !== undefined) feedback(i, false);
      else el.querySelectorAll(".opt").forEach(b => b.onclick = () => { const k = +b.dataset.k; s.resp[i] = k; s.quiz[i] = k === q.a; feedback(i, true); el.querySelector(".placar").outerHTML = placar(); ligarPlacar(); });
    }
    ligarPlacar();
  };
  const ligarPlacar = () => el.querySelectorAll(".placar button").forEach(b => b.onclick = () => ir(+b.dataset.q));
  desenhar();
}
function passoExplique(el, a, tid) {
  const f = a.feynman || { pergunta: "Explique o tema com suas palavras.", chaves: [] };
  const n = (st.notas[tid] || {}).feynman || "";
  el.innerHTML = `<div class="lembre"><p class="sub">Técnica Feynman: se você consegue explicar de forma simples, você entendeu. As palavras-chave acendem quando aparecem no seu texto.</p><label for="fey">${esc(f.pergunta)}</label><textarea id="fey" style="min-height:150px" placeholder="Explique como se fosse para alguém de 12 anos…">${esc(n)}</textarea><div class="row" id="chaves"></div></div>`;
  const ta = $("#fey"); const norm = s => semAcento(s.toLowerCase());
  const pinta = () => { const v = norm(ta.value); $("#chaves").innerHTML = f.chaves.map(c => `<span class="pill ${v.includes(norm(c)) ? "ok" : ""}">${esc(c)}</span>`).join("") + `<span class="sub" style="font-size:13px">${f.chaves.filter(c => v.includes(norm(c))).length}/${f.chaves.length} palavras-chave</span>`; };
  ta.oninput = () => { st.notas[tid] ||= {}; st.notas[tid].feynman = ta.value; salvar(); pinta(); }; pinta();
}
function passoFeito(el, a, tid, info) {
  const s = sessao; const tot = a.quiz.length; const feitos = Object.keys(s.quiz).length; const ac = Object.values(s.quiz).filter(Boolean).length;
  const pos = () => `<p class="exp ok" style="margin-top:12px">${ico("check")}<span>Respostas registradas. Elas aguardam na <b>Revisão com IA</b> (${pendentesIA().length} na fila): junte quantas aulas quiser e mande revisar de uma vez.</span></p><div class="row"><a class="btn pri" href="#ia">${ico("brilho")}Ir para a Revisão com IA</a><a class="btn" href="#inicio">Próximo passo do dia</a><a class="btn ghost" href="#tema-${info.tema.id}">Voltar à trilha</a></div>`;
  el.innerHTML = `<div class="conteudo"><article class="bloco"><h3>Fechar a aula</h3>
    <p>${feitos === tot ? `Você acertou <b>${ac} de ${tot}</b> no teste.` : `Você respondeu ${feitos} de ${tot} questões. Dá para registrar assim mesmo, ou voltar ao <a href="#aula-${tid}-teste">Teste</a>.`}</p>
    <p class="sub">Registrar guarda suas alternativas, o Lembre e o Feynman para a Revisão com IA conferir com o material e com fontes da internet.</p>
    <div class="row"><button class="btn pri" id="reg" ${s.registrada ? "disabled" : ""}>${ico("check")}Registrar respostas</button></div><div id="pos">${s.registrada ? pos() : ""}</div></article>
    ${ultimoPlacar && ultimoPlacar.ref === tid && Date.now() - ultimoPlacar.fim < 6e5 ? `<article class="bloco placar-bloco">${placarHTML(ultimoPlacar)}</article>` : ""}
    <article class="bloco" id="curios"></article>
    ${a.fontes && a.fontes.length ? `<article class="bloco"><h3>Para ir além</h3><ul>${a.fontes.map(x => `<li>${esc(x)}</li>`).join("")}</ul></article>` : ""}</div>`;
  $("#reg").onclick = () => {
    registrarAula(tid, ac, feitos); registrarTentativa(tid, a, s);
    marcarFeito("aula-" + tid, "rev-" + tid); s.registrada = true; salvar();
    $("#pos").innerHTML = pos(); $("#reg").disabled = true; topo("temas");
  };
  blocoDuvidas($("#curios"), tid);
}
/* Campo aberto do fim da aula: curiosidades e dúvidas para pesquisar depois (viram o arquivo semanal). */
function blocoDuvidas(el, tid) {
  const minhas = st.duvidas.filter(d => d.tid === tid && !d.enviada);
  el.innerHTML = `<h3>Fiquei curiosa sobre…</h3><p class="sub">Anote dúvidas e curiosidades para pesquisar depois. Toda semana elas viram um arquivo .md para uma IA pesquisar e resumir do seu jeito.</p>
    <div class="grid" style="gap:8px;margin-top:10px"><label for="duv" class="sr">Nova dúvida</label><textarea id="duv" placeholder="Ex.: por que a bomba de sódio-potássio troca 3 por 2, e não 1 por 1?"></textarea>
    <div class="row"><button class="btn" id="anotar">${ico("mais")}Anotar</button><a class="link" href="#ia-duvidas">Ver todas as dúvidas ${ico("dir")}</a></div></div>
    ${minhas.length ? `<ul class="duvidas">${minhas.map(d => `<li><span>${esc(d.texto)}</span><button class="btn sm ghost" data-del="${d.id}" aria-label="Apagar dúvida">${ico("lixo")}</button></li>`).join("")}</ul>` : ""}`;
  $("#anotar", el).onclick = () => { if (anotarDuvida($("#duv", el).value, tid)) { toast("Dúvida anotada"); blocoDuvidas(el, tid); } };
  el.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { apagarDuvida(b.dataset.del); blocoDuvidas(el, tid); });
}
