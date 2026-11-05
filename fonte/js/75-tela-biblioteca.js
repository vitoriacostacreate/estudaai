/* ============ BIBLIOTECA (PDFs) ============ */
function telaBiblioteca(app) {
  if (MODO === "arquivo") { app.innerHTML = `<header class="cab"><div><h1>Biblioteca</h1></div></header><section class="card"><h2>Importar PDFs precisa do estudaai rodando no seu PC</h2><p class="sub">Abra o estudaai pelo link do Claude (versão na nuvem) ou rode o <b>ESTUDAAI.bat</b> no PC. Esta cópia, aberta direto do arquivo, não lê PDFs.</p></section>`; return; }
  const destinos = todosTemas().map(t => `<option value="${t.id}">${esc(t.nome)}</option>`).join("");
  app.innerHTML = `<header class="cab"><div><h1>Biblioteca</h1><p class="sub">Seus PDFs entram no tema certo e viram aulas automáticas e cartões.</p></div></header>
    <section class="card grid g2" style="align-items:start"><div class="grid" style="gap:12px">
      <h2>Importar PDF</h2>
      <p class="sub">O estudaai lê o PDF, acha as seções (pelo sumário ou pelos títulos), cria um tópico por seção, uma aula automática para cada um e cartões com definições, lacunas e números. O PDF é lido aqui no navegador (precisa de internet só para importar). ${MODO === "nuvem" ? "Fica guardado na sua conta: aparece no PC, no notebook e no celular." : "Tudo fica no seu computador, em <code>dados/</code>."}</p>
      <label for="dest">Onde colocar</label><select id="dest"><option value="auto">Automático: juntar ao tema do assunto (recomendado)</option><option value="novo">Sempre criar um tema novo</option>${destinos}</select>
      <label for="ntema">Nome, se precisar criar um tema (opcional)</label><input type="text" id="ntema" placeholder="Usa o título do PDF se ficar vazio">
    </div>
    <label class="zona" id="zona" for="arq">
      <div><span class="ico-t lg">${ico("enviar")}</span><b>Arraste PDFs para cá</b><br><span class="sub">ou clique para escolher (pode ser mais de um)</span><div id="status" class="grid" style="gap:6px;margin-top:12px"></div></div>
      <input type="file" id="arq" accept="application/pdf,.pdf" multiple hidden></label></section>
    <section class="card grid" style="gap:12px"><div class="row" style="justify-content:space-between"><h2>Seus PDFs <span class="sub">(${BIB.docs.length})</span></h2><input type="text" id="busca" placeholder="Buscar em todos os PDFs…" style="max-width:340px" aria-label="Buscar nos PDFs"></div><div id="res"></div>
      ${BIB.docs.length ? `<div class="grid g2">${BIB.docs.slice().reverse().map(d => { const t = tema(d.tema); return `<div class="bloco grid" style="gap:8px;border-left:5px solid ${t ? t.cor : "var(--ac)"}"><b>${esc(d.titulo)}</b><span class="sub" style="font-size:14px">${d.paginas} páginas · ${d.secoes} seções (${esc(d.origem)}) · ${BIB.cartoes.filter(c => c.doc === d.id).length} cartões · ${esc(d.importado)}</span><span class="sub" style="font-size:14px">Tema: ${esc(t ? t.nome : d.tema)}</span><div class="row"><a class="btn sm pri" href="#tema-${d.tema}">Estudar</a><a class="btn sm ghost" href="${urlPDF(d.id, 1)}" target="_blank" rel="noopener">Ver PDF</a><button class="btn sm ghost" data-apagar="${d.id}">Remover</button></div></div>`; }).join("")}</div>` : `<p class="sub">Nenhum PDF ainda. Teste com <code>exemplos/apostila-exemplo.pdf</code>.</p>`}</section>
    ${MODO === "nuvem" ? `<section class="card"><h3>IA ${INFO.ia ? '<span class="pill ok">Claude da sua conta</span>' : '<span class="pill">indisponível nesta visualização</span>'}</h3><p class="sub">Na versão na nuvem, "Melhorar com IA" e "Gerar com IA" usam o próprio Claude, sem chave de API. Na primeira vez, o Claude pede sua permissão.</p></section>` : `<section class="card grid" style="gap:14px"><div class="grid" style="gap:8px"><h3>IA (opcional) ${(INFO.provedores || []).length ? (INFO.provedores || []).map(p => `<span class="pill ok">${esc(NOME_IA[p])}</span>`).join(" ") : '<span class="pill">desligada</span>'}</h3><p class="sub">Sem chave, tudo funciona com "copiar pedido": você cola numa IA e traz a resposta. Com chave, o estudaai manda sozinho. <b>Gerar aula</b> usa o Claude; a <b>Revisão com IA</b> e a pesquisa das dúvidas usam a que estiver ligada (Claude → ChatGPT → Gemini), com busca na internet. As chaves ficam só em <code>dados/config.json</code>, no seu PC.</p></div>
    <div class="grid g3-ia">${[["anthropic", "Claude (Anthropic)", "sk-ant-…", "anthropic_api_key", "modelo"], ["openai", "ChatGPT (OpenAI)", "sk-…", "openai_api_key", "modelo_openai"], ["gemini", "Gemini (Google)", "AIza…", "gemini_api_key", "modelo_gemini"]].map(([p, nome, ph, ck, cm]) => `<div class="bloco grid" style="gap:8px"><b>${nome} ${(INFO.provedores || []).includes(p) ? '<span class="pill ok">ligada</span>' : ""}</b><label for="k-${p}">Chave da API</label><input type="text" id="k-${p}" data-campo="${ck}" placeholder="${(INFO.provedores || []).includes(p) ? "•••• salva (deixe vazio para manter)" : ph}" autocomplete="off" style="-webkit-text-security:disc"><label for="m-${p}">Modelo</label><input type="text" id="m-${p}" data-campo="${cm}" value="${esc(INFO[cm] || "")}"></div>`).join("")}</div>
    <div class="row"><button class="btn pri" id="salvarcfg">Salvar</button></div></section>`}`;
  const zona = $("#zona"), inp = $("#arq");
  const enviar = async files => {
    const lista = [...files].filter(f => /\.pdf$/i.test(f.name)); if (!lista.length) { toast("Escolha arquivos .pdf"); return; }
    const box = $("#status"); let ok = 0;
    for (const f of lista) {
      const linha = document.createElement("div"); linha.className = "pill"; linha.textContent = "Lendo " + f.name + "…"; box.appendChild(linha);
      try { const doc = await importarPDF(f, $("#dest").value, lista.length === 1 ? $("#ntema").value : "");
        linha.className = "pill ok"; const t = tema(doc.tema); linha.textContent = `✓ ${f.name}: ${doc.secoes} seções → ${t ? t.nome : "tema novo"}`; ok++;
      } catch (e) { linha.className = "pill bad"; linha.textContent = "✗ " + f.name + ": " + e.message; }
    }
    if (ok) { toast(ok + " PDF(s) organizados!"); setTimeout(() => telaBiblioteca(app), 900); }
  };
  inp.onchange = () => enviar(inp.files);
  ["dragover", "dragenter"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.style.borderColor = "var(--ac)"; }));
  zona.addEventListener("dragleave", () => zona.style.borderColor = "");
  zona.addEventListener("drop", e => { e.preventDefault(); zona.style.borderColor = ""; enviar(e.dataTransfer.files); });
  app.querySelectorAll("[data-apagar]").forEach(b => b.onclick = () => abrirModal(`<h2>Remover este PDF?</h2><p class="sub">Somem as seções dele, as aulas automáticas e os cartões dele. Seu histórico de estudo continua salvo.</p><div class="row"><button class="btn" data-fechar>Cancelar</button><button class="btn pri" id="sim">Remover</button></div>`, m => { $("#sim", m).onclick = async () => { await removerPDF(b.dataset.apagar); fecharModal(); telaBiblioteca(app); }; }));
  let tb; $("#busca").oninput = e => { clearTimeout(tb); tb = setTimeout(async () => { const q = e.target.value; if (q.length < 3) { $("#res").innerHTML = ""; return; } const r = buscarTexto(q); $("#res").innerHTML = r.length ? `<div class="grid" style="gap:8px">${r.map(x => `<a class="passo" href="#aula-${x.topico}" style="text-decoration:none;color:inherit"><span class="n">${x.ocorrencias}</span><span>${esc(x.titulo)}<small>${esc(x.trecho)}</small></span></a>`).join("")}</div>` : `<p class="sub">Nada encontrado para "${esc(q)}".</p>`; }, 250); };
  if ($("#salvarcfg")) $("#salvarcfg").onclick = async () => {
    const corpo = {}; app.querySelectorAll("[data-campo]").forEach(i => { if (i.value.trim() || !/_key$/.test(i.dataset.campo)) corpo[i.dataset.campo] = i.value.trim(); });   /* chave vazia = manter a salva */
    try { const r = await api("/api/config", { method: "POST", ...json(corpo) }); INFO = { ...INFO, ...(await api("/api/info")) }; toast(r.provedores.length ? "IA ligada: " + r.provedores.map(p => NOME_IA[p]).join(", ") : "Configuração salva"); telaBiblioteca(app); }
    catch (e) { toast(e.message); }
  };
}
