/* ============ próximo passo ============
   O plano do dia tem até 4 passos: cartões → revisão de aula vencida → aula do tema principal → aula de "recompensa". */
function plano() {
  const passos = [];
  const fila = filaCartoes("todos");
  passos.push({ id: "cartoes", tipo: "Revisão espaçada", titulo: fila.length ? `Revisar ${fila.length} cartões` : "Cartões em dia", sub: "Cerca de 10 minutos", href: "#revisar", vazio: !fila.length, cor: "var(--ac)", icone: "revisar" });
  const revs = []; for (const t of todosTemas()) for (const x of topicos(t)) if (situacao(x.id) === "revisar" && aula(x.id)) revs.push({ t, x });
  if (revs.length) { const { t, x } = revs[0]; passos.push({ id: "rev-" + x.id, tipo: "Revisar aula", titulo: aula(x.id).titulo, sub: t.nome + " · refazer o teste", href: "#aula-" + x.id + "-teste", tema: t }); }
  const p = tema(st.principal) || todosTemas()[0];
  const prox = proximaAula(p);
  if (prox) passos.push(passoAula(prox, p, "Aula principal"));
  const outros = todosTemas().filter(t => t.id !== p.id);
  const rot = outros[(new Date().getDate()) % Math.max(outros.length, 1)];
  const pref = outros.find(t => proximaAula(t) && aula(proximaAula(t).id) && t.id === (st.recompensa || "fisioterapia")) || outros.find(t => proximaAula(t) && aula(proximaAula(t).id)) || rot;
  if (pref) { const r = proximaAula(pref); if (r) passos.push(passoAula(r, pref, "Recompensa")); }
  passos.forEach(x => { x.feito = st.hoje.feitos.includes(x.id) || (x.id === "cartoes" && x.vazio && Object.keys(st.cards).length > 0); if (x.tema) { x.cor = x.tema.cor; x.icone = null; } });
  return passos;
}
function passoAula(x, t, tipo) {
  const a = aula(x.id);
  return { id: "aula-" + x.id, tipo, titulo: a ? a.titulo : x.t, sub: t.nome + (a ? "" : " · ainda sem aula: gere na trilha"), href: a ? "#aula-" + x.id : "#tema-" + t.id, tema: t };
}
function proximaAula(t) {
  const ts = topicos(t).filter(x => situacao(x.id) === "novo");
  const com = ts.filter(x => aula(x.id)); const lista = com.length ? com : ts;
  return lista.sort((a, b) => (b.p || 2) - (a.p || 2))[0] || null;
}

/* ============ INÍCIO ============ */
const DIA_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
function telaInicio(app) {
  const ps = plano(); const atual = ps.find(p => !p.feito) || ps[ps.length - 1]; const todos = ps.every(p => p.feito);
  const hoje = new Date(); const feitos = ps.filter(p => p.feito).length;
  const temas = todosTemas(); const principal = temas.find(t => t.id === st.principal) || temas[0];
  app.innerHTML = `
  <section class="hoje">
    <div class="card agora" style="--c:${atual.cor}">
      <div class="row entre"><span class="eyebrow">${todos ? "Plano de hoje concluído" : "Agora"} · ${DIA_SEMANA[hoje.getDay()]}, ${fmt(hojeStr())}</span>${atual.tema ? `<span class="tag">${iconeTema(atual.tema, "sm")}${esc(atual.tema.nome)}</span>` : ""}</div>
      <div><span class="tipo">${esc(atual.tipo)}</span><h1>${esc(atual.titulo)}</h1><p class="sub">${esc(atual.sub)}</p></div>
      <div class="row"><a class="btn pri lg" href="${atual.href}">${todos ? "Fazer de novo" : "Começar"} ${ico("seta")}</a></div>
    </div>
    <div class="card plano" aria-label="Plano de hoje">
      <div class="row entre"><h2>Plano de hoje</h2><span class="sub">${feitos} de ${ps.length}</span></div>
      <div class="bar fino"><i style="width:${ps.length ? feitos / ps.length * 100 : 0}%"></i></div>
      <ol>${ps.map((p, i) => `<li><a class="passo ${p.feito ? "feito" : ""} ${p === atual && !todos ? "atual" : ""}" href="${p.href}" style="--c:${p.cor}"><span class="n">${p.feito ? ico("check") : i + 1}</span><span class="txt"><span class="t1">${esc(p.titulo)}</span><small><i class="dot"></i>${esc(p.tipo)}${p.tema ? " · " + esc(p.tema.nome) : ""}</small></span>${ico("dir", "fim")}</a></li>`).join("")}</ol>
    </div>
  </section>
  <section class="atalhos-ia" aria-label="Revisão com IA e dúvidas">
    ${atalhoIA("#ia", "var(--ac)", "brilho", "Revisão com IA", pendentesIA().length, n => n ? `${n} ${n === 1 ? "aula aguardando" : "aulas aguardando"} correção` : "Registre as respostas no fim da aula", "Revisar")}
    ${atalhoIA("#ia-duvidas", "var(--teal)", "busca", "Dúvidas da semana", duvidasAbertas().length, n => n ? `${n} ${n === 1 ? "dúvida anotada" : "dúvidas anotadas"} para pesquisar` : "Anote curiosidades no fim de cada aula", "Gerar .md")}
  </section>
  <section>
    <div class="row entre titulo-sec"><h2>Seus temas</h2><a class="link" href="#temas">Ver todos ${ico("dir")}</a></div>
    <div class="temas">${[principal, ...temas.filter(t => t !== principal)].map(t => tileTema(t)).join("")}</div>
  </section>`;
}
/* Atalho da Início para a Revisão com IA ou as dúvidas: número grande, frase curta, ação. */
const atalhoIA = (href, cor, icone, titulo, n, frase, acao) => `<a class="tile atalho ${n ? "" : "vazio"}" href="${href}" style="--c:${cor}">
    <div class="topo"><span class="ico-t">${ico(icone)}</span><div class="nome"><h3>${titulo}</h3><span class="meta">${frase(n)}</span></div>${n ? `<span class="btn sm pri">${acao}${ico("seta")}</span>` : ""}</div></a>`;
/* Bloco de um tema: ícone colorido, nome, progresso. comDesc mostra a descrição (tela Temas). */
function tileTema(t, comDesc = false) {
  const pr = progressoTema(t); const prontas = topicos(t).filter(x => aula(x.id)).length; const principal = t.id === st.principal;
  return `<a class="tile ${principal ? "principal" : ""}" href="#tema-${t.id}" style="--c:${t.cor}">
    <div class="topo">${iconeTema(t)}<div class="nome"><h3>${esc(t.nome)}</h3><span class="meta">${pr.v} de ${pr.n} tópicos · ${prontas} ${prontas === 1 ? "aula" : "aulas"}</span></div>${principal ? `<span class="pill ac" title="Tema principal">${ico("estrela")}principal</span>` : ""}</div>
    ${comDesc && t.desc ? `<p class="desc">${esc(t.desc)}</p>` : ""}
    <div class="bar"><i style="width:${pr.p * 100}%"></i></div></a>`;
}
