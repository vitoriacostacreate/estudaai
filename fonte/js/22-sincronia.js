/* ============ sincronia com o Obsidian (só no modo local) ============
   O servidor grava o progresso numa nota do cofre (nucleo/sincronia.py) ~2 s depois de cada gravação,
   e o Obsidian Sync leva a nota ao outro aparelho. Aqui: juntar os dados (SINC, sem DOM, testado em
   testes/sincronia.test.js), perguntar se sincroniza ao abrir e o chip "Obsidian ✓ 14:32" no topo. */
const SINC = (() => {
  const obj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const chave = x => obj(x) ? String(x.id ?? x.ini ?? x.nome ?? JSON.stringify(x)) : JSON.stringify(x);
  /* União de listas: o que só existe de um lado entra; o que existe nos dois fica com o lado mais novo. */
  function lista(a, b, bNovo) {
    const m = new Map(); for (const x of a) m.set(chave(x), x);
    for (const x of b) { const k = chave(x); if (!m.has(k) || bNovo) m.set(k, x); }
    return [...m.values()];
  }
  /* Tópico ou cartão: vale o registro com mais revisões; empate → o estudado por último; empate → o lado mais novo. */
  function registro(x, y, bNovo) {
    if (!obj(x) || !obj(y)) return bNovo ? y : x;
    if ((x.n || 0) !== (y.n || 0)) return (y.n || 0) > (x.n || 0) ? y : x;
    if ((x.ultima || "") !== (y.ultima || "")) return (y.ultima || "") > (x.ultima || "") ? y : x;
    return bNovo ? y : x;
  }
  function campo(x, y, bNovo, c) {
    if (/^(top|cards)\.[^.]+$/.test(c)) return registro(x, y, bNovo);
    if (/^dias\.[^.]+$/.test(c)) return Math.max(+x || 0, +y || 0);
    if ((c === "hoje" || c === "novos") && obj(x) && obj(y) && x.data !== y.data) return (y.data || "") > (x.data || "") ? y : x;
    if (c === "novos" && obj(x) && obj(y)) return { ...x, n: Math.max(x.n || 0, y.n || 0) };
    if (c === "foco.atual") return bNovo ? (y ?? x) : (x ?? y);
    return juntar(x, y, bNovo, c);
  }
  function juntar(a, b, bNovo, c) {
    if (Array.isArray(a) && Array.isArray(b)) return lista(a, b, bNovo);
    if (obj(a) && obj(b)) { const out = { ...a }; for (const k of Object.keys(b)) out[k] = k in a ? campo(a[k], b[k], bNovo, c ? c + "." + k : k) : b[k]; return out; }
    if (b === undefined) return a; if (a === undefined) return b;
    return bNovo ? b : a;
  }
  /* Junta o progresso de dois aparelhos. Nunca apaga: o que foi feito em qualquer um dos dois fica. */
  function juntarEstado(a, b) {
    a = a || {}; b = b || {};
    const r = juntar(a, b, (b._t || 0) > (a._t || 0), "");
    r._t = Math.max(a._t || 0, b._t || 0); return r;
  }
  function juntarBiblioteca(a, b) {
    const vazio = { docs: [], temas: [], anexos: {} };
    const r = juntar({ ...vazio, ...(a || {}) }, { ...vazio, ...(b || {}) }, false, "bib");
    const v = Math.max((a && a.vinculo) || 0, (b && b.vinculo) || 0); if (v) r.vinculo = v; else delete r.vinculo;
    return r;
  }
  /* Compara sem ligar para a ordem das chaves nem para o carimbo _t. */
  const canon = v => Array.isArray(v) ? "[" + v.map(canon).join(",") + "]"
    : obj(v) ? "{" + Object.keys(v).filter(k => k !== "_t" && v[k] !== undefined).sort().map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}"
    : JSON.stringify(v);
  const igual = (a, b) => canon(a) === canon(b);
  const hora = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); };
  return { juntarEstado, juntarBiblioteca, igual, hora };
})();
if (typeof module !== "undefined") module.exports = SINC;

/* ---------- interface (modo local) ---------- */
let OBS = null, _obsT, _obsVerif = 0, _obsSalvando = false;
const obsLigado = () => typeof MODO !== "undefined" && MODO === "local" && OBS && OBS.cofre;

function marcarObs(erro) {
  const c = typeof document !== "undefined" && document.getElementById("obs"); if (!c || !OBS) return;
  const h = OBS.meu ? new Date(OBS.meu).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
  c.classList.toggle("alerta", !!erro); c.classList.toggle("ok", !erro && !_obsSalvando);
  c.innerHTML = ico("sincronia") + (erro ? "<b>Obsidian: erro</b>" : _obsSalvando ? `<span class="l">Obsidian</span><b>salvando…</b>` : `<span class="l">Obsidian ✓</span><b>${h}</b>`);
  c.title = erro || `Progresso salvo no Obsidian (${OBS.aparelho}). O Obsidian Sync leva para o outro aparelho. Clique para sincronizar agora.`;
}

/* Chamado depois de cada gravação no servidor: o servidor exporta sozinho em ~2 s; aqui só atualiza o chip. */
function obsDepoisDeSalvar() {
  if (!obsLigado()) return;
  _obsSalvando = true; marcarObs(); clearTimeout(_obsT);
  _obsT = setTimeout(async () => { try { const r = await api("/api/obsidian"); OBS.meu = r.meu || OBS.meu; _obsSalvando = false; marcarObs(); } catch (e) { _obsSalvando = false; marcarObs("O estudaai parou de rodar?"); } }, 3500);
}

async function obsSalvarAgora() {
  try { const r = await api("/api/obsidian/salvar", { method: "POST" }); if (r.atualizado) OBS.meu = r.atualizado; _obsSalvando = false; marcarObs(); toast("Sincronizado com o Obsidian"); }
  catch (e) { marcarObs("Não consegui salvar no Obsidian: " + e.message); }
}

/* Ao abrir (e ao voltar para a aba): o outro aparelho tem progresso novo? Se juntar muda algo, pergunta. */
async function verificarObsidian() {
  if (typeof MODO === "undefined" || MODO !== "local" || Date.now() - _obsVerif < 30000) return;
  _obsVerif = Date.now();
  try { OBS = await api("/api/obsidian"); } catch (e) { return; }
  if (!OBS.cofre) return;
  topo((location.hash || "#inicio").slice(1));
  for (const o of OBS.outros || []) {
    if (!o.atualizado || o.atualizado <= (o.visto || "")) continue;
    let r; try { r = await api("/api/obsidian/aparelho/" + encodeURIComponent(o.aparelho)); } catch (e) { continue; }
    const est = SINC.juntarEstado(st, r.estado), bib = SINC.juntarBiblioteca(indiceAtual(), r.biblioteca);
    if (SINC.igual(est, st) && SINC.igual(bib, indiceAtual())) { await obsVisto(o); continue; }
    return perguntarSync(o, r);
  }
}
const obsVisto = o => api("/api/obsidian/visto", { method: "POST", ...json({ aparelho: o.aparelho, atualizado: o.atualizado }) }).catch(() => { });

function perguntarSync(o, r) {
  abrirModal(`<div class="grid" style="gap:12px"><h3>${ico("sincronia")} Sincronizar com o Obsidian?</h3>
    <p>Tem progresso do <b>${esc(o.aparelho)}</b> de <b>${SINC.hora(o.atualizado)}</b>.</p>
    ${o.ultimo ? `<p class="sub">O que mudou lá: ${esc(o.ultimo)}</p>` : ""}
    <p class="sub">Nada se perde: o app junta o que você fez nos dois aparelhos.</p>
    <div class="row"><button class="btn pri" id="obs-sim">Sincronizar</button><button class="btn" data-fechar>Agora não</button></div></div>`, m => {
    m.querySelector("#obs-sim").onclick = async e => {
      e.target.disabled = true; e.target.textContent = "Sincronizando…";
      try {
        carregar(SINC.juntarEstado(st, r.estado)); salvar();          /* recalcula na hora, com o estado mais atual */
        const bib = SINC.juntarBiblioteca(indiceAtual(), r.biblioteca);
        if (!SINC.igual(bib, indiceAtual())) { await armazem().gravarIndice(bib); BIB._ok = false; await carregarBiblioteca(); }
        await obsVisto(o); fecharModal(); toast(`Sincronizado com o ${o.aparelho}`); rotear();
        _obsVerif = 0; verificarObsidian();                           /* se houver um terceiro aparelho */
      } catch (err) { e.target.disabled = false; e.target.textContent = "Tentar de novo"; toast("Não consegui sincronizar: " + err.message); }
    };
  });
}

if (typeof window !== "undefined") {
  /* Ao fechar a aba: grava o estado pendente e exporta na hora (sendBeacon sobrevive ao fechamento). */
  window.addEventListener("pagehide", () => {
    if (!obsLigado()) return;
    const corpo = new Blob([JSON.stringify(st)], { type: "text/plain" });
    if (!navigator.sendBeacon("/api/obsidian/salvar", corpo)) navigator.sendBeacon("/api/obsidian/salvar");
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") verificarObsidian(); });
}
