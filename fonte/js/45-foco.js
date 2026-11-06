/* ============ acrescentou.ai: núcleo do contador de foco (sem DOM, testado em testes/foco.test.js) ============
   O número só cresce: cada bloco FECHADO de foco vale +1 soma. O tempo total guarda todos os segundos, à parte.
   Uma sessão: { tipo, ref, rotulo, cat, bloco (s), ini (ms), seg (s acumulados), desde (ms do trecho rodando, ou null se pausada), ultimo (ms do último sinal de atividade) }. */
const FOCO = (() => {
  const BLOCO = { aula: 20 * 60, cartoes: 20 * 60, ia: 20 * 60, manual: 30 * 60 };
  const OCIOSO = 5 * 60;          /* atividades automáticas pausam depois de 5 min sem clique, tecla ou rolagem */
  const MINIMO = 60;              /* sessões com menos de 1 min não entram no histórico */
  const NOMES = { aula: "Aulas", cartoes: "Cartões", ia: "Revisão com IA", manual: "Foco livre" };
  const dia = ms => { const d = new Date(ms); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

  const novo = (tipo, ref, rotulo, agora) => ({ tipo, ref: ref || null, rotulo: rotulo || NOMES[tipo] || "", cat: null, bloco: BLOCO[tipo] || BLOCO.manual, ini: agora, seg: 0, desde: agora, ultimo: agora });
  const decorrido = (s, agora) => s.seg + (s.desde != null ? Math.max(0, agora - s.desde) / 1000 : 0);
  function pausar(s, agora) { if (s.desde != null) { s.seg = decorrido(s, agora); s.desde = null; } return s; }
  function retomar(s, agora) { if (s.desde == null) s.desde = agora; s.ultimo = agora; return s; }
  /* Sinal de atividade (clique, tecla, rolagem). Se o último sinal foi há mais de 5 min, o intervalo não conta. */
  function atividade(s, agora) {
    if (s.desde != null && (agora - s.ultimo) / 1000 > OCIOSO) { pausar(s, s.ultimo); s.desde = agora; }
    else if (s.desde == null) s.desde = agora;
    s.ultimo = agora; return s;
  }
  /* Chamada a cada segundo nas atividades automáticas. Devolve true se acabou de pausar por ócio. */
  function verificarOcio(s, agora) { if (s.desde != null && (agora - s.ultimo) / 1000 > OCIOSO) { pausar(s, s.ultimo); return true; } return false; }

  function placar(seg, bloco) { seg = Math.floor(seg); return { seg, somas: Math.floor(seg / bloco), resto: seg % bloco, falta: bloco - seg % bloco, p: (seg % bloco) / bloco }; }
  function encerrar(s, agora) {
    pausar(s, agora); const p = placar(s.seg, s.bloco);
    return { id: s.ini.toString(36) + Math.random().toString(36).slice(2, 5), tipo: s.tipo, ref: s.ref, rotulo: s.rotulo, cat: s.cat, tema: s.tema || null, dia: dia(s.ini), ini: s.ini, fim: agora, seg: p.seg, bloco: s.bloco, somas: p.somas };
  }

  /* Totais por dia, por tipo de atividade e por categoria. */
  function resumo(regs) {
    const r = { total: { seg: 0, somas: 0, n: 0 }, dia: {}, tipo: {}, cat: {}, tema: {} };
    const soma = (o, k, x) => { if (k == null) return; const v = o[k] ||= { seg: 0, somas: 0, n: 0 }; v.seg += x.seg; v.somas += x.somas; v.n++; };
    for (const x of regs) { r.total.seg += x.seg; r.total.somas += x.somas; r.total.n++; soma(r.dia, x.dia, x); soma(r.tipo, x.tipo, x); soma(r.cat, x.cat, x); soma(r.tema, x.tema, x); }
    return r;
  }

  const dur = seg => { const m = Math.floor(seg / 60); return m < 60 ? m + " min" : Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") + " min"; };
  const relogio = seg => { seg = Math.floor(seg); const h = Math.floor(seg / 3600), m = Math.floor(seg / 60) % 60, s = seg % 60; return (h ? h + ":" + String(m).padStart(2, "0") : String(m).padStart(2, "0")) + ":" + String(s).padStart(2, "0"); };

  return { BLOCO, OCIOSO, MINIMO, NOMES, dia, novo, decorrido, pausar, retomar, atividade, verificarOcio, placar, encerrar, resumo, dur, relogio };
})();
if (typeof module !== "undefined") module.exports = FOCO;
