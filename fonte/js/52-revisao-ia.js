/* ============ Revisão com IA e dúvidas da semana ============
   Fluxo: ela faz as aulas → "Registrar respostas" guarda cada tentativa em st.tentativas →
   na tela #ia junta quantas quiser e manda para uma IA (Claude, GPT ou Gemini, com busca na web)
   ou copia/baixa o pedido em .md → a resposta (Markdown) fica em st.respostasIA.
   Dúvidas anotadas no fim da aula (st.duvidas) viram um .md semanal com pedido de pesquisa. */
const NOME_IA = { anthropic: "Claude", openai: "ChatGPT", gemini: "Gemini", conta: "Claude da sua conta", manual: "colada à mão" };
const LETRAS = "ABCDEFGHIJ";
const novoId = () => sufixo(6) + Math.random().toString(36).slice(2, 6);

/* ---------- tentativas (respostas registradas) ---------- */
function registrarTentativa(tid, a, s) {
  const info = acharTopico(tid); const n = st.notas[tid] || {};
  const quiz = a.quiz.map((q, i) => ({ q: q.q, o: q.o, a: q.a, e: q.e || "", k: s.resp && s.resp[i] !== undefined ? s.resp[i] : null }));
  const t = { id: novoId(), tid, data: hojeStr(), titulo: a.titulo, tema: info ? info.tema.nome : "", disc: info ? info.disc.nome : "",
    ac: quiz.filter(x => x.k === x.a).length, tot: quiz.filter(x => x.k !== null).length, quiz,
    lembre: (a.recupere || []).map((p, i) => ({ p, r: (n.lembre || [])[i] || "" })),
    feynman: { p: (a.feynman && a.feynman.pergunta) || "Explique o tema com suas palavras.", r: n.feynman || "" } };
  st.tentativas.push(t); salvar(); return t;
}
const pendentesIA = () => st.tentativas.filter(t => !t.revisao);
function apagarTentativa(id) { st.tentativas = st.tentativas.filter(t => t.id !== id); salvar(); }

/* ---------- dúvidas ---------- */
function anotarDuvida(texto, tid) {
  texto = String(texto || "").trim(); if (!texto) { toast("Escreva a dúvida antes de anotar."); return null; }
  const info = tid ? acharTopico(tid) : null;
  const d = { id: novoId(), tid: tid || null, texto, data: hojeStr(), origem: info ? `${aula(tid) ? aula(tid).titulo : info.top.t} · ${info.tema.nome}` : "" };
  st.duvidas.push(d); salvar(); return d;
}
function apagarDuvida(id) { st.duvidas = st.duvidas.filter(d => d.id !== id); salvar(); }
const duvidasAbertas = () => st.duvidas.filter(d => !d.enviada);

/* ---------- pedidos (Markdown) ---------- */
const semHTML = h => { const d = new DOMParser().parseFromString(`<div>${h}</div>`, "text/html"); d.querySelectorAll("li").forEach(li => li.prepend("- ")); d.querySelectorAll("p,li,tr,h4,br").forEach(n => n.append("\n")); return d.body.textContent.replace(/\n{3,}/g, "\n\n").trim(); };
const PERFIL_MD = `- Sou muito visual: **blocos curtos**, uma ideia por vez, exemplos concretos (de TI, da universidade ou do dia a dia) e **negrito nas palavras-chave**.
- Use marcadores visuais: 📌 conceito, ✅ certo, ❌ errado, ⚠️ pegadinha.
- Português do Brasil, direto e objetivo. Nada de sermão nem enrolação.`;
const REGRAS_FONTE = `- Legislação: só o texto oficial (planalto.gov.br, resoluções da UFMS). **Nunca invente** artigo, número, prazo ou citação.
- Se não tiver certeza, escreva "não tenho certeza: confira em <fonte>". Se o assunto for debatido, diga.
- Se você não puder buscar na internet, marque cada checagem como "(não verificado na web)".`;

function promptRevisao(tents) {
  const blocos = tents.map((t, n) => {
    const a = aula(t.tid); const info = acharTopico(t.tid);
    const material = a ? [a.ideia && `**Ideia central:** ${a.ideia}`, ...(a.blocos || []).map(b => `#### ${b.t}\n${semHTML(b.html)}`)].filter(Boolean).join("\n\n") : "(a aula não está mais no app)";
    const fonte = /^p-/.test(t.tid) && typeof textoTopico === "function" ? textoTopico(t.tid).slice(0, 6000) : "";
    const qs = t.quiz.map((q, i) => `**${i + 1}. ${q.q}**\n${q.o.map((o, k) => `${LETRAS[k]}) ${o}`).join("\n")}\n- Gabarito do app: **${LETRAS[q.a]}** · Minha resposta: ${q.k === null ? "_(não respondi)_" : `**${LETRAS[q.k]}** ${q.k === q.a ? "✅" : "❌"}`}${q.e ? `\n- Explicação do app: ${q.e}` : ""}`).join("\n\n");
    const lembre = t.lembre.filter(x => x.p).map(x => `- **P:** ${x.p}\n  **Minha resposta:** ${x.r.trim() || "_(em branco)_"}`).join("\n");
    return `## Aula ${n + 1}: ${t.titulo}
_${t.tema}${t.disc ? " / " + t.disc : ""} · respondida em ${fmt(t.data)} · placar ${t.ac} de ${t.quiz.length}${info && info.top.pi ? ` · PDF p. ${info.top.pi}–${info.top.pf}` : ""}_

### Material que eu estudei
${material}
${fonte ? `\n### Texto-fonte original (PDF)\n${fonte}\n` : ""}
### Questões do teste
${qs}

### Lembre (respondi ANTES da aula, sem consultar)
${lembre || "_(sem perguntas)_"}

### Feynman (expliquei com minhas palavras)
**Pedido:** ${t.feynman.p}
> ${(t.feynman.r.trim() || "(em branco)").replace(/\n/g, "\n> ")}`;
  }).join("\n\n---\n\n");
  return `# Revisão das minhas respostas (estudaai)
> Gerado em ${fmt(hojeStr())}/${hojeStr().slice(0, 4)} · ${tents.length} ${tents.length === 1 ? "aula" : "aulas"}. Use uma IA **com busca na internet**.

## Seu papel
Você é meu professor particular e um revisor rigoroso. Estudo para o **concurso UFMS 2026** (Analista de TI, Desenvolvimento de Software, banca **FAPEC**, prova em 17/01/2027) e também fisioterapia, neurociência, música e Libras. Abaixo estão o material de cada aula e as minhas respostas.

## O que fazer
1. Em cada questão, confira **a minha alternativa** e **o gabarito do app** contra (a) o material da aula e (b) uma **busca na internet em fontes confiáveis**.
2. Se o gabarito do app estiver errado ou discutível, escreva **⚠️ Gabarito do app questionável** e explique.
3. Quando eu errar: diga por que a correta é a correta e **por que cada alternativa errada está errada**, no estilo FAPEC.
4. Leia meu **Lembre** e meu **Feynman**: aponte lacunas e erros de conceito. Não reescreva tudo por mim.
5. Cheque também os fatos do **material da aula**: se algo estiver incorreto ou desatualizado, avise.

## Regras de fonte
${REGRAS_FONTE}

## Como eu aprendo melhor
${PERFIL_MD}

## Formato OBRIGATÓRIO da resposta
Responda **somente em Markdown**, nesta estrutura, repetindo o bloco de aula para cada aula:

\`\`\`
## <título da aula>
**Placar:** x de y · **Gabarito do app:** confere | tem problema

### Questão n: ✅ ou ❌
- **Sua resposta:** X) … · **Correta:** Y) …
- **Por quê:** até 3 linhas
- **Alternativas erradas:** uma linha para cada
(só detalhe as que errei, deixei em branco ou cujo gabarito tem problema; as certas, liste numa linha)

### Lembre e Feynman
- ✅ o que está certo · ❌ erros de conceito · 📌 o que faltou

### Fontes checadas
- [nome da fonte](link)

## 🎯 Plano de reforço
3 a 5 ações curtas, da mais importante para a menos importante.

## 🃏 Cartões novos
(bloco csv no formato frente;verso;tags, só do que errei ou deixei lacuna)
\`\`\`

---

# Material e respostas

${blocos}
`;
}

function promptDuvidas(lista) {
  const datas = lista.map(d => d.data).sort();
  return `# Dúvidas da semana (estudaai)
> ${lista.length} ${lista.length === 1 ? "dúvida anotada" : "dúvidas anotadas"} de ${fmt(datas[0])} a ${fmt(datas[datas.length - 1])}. Use uma IA **com busca na internet**.

## Seu papel
Você é meu professor particular. Durante a semana anotei dúvidas e curiosidades enquanto estudava. **Pesquise cada uma em fontes confiáveis** e me traga um resumo do jeito que eu aprendo melhor. Contexto: estudo para o concurso UFMS 2026 (Analista de TI, banca FAPEC) e também fisioterapia, neurociência, música e Libras.

## Como eu aprendo melhor
${PERFIL_MD}
- **Mapa antes do detalhe:** abra cada dúvida com um mapa mental em bloco \`\`\`markmap (no máximo 7 ramos) ou um diagrama Mermaid.
- Cada explicação com **até 150 palavras** e **um exemplo concreto**.
- Termine cada dúvida com **1 pergunta de autoteste** (resposta logo abaixo, depois de "Resposta:").
- Se a dúvida se ligar ao concurso, diga **como isso costuma cair** em prova.

## Regras de fonte
${REGRAS_FONTE}

## Formato OBRIGATÓRIO da resposta (Markdown)
\`\`\`
## n. <a dúvida, reformulada em uma frase clara>
(mapa markmap ou Mermaid)
📌 explicação curta · exemplo concreto · ⚠️ pegadinha ou mito comum (se houver)
**Autoteste:** pergunta · **Resposta:** …
**Fontes:** [nome](link)

## 🔗 Conexões
Como as dúvidas da semana se ligam entre si ou com o que estou estudando.

## 🃏 Cartões novos
(bloco csv no formato frente;verso;tags)
\`\`\`

---

# As dúvidas
${lista.map((d, i) => `${i + 1}. **${d.texto}**${d.origem ? `\n   _(estudando: ${d.origem} · anotada em ${fmt(d.data)})_` : `\n   _(anotada em ${fmt(d.data)})_`}`).join("\n")}
`;
}

/* ---------- IA disponível e envio ----------
   Regra: APIs pagas (melhor modelo para a atividade) → Gemini grátis → copiar e abrir no chat.
   No modo local quem escolhe e tenta a próxima quando uma falha é o servidor (nucleo/ia.py). */
function cadeiaIA(atividade) {
  if (MODO === "nuvem" && NUVEM && NUVEM.sample) return [{ provedor: "conta", modelo: "", gratis: false }];
  if (MODO === "local") return (INFO.cadeia || {})[atividade] || [];
  return [];
}
const descreverCadeia = c => c.map(o => `${NOME_IA[o.provedor]}${o.gratis ? " grátis" : ""}`).concat("chat").join(" → ");
/* Último degrau: copia o pedido e abre o chat no navegador (usa a assinatura dela ou a versão grátis). */
const CHATS = { claude: ["Claude", "https://claude.ai/new"], chatgpt: ["ChatGPT", "https://chatgpt.com/"], gemini: ["Gemini", "https://gemini.google.com/app"] };
const chatPreferido = () => CHATS[st.chatPreferido] ? st.chatPreferido : "claude";
async function copiarEAbrir(txt, chat) {
  st.chatPreferido = chat; salvar();
  try { await navigator.clipboard.writeText(txt); } catch (e) { return copiarTexto(txt); }
  window.open(CHATS[chat][1], "_blank", "noopener");
  toast(`Pedido copiado. No ${CHATS[chat][0]}, cole com Ctrl+V e envie.`);
}
async function iaTexto(prompt, atividade) {
  if (MODO === "nuvem" && NUVEM && NUVEM.sample) {
    const provedor = "conta";
    let r; try { r = await NUVEM.sample.json(prompt + `\n\nIMPORTANTE: devolva um JSON {"markdown": "<a resposta inteira em Markdown>"}.`, { modelTier: "complex" }); }
    catch (e) { throw new Error(e && e.code === "rate_limited" ? "Muitos pedidos seguidos. Espere um pouco." : (e && e.message) || "A IA não respondeu."); }
    if (typeof r === "string") { try { r = JSON.parse(r); } catch (e) { return { provedor, texto: r }; } }
    return { provedor, texto: (r && (r.markdown || r.md)) || JSON.stringify(r) };
  }
  if (MODO !== "local") throw new Error("IA indisponível: use Copiar e abrir no chat.");
  return api("/api/ia/texto", { method: "POST", ...json({ prompt, atividade }) });   /* {provedor, modelo, gratis, texto, falhas} */
}
/* Guarda a resposta da IA e marca o que foi revisado/pesquisado. */
function guardarRespostaIA(tipo, provedor, md, ids, modelo = "") {
  md = String(md || "").trim(); if (!md) throw new Error("A resposta está vazia.");
  const r = { id: novoId(), tipo, data: hojeStr(), provedor, modelo, md, ids };
  st.respostasIA.unshift(r);
  if (tipo === "revisao") st.tentativas.forEach(t => { if (ids.includes(t.id)) t.revisao = r.id; });
  else st.duvidas.forEach(d => { if (ids.includes(d.id)) d.enviada = hojeStr(); });
  marcarDia(1); salvar(); return r;
}

/* ---------- Markdown → HTML (o que as IAs costumam devolver) ---------- */
function mdParaHTML(md) {
  const out = []; let lista = null, code = null, para = [], tab = null;
  const inl = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*\w])[*_]([^*_\s][^*_]*)[*_](?=[^*\w]|$)/g, "$1<i>$2</i>").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  const fecha = () => {
    if (para.length) { out.push(`<p>${para.map(inl).join("<br>")}</p>`); para = []; }
    if (lista) { out.push(`</${lista}>`); lista = null; }
    if (tab) { out.push(`<table class="tab">${tab.map((r, i) => `<tr>${r.map(c => `<${i ? "td" : "th"}>${inl(c)}</${i ? "td" : "th"}>`).join("")}</tr>`).join("")}</table>`); tab = null; }
  };
  for (const l of String(md).replace(/\r/g, "").split("\n")) {
    if (code) { if (/^\s*```/.test(l)) { out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`); code = null; } else code.push(l); continue; }
    let m;
    if (/^\s*```/.test(l)) { fecha(); code = []; continue; }
    if ((m = l.match(/^(#{1,6})\s+(.*)/))) { fecha(); const h = m[1].length <= 2 ? "h3" : "h4"; out.push(`<${h}>${inl(m[2])}</${h}>`); continue; }
    if (/^\s*\|/.test(l)) { if (lista || para.length) fecha(); if (!/^\s*\|?[\s:|-]+\|?\s*$/.test(l)) (tab ||= []).push(l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim())); continue; }
    if ((m = l.match(/^\s*([-*+]|\d+[.)])\s+(.*)/))) { const tipo = /\d/.test(m[1]) ? "ol" : "ul"; if (para.length || tab || lista !== tipo) { fecha(); out.push(`<${tipo}>`); lista = tipo; } out.push(`<li>${inl(m[2])}</li>`); continue; }
    if (/^\s*>/.test(l)) { fecha(); out.push(`<p class="cita">${inl(l.replace(/^\s*>\s?/, ""))}</p>`); continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { fecha(); out.push("<hr>"); continue; }
    if (!l.trim()) { fecha(); continue; }
    if (lista && /^\s{2,}\S/.test(l)) { out[out.length - 1] = out[out.length - 1].replace(/<\/li>$/, `<br>${inl(l.trim())}</li>`); continue; }
    if (lista || tab) fecha();
    para.push(l.trim());
  }
  if (code) out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
  fecha();
  return limparHTML(out.join(""));
}

/* ---------- arquivos e área de transferência ---------- */
function baixarArquivo(nome, texto, tipo = "text/markdown;charset=utf-8", msg = "Arquivo gerado") {
  if (MODO === "nuvem" && NUVEM && NUVEM.downloads) { NUVEM.downloads.save({ filename: nome, data: texto }).then(() => toast(msg)).catch(() => toast("Download cancelado.")); return; }
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast(msg);
}
async function copiarTexto(txt) {
  try { await navigator.clipboard.writeText(txt); toast("Copiado: cole na IA"); }
  catch (e) { abrirModal(`<h2>Copie o pedido</h2><p class="sub">O navegador bloqueou a cópia automática. Selecione tudo (Ctrl+A) e copie (Ctrl+C).</p><textarea style="min-height:300px" readonly>${esc(txt)}</textarea><div class="row"><button class="btn" data-fechar>Fechar</button></div>`, m => $("textarea", m).select()); }
}
