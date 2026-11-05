/* ============ NOVO TEMA ============ */
function telaNovo(app) {
  let cor = corLivre();
  app.innerHTML = `<header class="cab"><div><a class="migalha" href="#temas">${ico("voltar")}Temas</a><h1>Novo tema</h1><p class="sub">Escreva os tópicos, um por linha. Linhas começando com <b>#</b> viram grupos. Depois, toque num tópico para gerar a aula com IA.</p></div></header>
    <section class="card grid g2"><div class="grid" style="gap:12px">
    <label for="nnome">Nome do tema</label><input type="text" id="nnome" placeholder="Ex.: Inglês para entrevistas">
    <label for="ndesc">Para quê? (opcional)</label><input type="text" id="ndesc" placeholder="Ex.: conseguir vaga remota em dólar">
    <span class="rotulo">Cor</span><div class="cores" id="ncor">${CORES.map(c => `<button class="cor ${c === cor ? "on" : ""}" data-c="${c}" style="--c:${c}" aria-label="Cor ${c}">${c === cor ? ico("check") : ""}</button>`).join("")}</div>
    <div class="row"><button class="btn pri" id="criar" style="--c:${cor}">${ico("mais")}Criar tema</button></div></div>
    <div class="grid" style="gap:10px"><label for="ntop">Tópicos</label><textarea id="ntop" style="min-height:330px" placeholder="# Básico&#10;Verbos to be e to have&#10;Apresentação pessoal&#10;# Entrevista&#10;Falar da experiência com QA&#10;Perguntas comportamentais (STAR)"></textarea>
    <p class="sub" style="font-size:14px">Dica: peça ao Claude "liste de 10 a 20 tópicos em ordem para aprender X do zero" e cole aqui.</p></div></section>`;
  app.querySelectorAll("#ncor button").forEach(b => b.onclick = () => { cor = b.dataset.c; app.querySelectorAll("#ncor button").forEach(x => { x.classList.toggle("on", x === b); x.innerHTML = x === b ? ico("check") : ""; }); $("#criar").style.setProperty("--c", cor); });
  $("#criar").onclick = () => {
    const nome = $("#nnome").value.trim(); const linhas = $("#ntop").value.split("\n").map(s => s.trim()).filter(Boolean);
    if (!nome || !linhas.some(l => !l.startsWith("#"))) { toast("Preencha o nome e pelo menos um tópico."); return; }
    const id = "u-" + slug(nome, 24) + "-" + sufixo(3);
    const discs = []; let atual = null; let k = 0;
    for (const l of linhas) { if (l.startsWith("#")) { atual = { id: "d" + discs.length, nome: l.replace(/^#+\s*/, ""), cor, topicos: [] }; discs.push(atual); continue; }
      if (!atual) { atual = { id: "d0", nome: "Trilha", cor, topicos: [] }; discs.push(atual); } atual.topicos.push({ id: id + "-" + (++k), t: l, p: 2 }); }
    st.temasUser.push({ id, nome, desc: $("#ndesc").value.trim(), cor, user: true, disciplinas: discs.filter(d => d.topicos.length) }); salvar();
    toast("Tema criado!"); location.hash = "tema-" + id;
  };
}
