/* ============ REVISÃO COM IA (#ia) e DÚVIDAS (#ia-duvidas) ============ */
function telaIA(app, focoDuvidas) {
  const pend = pendentesIA(); const duv = duvidasAbertas();
  const marcadas = new Set(pend.map(t => t.id)); const chat = chatPreferido();
  const semIA = MODO === "local" ? `Para a IA corrigir sozinha: dois cliques em <code>CONFIGURAR-IA.bat</code>, na pasta do estudaai (o Gemini é grátis).`
    : MODO === "nuvem" ? "O Claude da sua conta não está disponível nesta visualização." : "No modo arquivo, a correção é pelo chat.";
  /* Um botão principal: a IA automática, se houver; senão, copiar e abrir no chat. Nada de escolher provedor. */
  const acoes = (pre, n, rotulo, atividade) => { const cad = cadeiaIA(atividade); return `<div class="row">
      ${cad.length ? `<button class="btn pri" id="${pre}-enviar" ${n ? "" : "disabled"}>${ico("brilho")}${rotulo} com IA</button>` : ""}
      <button class="btn ${cad.length ? "" : "pri"}" id="${pre}-chat" ${n ? "" : "disabled"}>Copiar e abrir no ${CHATS[chat][0]}</button>
      <span class="sub outros-chats">ou ${Object.keys(CHATS).filter(c => c !== chat).map(c => `<button class="link" data-chat="${c}" data-pre="${pre}" ${n ? "" : "disabled"}>${CHATS[c][0]}</button>`).join(" · ")}</span>
      <button class="btn ghost sm" id="${pre}-baixar" ${n ? "" : "disabled"}>${ico("baixar")}.md</button></div>
    <p class="sub" id="${pre}-st" aria-live="polite">${cad.length ? `Ordem automática: ${esc(descreverCadeia(cad))}. Se uma falhar, passa para a próxima sozinha.` : semIA}</p>
    <details class="colar"><summary>Já tenho a resposta do chat: colar aqui</summary><textarea id="${pre}-resp" style="min-height:140px" placeholder="Cole a resposta inteira (Markdown)…"></textarea><div class="row"><button class="btn" id="${pre}-guardar">Guardar resposta</button></div></details>`; };

  app.innerHTML = `<header class="cab"><div><h1>Revisão com IA</h1><p class="sub">Faça quantas aulas quiser, registre as respostas e mande tudo de uma vez: a IA confere com o material que você estudou e com fontes da internet, e devolve a correção do seu jeito.</p></div></header>
  <section class="card ia-bloco" style="--c:var(--ac)">
    <div class="row entre"><h2>${ico("revisar")}Respostas aguardando revisão</h2><span class="pill ${pend.length ? "ac" : ""}">${pend.length}</span></div>
    ${pend.length ? `<ul class="fila-ia">${pend.map(t => `<li><label><input type="checkbox" data-t="${t.id}" checked><span class="txt"><b>${esc(t.titulo)}</b><small>${esc(t.tema)} · ${fmt(t.data)} · ${t.ac} de ${t.quiz.length} certas${t.tot < t.quiz.length ? ` · ${t.quiz.length - t.tot} em branco` : ""}</small></span></label><button class="btn sm ghost" data-del-t="${t.id}" aria-label="Tirar da fila">${ico("lixo")}</button></li>`).join("")}</ul>`
      : `<p class="sub">Nada na fila. No fim de cada aula, toque em <b>Registrar respostas</b>: elas aparecem aqui.</p>`}
    ${acoes("rev", pend.length, "Revisar", "revisao")}
  </section>
  <section class="card ia-bloco" id="duvidas" style="--c:var(--teal)">
    <div class="row entre"><h2>${ico("busca")}Dúvidas para pesquisar</h2><span class="pill ${duv.length ? "ac" : ""}">${duv.length}</span></div>
    <p class="sub">O seu "dump" da semana: tudo o que deu curiosidade. Gere o arquivo .md e mande para uma IA pesquisar e resumir com mapa, exemplos e autoteste.</p>
    <div class="row nova-duv"><input type="text" id="nova-duv" placeholder="Anotar uma dúvida nova…" aria-label="Nova dúvida"><button class="btn" id="add-duv">${ico("mais")}Anotar</button></div>
    ${duv.length ? `<ul class="duvidas">${duv.map(d => `<li><span>${esc(d.texto)}<small>${d.origem ? esc(d.origem) + " · " : ""}${fmt(d.data)}</small></span><button class="btn sm ghost" data-del-d="${d.id}" aria-label="Apagar dúvida">${ico("lixo")}</button></li>`).join("")}</ul>` : ""}
    ${acoes("duv", duv.length, "Pesquisar", "duvidas")}
    ${duv.length ? `<div class="row"><button class="btn sm ghost" id="duv-enviadas">${ico("check")}Já mandei: limpar a lista</button></div>` : ""}
  </section>
  <section class="grid" style="gap:12px">
    <h2>Respostas da IA</h2>
    ${st.respostasIA.length ? st.respostasIA.map((r, i) => `<details class="card resp-ia" ${i === 0 ? "open" : ""}><summary><span class="pill ${r.tipo === "revisao" ? "ac" : "ok"}">${r.tipo === "revisao" ? "Revisão" : "Dúvidas"}</span><b>${fmt(r.data)}</b><span class="sub">${r.ids.length} ${r.tipo === "revisao" ? (r.ids.length === 1 ? "aula" : "aulas") : (r.ids.length === 1 ? "dúvida" : "dúvidas")} · ${esc(NOME_IA[r.provedor] || r.provedor)}${r.modelo ? ` <small>(${esc(r.modelo)})</small>` : ""}</span></summary>
      <div class="md">${mdParaHTML(r.md)}</div>
      <div class="row"><button class="btn sm ghost" data-baixar-r="${r.id}">${ico("baixar")}Baixar .md</button><button class="btn sm ghost" data-del-r="${r.id}">${ico("lixo")}Apagar</button></div></details>`).join("")
      : `<p class="sub">As correções e pesquisas aparecem aqui e ficam guardadas.</p>`}
  </section>`;

  const de = pre => pre === "rev"
    ? { lista: () => pend.filter(t => marcadas.has(t.id)), pedido: l => promptRevisao(l), arquivo: "revisao", tipo: "revisao" }
    : { lista: () => duv, pedido: l => promptDuvidas(l), arquivo: "duvidas", tipo: "duvidas" };
  for (const pre of ["rev", "duv"]) {
    const d = de(pre); const vazio = () => { const l = d.lista(); if (!l.length) toast(pre === "rev" ? "Marque pelo menos uma aula." : "Anote uma dúvida primeiro."); return l; };
    $(`#${pre}-chat`).onclick = () => { const l = vazio(); if (l.length) copiarEAbrir(d.pedido(l), chat); };
    app.querySelectorAll(`[data-chat][data-pre="${pre}"]`).forEach(b => b.onclick = () => { const l = vazio(); if (l.length) { copiarEAbrir(d.pedido(l), b.dataset.chat); telaIA(app, pre === "duv"); } });
    $(`#${pre}-baixar`).onclick = () => { const l = vazio(); if (l.length) baixarArquivo(`estudaai-${d.arquivo}-${hojeStr()}.md`, d.pedido(l), undefined, "Arquivo .md gerado: anexe numa IA com busca na internet"); };
    $(`#${pre}-guardar`).onclick = () => { const l = vazio(); if (!l.length) return; try { guardarRespostaIA(d.tipo, "manual", $(`#${pre}-resp`).value, l.map(x => x.id)); toast("Resposta guardada"); telaIA(app); } catch (e) { toast(e.message); } };
    const env = $(`#${pre}-enviar`);
    if (env) env.onclick = async () => {
      const l = vazio(); if (!l.length) return; const stt = $(`#${pre}-st`);
      env.disabled = true; stt.textContent = "A IA está lendo e buscando na internet… pode levar alguns minutos.";
      try {
        const r = await iaTexto(d.pedido(l), d.tipo); guardarRespostaIA(d.tipo, r.provedor, r.texto, l.map(x => x.id), r.modelo);
        toast(`Pronto, feito por ${NOME_IA[r.provedor]}${r.falhas && r.falhas.length ? ` (${r.falhas.length} antes falhou)` : ""}`); telaIA(app);
      } catch (e) {   /* nenhuma IA respondeu: o último degrau é o chat */
        stt.innerHTML = `${esc(e.message)}<br><b>Use "Copiar e abrir no ${CHATS[chat][0]}"</b>: cola e envia lá.`; env.disabled = false; $(`#${pre}-chat`).classList.add("pri");
      }
    };
  }
  app.querySelectorAll("[data-t]").forEach(c => c.onchange = () => { c.checked ? marcadas.add(c.dataset.t) : marcadas.delete(c.dataset.t); });
  app.querySelectorAll("[data-del-t]").forEach(b => b.onclick = () => { if (confirm("Tirar esta aula da fila de revisão?")) { apagarTentativa(b.dataset.delT); telaIA(app); } });
  app.querySelectorAll("[data-del-d]").forEach(b => b.onclick = () => { apagarDuvida(b.dataset.delD); telaIA(app, true); });
  app.querySelectorAll("[data-del-r]").forEach(b => b.onclick = () => { if (confirm("Apagar esta resposta da IA?")) { st.respostasIA = st.respostasIA.filter(r => r.id !== b.dataset.delR); salvar(); telaIA(app); } });
  app.querySelectorAll("[data-baixar-r]").forEach(b => b.onclick = () => { const r = st.respostasIA.find(x => x.id === b.dataset.baixarR); baixarArquivo(`estudaai-${r.tipo}-resposta-${r.data}.md`, r.md); });
  const add = () => { if (anotarDuvida($("#nova-duv").value)) telaIA(app, true); };
  $("#add-duv").onclick = add; $("#nova-duv").onkeydown = e => { if (e.key === "Enter") add(); };
  if ($("#duv-enviadas")) $("#duv-enviadas").onclick = () => { duv.forEach(d => d.enviada = hojeStr()); salvar(); toast("Lista limpa. Boa pesquisa!"); telaIA(app, true); };
  if (focoDuvidas) { $("#duvidas").scrollIntoView({ block: "start" }); $("#nova-duv").focus({ preventScroll: true }); }
}
