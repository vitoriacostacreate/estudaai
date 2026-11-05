const NOVOS_DIA = 20;
function cardsDoTema(tid) { return CARDS.filter(c => tid === "todos" || c.tema === tid); }
function filaCartoes(tid) {
  if (st.novos.data !== hojeStr()) st.novos = { data: hojeStr(), n: 0 };
  const h = hojeStr(); const venc = [], novos = [];
  for (const c of cardsDoTema(tid)) { const s = st.cards[c.id]; if (!s || !s.S) novos.push(c); else if (s.prox <= h) venc.push(c); }
  const livres = Math.max(0, NOVOS_DIA - st.novos.n);
  return venc.concat(novos.slice(0, livres));
}
/* FSRS-4.5: modelo de memória DSR (dificuldade, estabilidade, recuperabilidade) do projeto open-spaced-repetition,
   o mesmo algoritmo que o Anki usa hoje. Pesos padrão do FSRS-4.5; retenção desejada de 90%. */
const FSRS = {
  W: [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755],
  DECAY: -0.5, FACTOR: 19 / 81,
  R(t, S) { return Math.pow(1 + this.FACTOR * t / S, this.DECAY); },
  D0(g) { return Math.min(10, Math.max(1, this.W[4] - (g - 3) * this.W[5])); },
  proximo(s, g) {               /* g: 1 errei, 2 difícil, 3 bom, 4 fácil */
    const W = this.W; let S, D;
    if (!s || !s.S) { S = W[g - 1]; D = this.D0(g); }
    else {
      const t = Math.max(0, (new Date(hojeStr() + "T00:00:00") - new Date((s.ultima || hojeStr()) + "T00:00:00")) / 864e5);
      const R = this.R(t, s.S); D = s.D;
      if (g === 1) S = W[11] * Math.pow(D, -W[12]) * (Math.pow(s.S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R));
      else S = s.S * (1 + Math.exp(W[8]) * (11 - D) * Math.pow(s.S, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
      D = Math.min(10, Math.max(1, W[7] * this.D0(4) + (1 - W[7]) * (D - W[6] * (g - 3))));
    }
    const int = g === 1 ? 0 : Math.max(1, Math.min(36500, Math.round(S)));
    return { S, D, int };
  }
};
function responderCartao(c, nota) {
  const ant = st.cards[c.id]; const novo = !ant || !ant.S; const g = nota + 1;
  const r = FSRS.proximo(novo ? null : ant, g);
  const s = { S: r.S, D: r.D, int: r.int, n: ((ant && ant.n) || 0) + 1, lapsos: ((ant && ant.lapsos) || 0) + (g === 1 ? 1 : 0), ultima: hojeStr(), prox: addDias(r.int) };
  st.cards[c.id] = s; if (novo) st.novos.n++; marcarDia(.2); salvar();
}
