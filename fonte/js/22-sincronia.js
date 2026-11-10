/* ============ sincronia entre aparelhos (só no modo local) ============
   O servidor guarda o progresso de cada aparelho num repositório Git privado só de dados (dados/sync, nucleo/sincronia.py):
   puxa ao abrir, envia sozinho depois de salvar e ao fechar. O Git só transporta: cada aparelho escreve o próprio arquivo,
   então nunca há conflito de merge. Quem junta é o app, aqui (SINC, sem DOM, testado em testes/sincronia.test.js). */
const SINC = (() => {
  const SEM = Symbol("sem base");   /* junção de 2 vias: não sei o que o outro aparelho tinha antes */
  const obj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const chave = x => obj(x) ? String(x.id ?? x.ini ?? x.nome ?? JSON.stringify(x)) : JSON.stringify(x);
  /* Compara sem ligar para a ordem das chaves nem para o carimbo _t. */
  const canon = v => Array.isArray(v) ? "[" + v.map(canon).join(",") + "]"
    : obj(v) ? "{" + Object.keys(v).filter(k => k !== "_t" && v[k] !== undefined).sort().map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}"
    : JSON.stringify(v);
  const igual = (a, b) => canon(a) === canon(b);
  const filho = (bs, k) => bs === SEM ? SEM : obj(bs) ? bs[k] : undefined;
  /* Progresso nunca é apagado pela junção; as chaves do topo do estado também não. */
  const apagavel = c => c.includes(".") && !/^(top|cards|dias)\.[^.]+$/.test(c);

  /* Listas. Sem base: união (o que existe nos dois fica com o lado mais novo).
     Com base: quem mexeu no item ganha; o que um lado apagou sem o outro ter mexido sai. */
  function lista(a, b, bNovo, bs) {
    const B = new Map(b.map(x => [chave(x), x]));
    const S = Array.isArray(bs) ? new Map(bs.map(x => [chave(x), x])) : null;
    const antes = k => S && S.has(k) ? S.get(k) : SEM;
    const out = [], vistos = new Set();
    for (const x of a) {
      const k = chave(x), s = antes(k); if (vistos.has(k)) continue; vistos.add(k);
      if (!B.has(k)) { if (s === SEM || !igual(x, s)) out.push(x); continue; }          /* o outro apagou e eu não mexi → sai */
      const y = B.get(k);
      out.push(igual(x, y) ? x : s !== SEM && igual(y, s) ? x : s !== SEM && igual(x, s) ? y : bNovo ? y : x);
    }
    for (const y of b) {
      const k = chave(y), s = antes(k); if (vistos.has(k)) continue; vistos.add(k);
      if (s === SEM || !igual(y, s)) out.push(y);                                          /* eu apaguei e o outro não mexeu → não volta */
    }
    return out;
  }
  /* Tópico ou cartão: vale o registro com mais revisões; empate → o estudado por último; empate → o lado mais novo. */
  function registro(x, y, bNovo) {
    if (!obj(x) || !obj(y)) return bNovo ? y : x;
    if ((x.n || 0) !== (y.n || 0)) return (y.n || 0) > (x.n || 0) ? y : x;
    if ((x.ultima || "") !== (y.ultima || "")) return (y.ultima || "") > (x.ultima || "") ? y : x;
    return bNovo ? y : x;
  }
  function campo(x, y, bNovo, c, bs) {
    if (/^(top|cards)\.[^.]+$/.test(c)) return registro(x, y, bNovo);
    if (/^dias\.[^.]+$/.test(c)) return Math.max(+x || 0, +y || 0);
    if ((c === "hoje" || c === "novos") && obj(x) && obj(y) && x.data !== y.data) return (y.data || "") > (x.data || "") ? y : x;
    if (c === "novos" && obj(x) && obj(y)) return { ...x, n: Math.max(x.n || 0, y.n || 0) };
    if (c === "foco.atual") return bNovo ? (y ?? x) : (x ?? y);
    return juntar(x, y, bNovo, c, bs);
  }
  function juntar(a, b, bNovo, c, bs) {
    if (Array.isArray(a) && Array.isArray(b)) return lista(a, b, bNovo, bs);
    if (obj(a) && obj(b)) {
      const out = {}, tinha = k => obj(bs) && k in bs;
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const ck = c ? c + "." + k : k;
        if (k in a && k in b) out[k] = campo(a[k], b[k], bNovo, ck, filho(bs, k));
        else { const v = k in a ? a[k] : b[k]; if (!(tinha(k) && apagavel(ck) && igual(v, bs[k]))) out[k] = v; }   /* apagado de um lado, intacto do outro → sai */
      }
      return out;
    }
    if (b === undefined) return a; if (a === undefined) return b;
    if (igual(a, b)) return a;
    if (bs !== SEM) { if (igual(b, bs)) return a; if (igual(a, bs)) return b; }   /* só um dos dois mexeu → vale a mudança */
    return bNovo ? b : a;
  }
  /* Junta o progresso de dois aparelhos: a = este, b = o outro, base = o estado do outro na última vez que juntei
     (opcional). Se o outro "voltou no tempo" (backup antigo), a base não vale e a junção só une, sem apagar nada. */
  function juntarEstado(a, b, base) {
    a = a || {}; b = b || {};
    const bs = obj(base) && (b._t || 0) >= (base._t || 0) ? base : SEM;
    const r = juntar(a, b, (b._t || 0) > (a._t || 0), "", bs);
    r._t = Math.max(a._t || 0, b._t || 0); return r;
  }
  function juntarBiblioteca(a, b, base) {
    const vazio = { docs: [], temas: [], anexos: {} };
    const r = juntar({ ...vazio, ...(a || {}) }, { ...vazio, ...(b || {}) }, false, "bib", obj(base) ? { ...vazio, ...base } : SEM);
    const v = Math.max((a && a.vinculo) || 0, (b && b.vinculo) || 0); if (v) r.vinculo = v; else delete r.vinculo;
    return r;
  }
  /* Dias seguidos com estudo. Enquanto hoje não tem estudo, a sequência que vinha até ontem continua valendo:
     só zera quando um dia inteiro passa em branco. */
  function sequencia(dias, hoje) {
    const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const d = new Date(hoje + "T12:00:00"); let n = 0; dias = dias || {};
    if (!dias[iso(d)]) d.setDate(d.getDate() - 1);
    for (; dias[iso(d)]; d.setDate(d.getDate() - 1)) n++;
    return n;
  }
  const hora = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); };
  return { juntarEstado, juntarBiblioteca, igual, hora, sequencia };
})();
if (typeof module !== "undefined") module.exports = SINC;

/* ---------- interface (modo local) ---------- */
let GITS = null, _sincT, _sincVerif = 0, _sincJuntando = false;
const sincLigado = () => typeof MODO !== "undefined" && MODO === "local" && !!(GITS && GITS.ligado);
const rotaAtual = () => (location.hash || "#inicio").slice(1);

function marcarSinc() {
  const c = typeof document !== "undefined" && document.getElementById("git"); if (!c || !GITS) return;
  const h = GITS.enviado ? new Date(GITS.enviado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
  const parado = GITS.pendente && GITS.erro;
  c.classList.toggle("alerta", !!parado); c.classList.toggle("ok", !GITS.pendente);
  c.innerHTML = ico("sincronia") + (parado ? `<b>envio pendente</b>` : GITS.pendente ? `<span class="l">Git</span><b>enviando…</b>` : `<span class="l">Git ✓</span><b>${h}</b>`);
  c.title = parado ? `Ainda não consegui enviar: ${GITS.erro} Seu progresso está salvo neste aparelho e eu tento de novo sozinho. Clique para tentar agora.`
    : `Progresso deste aparelho (${GITS.aparelho}) enviado sozinho para o seu repositório privado de dados.${GITS.aviso ? " " + GITS.aviso : ""} Clique para sincronizar agora.`;
}

async function atualizarSinc() {
  try { GITS = await api("/api/sinc"); } catch (e) { if (GITS) { GITS.pendente = true; GITS.erro = "o estudaai parou de rodar?"; } }
  marcarSinc(); clearTimeout(_sincT);
  if (GITS && GITS.pendente) _sincT = setTimeout(atualizarSinc, 60000);   /* o servidor tenta de novo sozinho; aqui só acompanho */
}

/* Chamado depois de cada gravação no servidor: ele envia sozinho ~30 s depois da última mudança. */
function sincDepoisDeSalvar() {
  if (!sincLigado()) return;
  GITS.pendente = true; GITS.erro = ""; marcarSinc(); clearTimeout(_sincT);
  _sincT = setTimeout(atualizarSinc, 38000);
}

/* Ao abrir, ao voltar à aba e no clique do chip: puxa o que os outros aparelhos enviaram e junta sozinho, sem perguntar.
   Nada se perde: a junção é de 3 vias (o servidor guarda a última versão já juntada de cada aparelho). */
async function juntarAparelhos(manual) {
  if (typeof MODO === "undefined" || MODO !== "local" || _sincJuntando || (!manual && Date.now() - _sincVerif < 30000)) return;
  _sincVerif = Date.now(); _sincJuntando = true;
  const nomes = [];
  try {
    const r = await api("/api/sinc/puxar", { method: "POST" });
    GITS = r; if (!r.ligado) return;
    for (const o of r.outros || []) {
      if (!o.novo) continue;
      const base = o.base || {};
      const est = SINC.juntarEstado(st, o.estado, base.estado), bib = SINC.juntarBiblioteca(indiceAtual(), o.biblioteca, base.biblioteca);
      const mudouBib = !SINC.igual(bib, indiceAtual()), mudouEst = !SINC.igual(est, st);
      if (mudouBib) { await armazem().gravarIndice(bib); BIB._ok = false; await carregarBiblioteca(); }
      if (mudouEst) { carregar(est); salvar(); }
      await api("/api/sinc/visto", { method: "POST", ...json({ aparelho: o.aparelho, atualizado: o.atualizado }) });
      if (mudouBib || mudouEst) nomes.push(o.aparelho);
    }
    if (manual) { GITS = { ...GITS, ...(await api("/api/sinc/enviar?esperar=1", { method: "POST" })) }; toast(GITS.pendente ? "Ainda não consegui enviar. Tento de novo sozinho." : "Sincronizado"); }
    else if (nomes.length) toast(`Juntei o progresso do ${nomes.join(" e do ")}`);
  } catch (e) { if (manual) toast("Não consegui sincronizar: " + e.message); }
  finally {
    _sincJuntando = false;
    /* Redesenha a tela só onde não atrapalha: no meio de uma aula, revisão, foco ou janela aberta, atualiza só o topo. */
    const h = rotaAtual(), calma = !document.querySelector(".modal") && /^(inicio|temas|tema-|biblioteca|progresso)/.test(h);
    if (nomes.length && calma) rotear(); else topo(h);
  }
}

if (typeof window !== "undefined") {
  /* Ao fechar a aba: manda o estado pendente e o servidor envia na hora (sendBeacon sobrevive ao fechamento). */
  window.addEventListener("pagehide", () => {
    if (!sincLigado()) return;
    const corpo = new Blob([JSON.stringify(st)], { type: "text/plain" });
    if (!navigator.sendBeacon("/api/sinc/enviar", corpo)) navigator.sendBeacon("/api/sinc/enviar");
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") juntarAparelhos(); });
}
