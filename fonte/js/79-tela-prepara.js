/* ============ prepara.ai: imersões para montar o plano de mudança ============
   #prepara = mapa das imersões e painel do plano · #prepara-<id> = uma imersão (Entenda → Faça → Saída).
   Conteúdo em PREPARA (fonte/prepara-mudanca.js), contas em PREP (46-prepara.js), respostas em st.prepara. */
const PCOR = () => PREPARA.meta.cor;
const nFontes = () => (PREPARA.imersoes.find(i => i.id === "fontes") || {}).n || "";
const pr = () => st.prepara;
function telaPrepara(app, id) {
  const im = id && PREPARA.imersoes.find(i => i.id === id);
  if (im) return telaImersao(app, im);
  const g = PREP.geral(PREPARA.imersoes, pr().r, pr().concluidas), dias = diasAte(PREPARA.meta.data);
  const proxima = PREPARA.imersoes.find(i => !pr().concluidas[i.id]);
  app.innerHTML = `<div style="--c:${PCOR()};gap:28px" class="grid">
    <header class="cab"><div><span class="eyebrow">prepara.ai</span><h1>Em ${PREPARA.meta.dataBR.slice(0, 5)}, no avião</h1>
      <p class="sub">Imersões de 20 a 90 min: você para, aprende como funciona e já preenche o seu plano. Meta: no avião ou pousando lá fora em <b>${PREPARA.meta.dataBR}</b>, gastando o mínimo e com trabalho previsto.</p></div>
      <div class="row"><button class="btn" id="pia">${ico("brilho")}Pedir à IA para achar riscos</button><button class="btn ghost" id="pbaixar">${ico("baixar")}Baixar meu plano (.md)</button></div></header>
    <section class="prep-topo">
      <div class="card prep-conta"><div class="grande">${Math.max(0, dias)}</div><span class="sub">${dias === 1 ? "dia" : "dias"} até ${PREPARA.meta.dataBR}</span></div>
      <div class="card prep-conta"><div class="grande">${g.concluidas}/${g.imersoes}</div><span class="sub">imersões concluídas</span><div class="bar"><i style="width:${g.p * 100}%"></i></div><span class="sub" style="font-size:13px">${g.feitas} de ${g.total} tarefas</span></div>
      ${proxima ? `<a class="card prep-prox" href="#prepara-${proxima.id}"><span class="eyebrow">Próxima imersão</span><b>${proxima.n}. ${esc(proxima.titulo)}</b><span class="sub">${proxima.tempo} · ${esc(proxima.objetivo)}</span><span class="btn pri">${ico("play")}Começar</span></a>`
        : `<div class="card prep-prox"><span class="eyebrow">Tudo concluído</span><b>Seu plano está montado.</b><span class="sub">Revise os marcos toda semana e baixe o .md atualizado.</span></div>`}
    </section>
    ${cardEstrategia()}
    <section class="card prep-pergunta"><span class="eyebrow">A pergunta, lapidada</span>
      <p class="riscado">${esc(PREPARA.pergunta.original)}</p><p class="nova">${esc(PREPARA.pergunta.texto)}</p>
      <ul>${PREPARA.pergunta.porque.map(x => `<li>${limparHTML(x)}</li>`).join("")}</ul></section>
    <section><h2 class="titulo-sec">Imersões</h2><div class="prep-trilha">${PREPARA.imersoes.map(cardImersao).join("")}</div></section>
    <section class="grid g2">${painelPlano()}</section>
    ${pr().ia ? `<section class="card prep-ia"><div class="row entre"><h3>${ico("brilho")} Riscos apontados pela IA</h3><span class="sub">${fmt(pr().ia.data)} · ${esc(NOME_IA[pr().ia.provedor] || pr().ia.provedor)}</span></div><div class="prep-txt md">${mdParaHTML(pr().ia.md)}</div>
      <p class="sub" style="font-size:13px">A IA erra. Toda regra, valor ou prazo citado aqui precisa ser conferido na fonte oficial (imersão ${nFontes()}).</p></section>` : ""}</div>`;
  $("#pbaixar").onclick = baixarPlano;
  $("#pia").onclick = () => revisarPlanoIA(app);
}
/* Revisão do plano pela IA do app (mesma cadeia da revisão das aulas). Sem IA disponível: copia o pedido e abre o chat. */
async function revisarPlanoIA(app) {
  const prompt = PREP.promptIA(PREPARA, pr(), hojeStr()), b = $("#pia");
  if (!cadeiaIA("revisao").length) return copiarEAbrir(prompt, chatPreferido());
  b.disabled = true; b.innerHTML = `${ico("brilho")}A IA está lendo o seu plano...`;
  try {
    const r = await iaTexto(prompt, "revisao"); const md = String(r.texto || "").trim(); if (!md) throw new Error("A resposta veio vazia.");
    pr().ia = { data: hojeStr(), provedor: r.provedor, md }; marcarDia(1); salvar(); toast("Revisão pronta"); telaPrepara(app, null);
    const el = $(".prep-ia"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    toast((e && e.message) || "A IA não respondeu. Copiei o pedido para você colar no chat."); copiarEAbrir(prompt, chatPreferido());
    b.disabled = false; b.innerHTML = `${ico("brilho")}Pedir à IA para achar riscos`;
  }
}
/* A estratégia em 3 passos: o mapa do plano inteiro, antes das imersões. */
const cardEstrategia = () => { const E = PREPARA.estrategia; if (!E) return "";
  return `<section class="card prep-estr" aria-label="Estratégia"><div class="row entre"><span class="eyebrow">A estratégia</span><span class="pill ac">${esc(E.lema)}</span></div><h2>${esc(E.titulo)}</h2>
    <ol>${E.passos.map((p, i) => `<li><span class="prep-n">${i + 1}</span><div><b>${esc(p.t)}</b><span class="sub">${esc(p.d)}</span></div></li>`).join("")}</ol></section>`; };
function cardImersao(im) {
  const p = PREP.progresso(im, pr().r), ok = pr().concluidas[im.id];
  return `<a class="card prep-im ${ok ? "ok" : ""}" href="#prepara-${im.id}"><span class="prep-n">${ok ? ico("check") : im.n}</span>
    <div><b>${esc(im.titulo)}</b><span class="sub">${im.tempo} · ${p.feitas}/${p.total} tarefas</span><div class="bar fino"><i style="width:${p.p * 100}%"></i></div></div>${ico("dir")}</a>`;
}
/* Resumo vivo do plano: idade × Working Holiday, ranking, dinheiro, Go/No-Go. */
function painelPlano() {
  const r = pr().r, wh = PREP.faixaWH(r.idade), c = PREP.capital(r, pr().bens);
  const rk = PREP.matriz(PREPARA.rotas, PREPARA.criterios, pr().notas, pr().pesos), go = PREP.gonogo(PREPARA.gonogo, r);
  const linha = (rot, val, cls = "") => `<div class="row entre prep-linha"><span class="sub">${rot}</span><b class="${cls}">${val}</b></div>`;
  return `<div class="card grid" style="gap:10px"><h3>${ico("mala")} Meu plano agora</h3>
      ${linha("Rota A", r.rota_a ? esc(PREP.rotaNome(PREPARA.rotas, r.rota_a)) : "a definir")}
      ${linha("Rota B", r.rota_b ? esc(PREP.rotaNome(PREPARA.rotas, r.rota_b)) : "a definir")}
      ${linha("Working Holiday (18 a 30 anos)", wh == null ? "preencha a idade" : wh ? "dentro da faixa" : "fora da faixa", wh == null ? "" : wh ? "t-ok" : "t-bad")}
      ${linha("Capital líquido no embarque", PREP.brl(c.liquido), c.liquido < 0 ? "t-bad" : "")}
      ${c.meta ? linha("Falta para a meta da rota A", c.falta ? PREP.brl(c.falta) : "meta atingida", c.falta ? "t-warn" : "t-ok") : ""}
      ${linha("Go/No-Go", go.vai ? "VAI" : `ainda não (${go.faltam.length} críticos)`, go.vai ? "t-ok" : "t-warn")}</div>
    <div class="card grid" style="gap:10px"><h3>${ico("alvo")} Ranking das rotas</h3>
      ${rk.length ? rk.slice(0, 5).map(x => `<div><div class="row entre"><span>${esc(x.nome)}</span><span class="sub" style="font-variant-numeric:tabular-nums">${x.total}/${x.max}</span></div><div class="bar"><i style="width:${x.pct * 100}%"></i></div></div>`).join("")
        : `<p class="sub">Dê notas às rotas na imersão 3 para ver o ranking aqui.</p><a class="link" href="#prepara-caminhos">Abrir o mapa dos caminhos ${ico("dir")}</a>`}</div>`;
}
function baixarPlano() { baixarArquivo(`plano-mudanca-${hojeStr()}.md`, PREP.markdown(PREPARA, pr(), hojeStr()), undefined, "Plano baixado"); }

/* ---------- uma imersão ---------- */
function telaImersao(app, im) {
  const i = PREPARA.imersoes.indexOf(im), ant = PREPARA.imersoes[i - 1], prox = PREPARA.imersoes[i + 1];
  app.innerHTML = `<div style="--c:${PCOR()}" class="grid prep-imersao">
    <a class="migalha" href="#prepara">${ico("voltar")}prepara.ai</a>
    <header class="cab"><div><span class="eyebrow">Imersão ${im.n} de ${PREPARA.imersoes.length} · ${im.tempo}</span><h1>${esc(im.titulo)}</h1><p class="sub">${esc(im.objetivo)}</p></div>
      <div class="prep-prog" id="pprog"></div></header>
    <section class="card prep-mapa" aria-label="Mapa da imersão"><span class="eyebrow">O mapa desta imersão</span>
      <ol>${(im.mapa || []).map((m, k) => `<li><span class="prep-n sm">${k + 1}</span>${esc(m)}</li>`).join("")}</ol>
      ${im.minimo ? `<p class="prep-min">${ico("chama")}<span><b>Dia ruim?</b> Faça só isto (10 min): ${esc(im.minimo)}</span></p>` : ""}</section>
    <ol class="prep-passos"><li><a href="#p-entenda">${ico("ler")}Entenda</a></li>${im.recupere ? `<li><a href="#p-recupere">${ico("brilho")}Recupere</a></li>` : ""}<li><a href="#p-faca">${ico("check")}Faça</a></li><li><a href="#p-saida">${ico("estrela")}Saída</a></li></ol>
    <section id="p-entenda" class="grid" style="gap:12px"><h2 class="titulo-sec">Entenda</h2>${im.entenda.map(b => `<article class="card prep-bloco"><h3>${esc(b.t)}</h3><div class="prep-txt">${limparHTML(b.html)}</div></article>`).join("")}
      ${im.id === "caminhos" ? `<div class="prep-rotas">${PREPARA.rotas.map(cardRota).join("")}</div><p class="sub" style="font-size:13px">Conferido em ${PREPARA.meta.verificadoBR}. Regras mudam: antes de pagar qualquer coisa, abra a fonte oficial na imersão ${nFontes()}.</p>` : ""}
      ${im.id === "fontes" ? `<article class="card prep-bloco"><h3>Fontes oficiais</h3><ul class="prep-fontes">${PREPARA.fontes.map(f => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nome)}</a></li>`).join("")}</ul></article>` : ""}</section>
    ${im.recupere ? `<section id="p-recupere" class="card prep-quiz" aria-live="polite"></section>` : ""}
    <section id="p-faca" class="card grid" style="gap:16px"><h2 class="titulo-sec">Faça</h2><div class="grid" style="gap:18px" id="pfaca">${im.faca.map(campoTarefa).join("")}</div></section>
    <section id="p-saida" class="card prep-saida"><span class="eyebrow">O que você leva desta imersão</span><p>${esc(im.saida)}</p>
      <div class="row"><button class="btn pri" id="pconc">${ico("check")}${pr().concluidas[im.id] ? "Concluída (desmarcar)" : "Concluir imersão"}</button></div></section>
    <nav class="row entre">${ant ? `<a class="btn ghost" href="#prepara-${ant.id}">${ico("voltar")}${esc(ant.titulo)}</a>` : `<span></span>`}${prox ? `<a class="btn" href="#prepara-${prox.id}">${esc(prox.titulo)}${ico("seta")}</a>` : `<a class="btn" href="#prepara">Voltar ao plano${ico("seta")}</a>`}</nav></div>`;
  ligarCampos(im); desenharQuiz(im);
  if (im.id === "cronograma") { pr().revisado = hojeStr(); salvar(); }   /* abrir o cronograma conta como a revisão semanal dos marcos */
  $("#pconc").onclick = () => { pr().concluidas[im.id] = !pr().concluidas[im.id]; salvar();
    if (pr().concluidas[im.id]) { marcarDia(1); toast(`Imersão ${im.n} concluída`); location.hash = prox ? "#prepara-" + prox.id : "#prepara"; } else telaImersao(app, im); };
  progImersao(im);
}
/* Recupere: 1 pergunta no meio da imersão. Errou → dica e mais uma tentativa; na segunda, mostra a certa e o porquê. */
function desenharQuiz(im) {
  const el = $("#p-recupere"), q = im.recupere; if (!el || !q) return;
  const k = "q_" + im.id, est = pr().r[k] || { t: 0, e: null, ok: false }, fim = est.ok || est.t >= 2;
  const cls = i => !est.t ? "" : i === q.c && fim ? "certa" : i === est.e && !est.ok ? "errada" : "";
  el.innerHTML = `<h2 class="titulo-sec">${ico("brilho")} Recupere, sem olhar acima</h2><p class="prep-q">${esc(q.p)}</p>
    <div class="prep-ops">${q.op.map((o, i) => `<button type="button" class="prep-op ${cls(i)}" data-op="${i}" ${fim ? "disabled" : ""}><span class="l">${"ABCDE"[i]}</span>${esc(o)}</button>`).join("")}</div>
    ${est.ok ? `<p class="prep-fb ok">${ico("check")}<span><b>Isso.</b> ${esc(q.por)}</span></p>`
      : est.t === 1 ? `<p class="prep-fb warn"><span><b>Quase.</b> Volte ao bloco "Entenda", releia só o título que tem a ver com a pergunta e tente mais uma vez.</span></p>`
      : est.t >= 2 ? `<p class="prep-fb bad"><span><b>A certa é a ${"ABCDE"[q.c]}.</b> ${esc(q.por)}</span></p>` : ""}
    ${fim ? `<button type="button" class="btn sm ghost" id="qrefazer">Refazer depois</button>` : ""}`;
  el.querySelectorAll("[data-op]").forEach(b => b.onclick = () => { const i = +b.dataset.op; pr().r[k] = { t: est.t + 1, e: i, ok: i === q.c }; salvar(); desenharQuiz(im); });
  const rf = $("#qrefazer"); if (rf) rf.onclick = () => { delete pr().r[k]; salvar(); desenharQuiz(im); };
}
function progImersao(im) { const el = $("#pprog"); if (!el) return; const p = PREP.progresso(im, pr().r); el.innerHTML = `<span class="sub">${p.feitas}/${p.total} tarefas</span><div class="bar"><i style="width:${p.p * 100}%"></i></div>`; }
const CABE = { sim: ["ok", "Cabe até 08/02"], talvez: ["med", "Depende de vaga ou prazo"], nao: ["bad", "Não cabe nesta janela"] };
function cardRota(rt) {
  const [cls, txt] = CABE[rt.cabe];
  return `<article class="card prep-rota"><div class="row entre"><span class="pill">${esc(rt.grupo)}</span><span class="pill ${cls}">${txt}</span></div><h3>${esc(rt.nome)}</h3>
    <dl><dt>Requisito</dt><dd>${esc(rt.req)}</dd><dt>Custo</dt><dd>${esc(rt.custo)}</dd><dt>Prazo</dt><dd>${esc(rt.prazo)}</dd><dt>Idioma</dt><dd>${esc(rt.idioma)}</dd></dl><p class="sub">${esc(rt.obs)}</p></article>`;
}

/* ---------- campos das tarefas ---------- */
function campoTarefa(t) {
  const r = pr().r, v = r[t.id] == null ? "" : r[t.id], dica = t.dica ? `<span class="sub prep-dica">${esc(t.dica)}</span>` : "";
  if (t.tipo === "check") return `<label class="prep-check"><input type="checkbox" data-k="${t.id}" ${v ? "checked" : ""}><span>${esc(t.rotulo)}</span></label>`;
  if (t.tipo === "escolha") return `<fieldset class="prep-campo"><legend>${esc(t.rotulo)}</legend><div class="row">${t.opcoes.map(([val, rot]) => `<button type="button" class="btn sm cat ${v === val ? "on" : ""}" data-esc="${t.id}" data-v="${val}" aria-pressed="${v === val}">${esc(rot)}</button>`).join("")}</div>${dica}</fieldset>`;
  if (t.tipo === "widget") return `<div class="prep-campo"><span class="prep-rot">${esc(t.rotulo)}</span><div id="w-${t.widget}"></div></div>`;
  const id = "f-" + t.id;
  if (t.tipo === "rota") {   /* lista das rotas, agrupada pelo "cabe até 08/02"; texto antigo vira uma opção para não sumir */
    const grupo = (c, rot) => `<optgroup label="${rot}">${PREPARA.rotas.filter(x => x.cabe === c).map(x => `<option value="${x.id}" ${v === x.id ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</optgroup>`;
    const livre = v && !PREPARA.rotas.some(x => x.id === v) ? `<option value="${esc(v)}" selected>${esc(v)}</option>` : "";
    return `<div class="prep-campo"><label class="prep-rot" for="${id}">${esc(t.rotulo)}</label><select id="${id}" data-k="${t.id}"><option value="">Escolha a rota</option>${livre}${grupo("sim", "Cabe até 08/02")}${grupo("talvez", "Depende de vaga ou prazo")}${grupo("nao", "Não cabe nesta janela (plano C)")}</select>${dica}</div>`;
  }
  const ctrl = t.tipo === "longo" ? `<textarea id="${id}" data-k="${t.id}">${esc(v)}</textarea>`
    : `<input type="text" id="${id}" data-k="${t.id}" value="${esc(v)}" ${t.tipo === "numero" ? 'inputmode="decimal"' : ""}>`;
  return `<div class="prep-campo"><label class="prep-rot" for="${id}">${esc(t.rotulo)}</label>${ctrl}${dica}${t.id === "din_meta" ? `<div id="w-meta" aria-live="polite"></div>` : ""}</div>`;
}
/* Meta sugerida: comprovação mínima da rota A convertida pela cotação que ela digitou. Um clique preenche a meta. */
function desenharMeta() {
  const el = $("#w-meta"); if (!el) return; const r = pr().r, rota = PREPARA.rotas.find(x => x.id === r.rota_a), m = PREP.metaRota(rota, r);
  const sim = { EUR: "€", USD: "US$", NZD: "NZD" };
  el.innerHTML = !rota ? `<p class="sub prep-dica">Escolha a rota A na imersão 3 para ver a comprovação mínima aqui.</p>`
    : !m ? `<p class="sub prep-dica">${esc(rota.nome)}: sem valor fixo de comprovação. Monte a meta com custo de saída + colchão de 3 meses + passagem de volta.</p>`
    : m.reais == null ? `<p class="sub prep-dica">${esc(rota.nome)} pede ${sim[m.moeda]} ${m.valor.toLocaleString("pt-BR")}. ${m.moeda === "EUR" ? "Preencha a cotação do euro acima para converter." : "Converta pela cotação do dia."}</p>`
    : `<div class="prep-sug"><span>Comprovação da rota A: <b>${sim[m.moeda]} ${m.valor.toLocaleString("pt-BR")} ≈ ${PREP.brl(m.reais)}</b>. Só o mínimo do governo: some o colchão e a volta.</span><button type="button" class="btn sm" id="usarmeta">Usar ${PREP.brl(m.reais)} como base</button></div>`;
  const b = $("#usarmeta"); if (b) b.onclick = () => { r.din_meta = String(m.reais); const f = $("#f-din_meta"); if (f) f.value = r.din_meta; salvar(); desenharBens(); progImersao(PREPARA.imersoes.find(x => x.id === "dinheiro")); toast("Meta preenchida. Some o colchão e a passagem de volta."); };
}
function ligarCampos(im) {
  const box = $("#pfaca"), r = pr().r;
  box.querySelectorAll("[data-k]").forEach(el => {
    const ev = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(ev, () => { r[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value; salvar(); progImersao(im); if (im.id === "dinheiro") { desenharBens(); desenharMeta(); } });
  });
  desenharMeta();
  box.querySelectorAll("[data-esc]").forEach(b => b.onclick = () => { const k = b.dataset.esc; r[k] = r[k] === b.dataset.v ? "" : b.dataset.v; salvar();
    box.querySelectorAll(`[data-esc="${k}"]`).forEach(x => { const on = x.dataset.v === r[k]; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); }); progImersao(im); });
  if ($("#w-bens")) desenharBens();
  if ($("#w-matriz")) desenharMatriz();
  if ($("#w-marcos")) desenharMarcos();
  if ($("#w-gonogo")) desenharGonogo();
}
const marcarWidget = (k, v) => { pr().r["w_" + k] = v; };

/* ---------- widget: inventário de bens + resultado do dinheiro ---------- */
function desenharBens() {
  const el = $("#w-bens"); if (!el) return; const bens = pr().bens, c = PREP.capital(pr().r, bens);
  el.innerHTML = `<div class="prep-bens">${bens.length ? bens.map((b, i) => `<div class="row prep-bem"><label class="sr" for="bn${i}">Item</label><input type="text" id="bn${i}" data-bem="${i}" data-campo="nome" value="${esc(b.nome || "")}" placeholder="Item">
      <label class="sr" for="bv${i}">Valor</label><input type="text" id="bv${i}" data-bem="${i}" data-campo="valor" value="${esc(b.valor || "")}" placeholder="R$" inputmode="decimal" class="prep-valor">
      <label class="prep-check sm"><input type="checkbox" data-bem="${i}" data-campo="vendido" ${b.vendido ? "checked" : ""}><span>vendido</span></label>
      <button class="btn sm ghost" data-tirar="${i}" aria-label="Remover item">${ico("lixo")}</button></div>`).join("") : `<p class="sub">Nenhum item ainda. Comece pelos maiores: notebook, celular, móveis, eletrodomésticos.</p>`}</div>
    <div class="row"><button class="btn sm" id="bmais">${ico("mais")}Adicionar item</button></div>
    <div class="grid g3 prep-res"><div class="bloco"><div class="grande">${PREP.brl(c.bens)}</div><span class="sub">em bens (${PREP.brl(c.jaVendido)} já vendido)</span></div>
      <div class="bloco"><div class="grande" style="--c:${c.liquido < 0 ? "var(--bad)" : "var(--ok)"}">${PREP.brl(c.liquido)}</div><span class="sub">capital líquido no embarque</span></div>
      <div class="bloco"><div class="grande" style="--c:var(--warn)">${c.meta ? (c.falta ? PREP.brl(c.falta) : "ok") : "—"}</div><span class="sub">${c.meta ? (c.falta ? "faltam para a meta" : "meta atingida") : "preencha a meta da rota"}</span></div></div>
    <p class="sub" style="font-size:13px">Conta: guardado hoje + (guardo por mês × meses) + bens − dívidas − contas − custo de saída. Dica: no plano, conte 70% do valor dos bens.</p>`;
  el.querySelectorAll("[data-bem]").forEach(inp => inp.addEventListener(inp.type === "checkbox" ? "change" : "change", () => {
    const b = bens[+inp.dataset.bem]; b[inp.dataset.campo] = inp.type === "checkbox" ? inp.checked : inp.value; salvar(); desenharBens(); }));
  el.querySelectorAll("[data-tirar]").forEach(b => b.onclick = () => { bens.splice(+b.dataset.tirar, 1); marcarWidget("bens", bens.length > 0); salvar(); desenharBens(); });
  $("#bmais").onclick = () => { bens.push({ nome: "", valor: "", vendido: false }); marcarWidget("bens", true); salvar(); desenharBens(); const ult = el.querySelectorAll('[data-campo="nome"]'); ult[ult.length - 1].focus(); };
  const im = PREPARA.imersoes.find(x => x.id === "dinheiro"); progImersao(im);
}

/* ---------- widget: matriz de decisão ---------- */
function desenharMatriz() {
  const el = $("#w-matriz"); if (!el) return; const P = PREPARA, notas = pr().notas, pesos = pr().pesos;
  const rotas = P.rotas.filter(rt => rt.cabe !== "nao");
  el.innerHTML = `<p class="sub">Nota de 1 (ruim) a 5 (ótimo) para cada rota que sobrou. O peso diz o quanto o critério importa para você (1 a 3).</p>
    <div class="prep-mtz-wrap"><table class="prep-mtz"><thead><tr><th>Rota</th>${P.criterios.map(c => `<th>${esc(c.nome)}<label class="sr" for="pp-${c.id}">Peso de ${esc(c.nome)}</label><select id="pp-${c.id}" data-peso="${c.id}">${[1, 2, 3].map(n => `<option ${(pesos[c.id] || c.peso) === n ? "selected" : ""}>${n}</option>`).join("")}</select></th>`).join("")}</tr></thead>
    <tbody>${rotas.map(rt => `<tr><th scope="row">${esc(rt.nome)}</th>${P.criterios.map(c => { const v = (notas[rt.id] || {})[c.id] || ""; return `<td><label class="sr" for="n-${rt.id}-${c.id}">${esc(rt.nome)}: ${esc(c.nome)}</label><select id="n-${rt.id}-${c.id}" data-nota="${rt.id}" data-crit="${c.id}"><option value="">–</option>${[1, 2, 3, 4, 5].map(n => `<option ${+v === n ? "selected" : ""}>${n}</option>`).join("")}</select></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
    <div id="mtz-rank" class="grid" style="gap:8px"></div>`;
  el.querySelectorAll("[data-nota]").forEach(s => s.onchange = () => { (notas[s.dataset.nota] ||= {})[s.dataset.crit] = s.value ? +s.value : 0; marcarWidget("matriz", true); salvar(); rankMatriz(); });
  el.querySelectorAll("[data-peso]").forEach(s => s.onchange = () => { pesos[s.dataset.peso] = +s.value; salvar(); rankMatriz(); });
  rankMatriz();
}
function rankMatriz() {
  const el = $("#mtz-rank"); if (!el) return; const rk = PREP.matriz(PREPARA.rotas, PREPARA.criterios, pr().notas, pr().pesos);
  el.innerHTML = rk.length ? `<span class="eyebrow">Seu ranking</span>` + rk.map((x, i) => `<div><div class="row entre"><span>${i + 1}. ${esc(x.nome)}${x.completo ? "" : ` <span class="pill med">notas incompletas</span>`}</span><span class="sub" style="font-variant-numeric:tabular-nums">${x.total}/${x.max}</span></div><div class="bar"><i style="width:${x.pct * 100}%"></i></div></div>`).join("") : "";
  progImersao(PREPARA.imersoes.find(x => x.id === "caminhos"));
}

/* ---------- widget: marcos do cronograma ---------- */
let marcoEditando = null;   /* id do marco aberto para edição ("novo" = criando um) */
function desenharMarcos() {
  const el = $("#w-marcos"); if (!el) return; const r = pr().r, P = pr();
  P.marcosEd ||= {}; P.marcosExtra ||= [];
  const form = (m, novo) => `<li class="prep-marco-ed"><form class="row" data-form="${novo ? "novo" : m.id}">
      <label class="sr" for="md-${m.id}">Data</label><input type="date" id="md-${m.id}" name="data" value="${m.data}" required min="2026-01-01" max="2027-12-31">
      <label class="sr" for="mt-${m.id}">O que precisa estar pronto</label><input type="text" id="mt-${m.id}" name="t" value="${esc(m.t)}" required placeholder="O que precisa estar pronto">
      <button class="btn sm pri" type="submit">${ico("check")}Salvar</button><button class="btn sm ghost" type="button" data-cancelar>Cancelar</button>
      ${novo ? "" : m.proprio ? `<button class="btn sm ghost" type="button" data-apagar="${m.id}" aria-label="Apagar marco">${ico("lixo")}</button>` : m.editado ? `<button class="btn sm ghost" type="button" data-restaurar="${m.id}">Voltar ao padrão</button>` : ""}</form></li>`;
  const lista = PREP.marcos(PREP.listaMarcos(PREPARA, P), hojeStr(), r);
  el.innerHTML = `<ol class="prep-marcos">${lista.map(m => m.id === marcoEditando ? form(m) : `<li class="${m.feito ? "feito" : m.passou ? "atrasado" : ""} ${m.decisao ? "decisao" : ""}">
      <label class="prep-check"><input type="checkbox" data-marco="${m.id}" ${m.feito ? "checked" : ""}><span><b class="prep-data">${fmt(m.data)}</b> ${esc(m.t)}${m.proprio ? ` <span class="pill">meu</span>` : m.editado ? ` <span class="pill">editado</span>` : ""}</span></label>
      <span class="sub prep-quando">${m.decisao ? `<span class="pill ac">decisão</span> ` : ""}${m.feito ? "feito" : m.dias < 0 ? "atrasado" : m.dias === 0 ? "hoje" : `em ${m.dias} d`}
        <button class="btn sm ghost ico-so" type="button" data-editar="${m.id}" aria-label="Editar marco: ${esc(m.t)}">${ico("lapis")}</button></span></li>`).join("")}
      ${marcoEditando === "novo" ? form({ id: "novo", data: hojeStr(), t: "" }, true) : ""}</ol>
    ${marcoEditando ? "" : `<div class="row"><button class="btn sm" type="button" id="mnovo">${ico("mais")}Acrescentar um marco meu</button></div>`}`;
  const redesenhar = () => { marcarWidget("marcos", true); salvar(); desenharMarcos(); };
  el.querySelectorAll("[data-marco]").forEach(c => c.onchange = () => { r["m_" + c.dataset.marco] = c.checked; pr().revisado = hojeStr(); redesenhar(); });
  el.querySelectorAll("[data-editar]").forEach(b => b.onclick = () => { marcoEditando = b.dataset.editar; desenharMarcos(); const i = el.querySelector("form input[name=t]"); if (i) i.focus(); });
  el.querySelectorAll("[data-cancelar]").forEach(b => b.onclick = () => { marcoEditando = null; desenharMarcos(); });
  el.querySelectorAll("[data-restaurar]").forEach(b => b.onclick = () => { delete P.marcosEd[b.dataset.restaurar]; marcoEditando = null; redesenhar(); });
  el.querySelectorAll("[data-apagar]").forEach(b => b.onclick = () => { P.marcosExtra = P.marcosExtra.filter(m => m.id !== b.dataset.apagar); delete r["m_" + b.dataset.apagar]; marcoEditando = null; redesenhar(); });
  el.querySelectorAll("[data-form]").forEach(f => f.onsubmit = e => {
    e.preventDefault(); const data = f.data.value, t = f.t.value.trim(); if (!data || !t) return;
    const id = f.dataset.form;
    if (id === "novo") P.marcosExtra.push({ id: "x" + Date.now().toString(36), data, t, decisao: false });
    else if (P.marcosExtra.some(m => m.id === id)) Object.assign(P.marcosExtra.find(m => m.id === id), { data, t });
    else P.marcosEd[id] = { data, t };
    marcoEditando = null; toast("Marco salvo"); redesenhar();
  });
  const n = $("#mnovo"); if (n) n.onclick = () => { marcoEditando = "novo"; desenharMarcos(); const i = el.querySelector("form input[name=t]"); if (i) i.focus(); };
  progImersao(PREPARA.imersoes.find(x => x.id === "cronograma"));
}

/* ---------- widget: Go/No-Go ---------- */
function desenharGonogo() {
  const el = $("#w-gonogo"); if (!el) return; const r = pr().r, g = PREP.gonogo(PREPARA.gonogo, r);
  el.innerHTML = `<div class="prep-go ${g.vai ? "vai" : ""}"><b>${g.vai ? "VAI: pode comprar a passagem" : "AINDA NÃO"}</b><span class="sub">${g.vai ? "Todos os critérios críticos estão cumpridos." : `Faltam ${g.faltam.length} critérios críticos. Sem eles, a passagem espera.`}</span></div>
    <ul class="prep-golista">${PREPARA.gonogo.map(i => `<li><label class="prep-check"><input type="checkbox" data-go="${i.id}" ${r["go_" + i.id] ? "checked" : ""}><span>${esc(i.t)}${i.critico ? ` <span class="pill bad">crítico</span>` : ""}</span></label></li>`).join("")}</ul>`;
  el.querySelectorAll("[data-go]").forEach(c => c.onchange = () => { r["go_" + c.dataset.go] = c.checked; marcarWidget("gonogo", true); salvar(); desenharGonogo(); });
  progImersao(PREPARA.imersoes.find(x => x.id === "decisao"));
}

/* ---------- fora da aba: chip do topo, lembrete na Início e bloco no Progresso ---------- */
const preparaComecou = () => PREP.revisaoVencida({ r: pr().r, concluidas: pr().concluidas }, hojeStr());   /* sem "revisado" = só diz se ela já começou */
/* Chip com os dias até o embarque: só aparece depois que ela começou o prepara.ai (sem poluir o topo de quem não usa). */
function chipPrepara() {
  if (!preparaComecou()) return ""; const d = diasAte(PREPARA.meta.data); if (d < 0) return "";
  return `<a class="chip prep" href="#prepara" title="Embarque planejado para ${PREPARA.meta.dataBR}" style="--c:${PCOR()}">${ico("mala")}<b>${d}</b><span class="l">${d === 1 ? "dia para o embarque" : "dias para o embarque"}</span></a>`;
}
/* Lembrete semanal: revisar os marcos (abrir o cronograma marca como revisado). */
function lembretePrepara() {
  if (!PREP.revisaoVencida(pr(), hojeStr())) return "";
  const prox = PREP.marcos(PREP.listaMarcos(PREPARA, pr()), hojeStr(), pr().r).find(m => !m.feito && m.dias >= 0);
  return `<section aria-label="Lembrete do prepara.ai"><a class="tile atalho" href="#prepara-cronograma" style="--c:${PCOR()}"><div class="topo"><span class="ico-t">${ico("mala")}</span>
    <div class="nome"><h3>Revisão semanal do plano</h3><span class="meta">${prox ? `Próximo marco: ${fmt(prox.data)}, ${esc(prox.t)} (${prox.dias === 0 ? "hoje" : "em " + prox.dias + " d"})` : "Confira os marcos do cronograma"}</span></div>
    <span class="btn sm pri">Revisar (5 min)${ico("seta")}</span></div></a></section>`;
}
function secaoPreparaProgresso() {
  if (!preparaComecou()) return "";
  const g = PREP.geral(PREPARA.imersoes, pr().r, pr().concluidas), f = FOCO.resumo(st.foco.sessoes.filter(x => x.tipo === "prepara")).total;
  const acertos = PREPARA.imersoes.filter(i => (pr().r["q_" + i.id] || {}).ok).length, respondidas = PREPARA.imersoes.filter(i => pr().r["q_" + i.id]).length;
  return `<section class="card grid" style="gap:16px;--c:${PCOR()}"><div class="row entre"><h3>${ico("mala")} prepara.ai</h3><a class="link" href="#prepara">Abrir o plano ${ico("dir")}</a></div>
    <div class="grid g3"><div class="bloco"><div class="grande">${g.concluidas}/${g.imersoes}</div><span class="sub">imersões concluídas</span></div>
      <div class="bloco"><div class="grande" style="--c:var(--teal)">${FOCO.dur(f.seg)}</div><span class="sub">de foco nas imersões (+${f.somas})</span></div>
      <div class="bloco"><div class="grande" style="--c:var(--warn)">${acertos}/${respondidas}</div><span class="sub">perguntas "Recupere" certas</span></div></div>
    <div class="row entre"><span class="sub">${g.feitas} de ${g.total} tarefas do plano</span></div><div class="bar"><i style="width:${g.p * 100}%"></i></div></section>`;
}
