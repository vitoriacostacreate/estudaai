/* ============ IA: pedido, geração, validação e importação de aulas ============ */
/* Gera uma aula com IA e devolve o texto da resposta (JSON). Nuvem: Claude da conta; local: servidor repassa à API. */
async function iaGerar(prompt) {
  if (MODO === "nuvem" && NUVEM.sample) {
    let r; try { r = await NUVEM.sample.json(prompt, { modelTier: "complex" }); } catch (e) { if (e && e.code === "rate_limited") throw new Error("Muitos pedidos seguidos. Espere um pouco e tente de novo."); if (e && e.code === "not_granted") throw new Error("Permissão para usar o Claude negada nesta página."); throw new Error((e && e.message) || "A IA não respondeu."); }
    return typeof r === "string" ? r : JSON.stringify(r);
  }
  if (MODO === "local" && INFO.ia) return JSON.stringify((await api("/api/ia/aula", { method: "POST", ...json({ prompt }) })).aula);
  throw new Error("IA indisponível");
}
async function gerarComIA(tid) {
  const b = $("#melhorar"); b.disabled = true; b.textContent = "Gerando aula com IA… (até 1 min)";
  try { guardarAula(tid, await iaGerar(await pedidoAula(tid))); toast("Aula nova pronta!"); rotear(); }
  catch (e) { toast(e.message); b.disabled = false; b.innerHTML = ico("brilho") + "Melhorar com IA"; }
}
/* Valida a resposta da IA, mantém o link para o PDF da aula anterior e guarda como aula da aluna. */
function guardarAula(tid, txt) {
  const a = validarAula(txt); const ant = aula(tid); if (ant && ant.fonte) a.fonte = ant.fonte;
  st.aulasUser[tid] = a; sessao = {}; salvar(); return a;
}
/* Pedido completo: instruções + texto do PDF (quando o tópico veio de um PDF). */
async function pedidoAula(tid) {
  let pr = promptAula(tid); const info = acharTopico(tid);
  if (MODO !== "arquivo" && /^p-/.test(tid)) { const texto = textoTopico(tid); if (texto) pr += `\n\nUse SOMENTE este texto-fonte (páginas ${info.top.pi}–${info.top.pf} do PDF) como base. Não invente números, leis ou citações que não estejam nele; se estiver confuso, diga.\n=== TEXTO-FONTE ===\n${texto.slice(0, 14000)}`; }
  return pr;
}
function promptAula(tid) {
  const info = acharTopico(tid);
  return `Você é um professor excelente e rigoroso. Crie UMA aula curta e muito visual sobre "${info.top.t}", dentro do tema "${info.tema.nome}" (grupo: ${info.disc.nome}).
Aluna: aprende melhor com material visual, blocos curtos e exemplos concretos; tem perfil TDAH. Português do Brasil.
Seja factualmente correto; se algo for debatido, diga. Não invente números, leis ou citações.

Responda SOMENTE com um JSON válido, sem texto antes ou depois, neste formato:
{
 "titulo": "título curto",
 "ideia": "a ideia central em 1 frase",
 "mapa": {"raiz": "conceito central", "ramos": [["nome do ramo", ["item curto", "item curto"]], ...4 a 6 ramos]},
 "recupere": ["3 perguntas abertas para a aluna tentar responder ANTES da aula"],
 "blocos": [{"t": "título do bloco", "html": "conteúdo em HTML simples (<p>, <b>, <i>, <ul>, <ol>, <li>, <table class='tab'>, <p class='dica'> para pegadinhas, <p class='pratica'> para exercícios práticos)"}, ...3 a 5 blocos],
 "widget": "parear",
 "parear": [["termo", "definição curta"], ...5 pares],
 "quiz": [{"q": "pergunta", "o": ["alternativa A", "B", "C", "D"], "a": 0, "e": "explicação curta de por que a correta é a correta"}, ...5 questões; "a" é o índice da correta],
 "feynman": {"pergunta": "pedido para ela explicar o tema com suas palavras", "chaves": ["5 palavras-chave que uma boa explicação usaria"]},
 "fontes": ["2 ou 3 fontes confiáveis para aprofundar"]
}
Para temas práticos (instrumento, idioma, esporte), inclua nos blocos um exercício prático com tempo e meta mensurável.`;
}
async function modalGerar(tid) {
  const info = acharTopico(tid); const pr = await pedidoAula(tid);
  abrirModal(`<div class="eyebrow">${esc(info.tema.nome)}</div><h2>${esc(info.top.t)}</h2>
    <p class="sub"><b>1.</b> Copie o pedido: o chat abre sozinho, é só colar (Ctrl+V). <b>2.</b> Copie a resposta (o JSON) e cole abaixo. <b>3.</b> Importe: a aula aparece com mapa, perguntas, conteúdo, jogo, teste e Feynman.</p>
    ${MODO === "nuvem" && NUVEM && NUVEM.sample ? `<div class="row"><button class="btn pri" id="agora">${ico("brilho")}Gerar agora com o Claude</button><span class="sub" id="agst"></span></div><p class="sub" style="margin:0">ou faça manualmente:</p>` : ""}
    <pre class="prompt" id="ptxt">${esc(pr)}</pre><div class="row"><button class="btn ${MODO === "nuvem" ? "" : "pri"}" id="copiar">Copiar e abrir no ${CHATS[chatPreferido()][0]}</button></div>
    <label for="json">Cole aqui a resposta da IA</label><textarea id="json" style="min-height:140px" placeholder='{"titulo": "...", ...}'></textarea><div id="erro" class="sub"></div>
    <div class="row"><button class="btn" data-fechar>Fechar</button><button class="btn pri" id="importar">Importar aula</button></div>`, m => {
    if ($("#agora", m)) $("#agora", m).onclick = async () => { const b = $("#agora", m); b.disabled = true; $("#agst", m).textContent = "Gerando… pode levar até 1 minuto";
      try { guardarAula(tid, await iaGerar(pr)); fecharModal(); toast("Aula pronta!"); location.hash = "aula-" + tid; }
      catch (e) { $("#agst", m).textContent = e.message; b.disabled = false; } };
    $("#copiar", m).onclick = () => copiarEAbrir(pr, chatPreferido());
    $("#importar", m).onclick = () => { try { guardarAula(tid, $("#json", m).value); fecharModal(); toast("Aula importada!"); location.hash = "aula-" + tid; } catch (e) { $("#erro", m).innerHTML = `<span style="color:var(--bad)">${esc(e.message)}</span>`; } };
  });
}
function validarAula(txt) {
  let s = txt.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim(); const i = s.indexOf("{"), j = s.lastIndexOf("}"); if (i < 0 || j < 0) throw new Error("Não achei um JSON. Copie a resposta inteira, das chaves { até }.");
  let a; try { a = JSON.parse(s.slice(i, j + 1)); } catch (e) { throw new Error("O JSON está quebrado: " + e.message + ". Peça à IA: 'reenvie só o JSON válido'."); }
  for (const k of ["titulo", "mapa", "blocos", "quiz"]) if (!a[k]) throw new Error(`Falta o campo "${k}".`);
  a.recupere ||= []; a.ideia ||= ""; a.fontes ||= []; if (!Array.isArray(a.mapa.ramos)) throw new Error("mapa.ramos precisa ser uma lista.");
  a.quiz = a.quiz.filter(q => q.q && Array.isArray(q.o) && Number.isInteger(q.a) && q.a < q.o.length);
  if (a.widget && !["parear", "ordenar"].includes(a.widget)) a.widget = null;
  if (a.widget === "parear" && !Array.isArray(a.parear)) a.widget = null; if (a.widget === "ordenar" && !Array.isArray(a.ordenar)) a.widget = null;
  return a;
}
