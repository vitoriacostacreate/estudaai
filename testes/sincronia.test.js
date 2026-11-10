// Testes da junção do progresso entre aparelhos (fonte/js/22-sincronia.js).   node --test testes/*.test.js
const test = require("node:test");
const assert = require("node:assert");
const SINC = require("../fonte/js/22-sincronia.js");

test("tópicos e cartões: vale o registro com mais revisões, depois o mais recente", () => {
  const a = { top: { t1: { n: 3, ultima: "2026-11-05" }, t2: { n: 1, ultima: "2026-11-01" } }, cards: { c: { n: 2, ultima: "2026-11-07" } }, _t: 10 };
  const b = { top: { t1: { n: 2, ultima: "2026-11-08" }, t2: { n: 1, ultima: "2026-11-06" }, t3: { n: 1 } }, cards: { c: { n: 2, ultima: "2026-11-08" } }, _t: 5 };
  const r = SINC.juntarEstado(a, b);
  assert.deepStrictEqual(r.top.t1, { n: 3, ultima: "2026-11-05" });
  assert.deepStrictEqual(r.top.t2, { n: 1, ultima: "2026-11-06" });
  assert.deepStrictEqual(r.top.t3, { n: 1 });
  assert.strictEqual(r.cards.c.ultima, "2026-11-08");
  assert.strictEqual(r._t, 10);
});

test("nunca apaga: listas viram união e dias ficam com a maior pontuação", () => {
  const a = { dias: { "2026-11-07": 3, "2026-11-08": 1 }, tentativas: [{ id: "x" }], foco: { sessoes: [{ ini: 1, seg: 60 }], atual: null }, _t: 1 };
  const b = { dias: { "2026-11-08": 4.2 }, tentativas: [{ id: "x" }, { id: "y" }], foco: { sessoes: [{ ini: 2, seg: 90 }], atual: { ini: 3 } }, _t: 2 };
  const r = SINC.juntarEstado(a, b);
  assert.deepStrictEqual(r.dias, { "2026-11-07": 3, "2026-11-08": 4.2 });
  assert.deepStrictEqual(r.tentativas.map(t => t.id), ["x", "y"]);
  assert.deepStrictEqual(r.foco.sessoes.map(s => s.ini), [1, 2]);
  assert.deepStrictEqual(r.foco.atual, { ini: 3 });
});

test("valores simples ficam com o aparelho que salvou por último; 'hoje' fica com o dia mais novo", () => {
  const a = { principal: "concurso", prepara: { r: { idade: "28", ingles: "B1" } }, hoje: { data: "2026-11-07", feitos: ["a"] }, _t: 1 };
  const b = { principal: "fisio", prepara: { r: { ingles: "B2" } }, hoje: { data: "2026-11-08", feitos: ["b"] }, _t: 2 };
  const r = SINC.juntarEstado(a, b);
  assert.strictEqual(r.principal, "fisio");
  assert.deepStrictEqual(r.prepara.r, { idade: "28", ingles: "B2" });
  assert.deepStrictEqual(r.hoje, { data: "2026-11-08", feitos: ["b"] });
  const mesmoDia = SINC.juntarEstado({ hoje: { data: "d", feitos: ["a"] } }, { hoje: { data: "d", feitos: ["b"] } });
  assert.deepStrictEqual(mesmoDia.hoje.feitos, ["a", "b"]);
});

test("biblioteca: une PDFs, temas e anexos por id", () => {
  const a = { docs: [{ id: "d1" }], temas: [{ id: "t1" }], anexos: { fisio: [{ id: "d-d1" }] }, vinculo: 2 };
  const b = { docs: [{ id: "d1" }, { id: "d2" }], temas: [], anexos: { fisio: [{ id: "d-d2" }], neuro: [{ id: "d-d3" }] } };
  const r = SINC.juntarBiblioteca(a, b);
  assert.deepStrictEqual(r.docs.map(d => d.id), ["d1", "d2"]);
  assert.deepStrictEqual(r.anexos.fisio.map(x => x.id), ["d-d1", "d-d2"]);
  assert.ok(r.anexos.neuro);
  assert.strictEqual(r.vinculo, 2);
});

test("igual ignora a ordem das chaves e o carimbo _t (para não perguntar à toa)", () => {
  const a = { top: { x: { n: 1, ultima: "d" } }, _t: 1 };
  assert.ok(SINC.igual(a, { _t: 9, top: { x: { ultima: "d", n: 1 } } }));
  assert.ok(SINC.igual(SINC.juntarEstado(a, a), a));
  assert.ok(!SINC.igual(SINC.juntarEstado(a, { top: { y: { n: 1 } } }), a));
});

/* ---------- dias seguidos ---------- */
test("dias seguidos: hoje ainda sem estudo não zera a sequência que vinha até ontem", () => {
  const dias = { "2026-11-05": 3, "2026-11-08": 13, "2026-11-09": 8.2 };      // caso real de 10/11/2026
  assert.strictEqual(SINC.sequencia(dias, "2026-11-10"), 2);                  // antes de estudar hoje
  assert.strictEqual(SINC.sequencia({ ...dias, "2026-11-10": 1 }, "2026-11-10"), 3);
  assert.strictEqual(SINC.sequencia(dias, "2026-11-11"), 0);                  // um dia inteiro em branco: zera
  assert.strictEqual(SINC.sequencia({}, "2026-11-10"), 0);
  assert.strictEqual(SINC.sequencia({ "2026-10-31": 1, "2026-11-01": 1 }, "2026-11-01"), 2);   // virada de mês
});

test("dias seguidos: os dois aparelhos mostram o mesmo número depois de juntar, em qualquer ordem", () => {
  const note = { dias: { "2026-11-05": 3, "2026-11-08": 13, "2026-11-09": 8.2 }, _t: 2 };
  const pc = { dias: { "2026-11-05": 3, "2026-11-08": 13, "2026-11-10": 1 }, _t: 3 };
  const a = SINC.juntarEstado(note, pc), b = SINC.juntarEstado(pc, note);
  assert.deepStrictEqual(a.dias, b.dias);
  assert.strictEqual(SINC.sequencia(a.dias, "2026-11-10"), 3);
  assert.strictEqual(SINC.sequencia(b.dias, "2026-11-10"), 3);
});

/* ---------- junção de 3 vias (base = o estado do outro aparelho na última vez que juntei) ---------- */
test("3 vias: cada aparelho mudou um campo diferente → ficam as duas mudanças", () => {
  const base = { prepara: { r: { x: "antigo", y: "antigo" } }, _t: 1 };
  const meu = { prepara: { r: { x: "NOVO-A", y: "antigo" } }, _t: 2 };
  const deles = { prepara: { r: { x: "antigo", y: "NOVO-B" } }, _t: 3 };        // salvou depois, mas não mexeu em x
  assert.deepStrictEqual(SINC.juntarEstado(meu, deles, base).prepara.r, { x: "NOVO-A", y: "NOVO-B" });
  assert.deepStrictEqual(SINC.juntarEstado(meu, deles).prepara.r, { x: "antigo", y: "NOVO-B" });   // sem base: regra antiga
});

test("3 vias: os dois mudaram o mesmo campo → vale quem salvou por último", () => {
  const base = { principal: "concurso", _t: 1 };
  assert.strictEqual(SINC.juntarEstado({ principal: "fisio", _t: 5 }, { principal: "neuro", _t: 3 }, base).principal, "fisio");
  assert.strictEqual(SINC.juntarEstado({ principal: "fisio", _t: 2 }, { principal: "neuro", _t: 3 }, base).principal, "neuro");
});

test("3 vias: o que foi apagado num aparelho não volta", () => {
  const base = { duvidas: [{ id: "d1" }, { id: "d2" }], notas: { t1: "a", t2: "b" }, _t: 1 };
  // o outro apagou d1 e a nota t1; eu apaguei d2 e criei d3
  const meu = { duvidas: [{ id: "d1" }, { id: "d3" }], notas: { t1: "a", t2: "b" }, _t: 2 };
  const deles = { duvidas: [{ id: "d2" }], notas: { t2: "b" }, _t: 3 };
  const r = SINC.juntarEstado(meu, deles, base);
  assert.deepStrictEqual(r.duvidas.map(d => d.id), ["d3"]);
  assert.deepStrictEqual(r.notas, { t2: "b" });
});

test("3 vias: apagado de um lado, mas editado do outro → fica (na dúvida, não perde)", () => {
  const base = { duvidas: [{ id: "d1", texto: "a" }], _t: 1 };
  const r = SINC.juntarEstado({ duvidas: [{ id: "d1", texto: "a, editada" }], _t: 2 }, { duvidas: [], _t: 3 }, base);
  assert.deepStrictEqual(r.duvidas, [{ id: "d1", texto: "a, editada" }]);
});

test("3 vias: progresso (tópicos, cartões, dias) nunca é apagado, nem com o outro aparelho zerado", () => {
  const base = { top: { t1: { n: 1 } }, cards: { c1: { n: 2 } }, dias: { "2026-11-08": 3 }, _t: 1 };
  const r = SINC.juntarEstado({ ...base, _t: 2 }, { top: {}, cards: {}, dias: {}, _t: 3 }, base);
  assert.deepStrictEqual(r.top, base.top);
  assert.deepStrictEqual(r.cards, base.cards);
  assert.deepStrictEqual(r.dias, base.dias);
});

test("3 vias: se o outro aparelho voltou no tempo (backup antigo, reinstalação), ignora a base e só une", () => {
  const base = { duvidas: [{ id: "d1" }], _t: 10 };
  const r = SINC.juntarEstado({ duvidas: [{ id: "d1" }], _t: 11 }, { duvidas: [], _t: 4 }, base);
  assert.deepStrictEqual(r.duvidas, [{ id: "d1" }]);
});

test("3 vias na biblioteca: PDF removido num aparelho some no outro; PDF novo entra", () => {
  const base = { docs: [{ id: "d1" }, { id: "d2" }], temas: [], anexos: { fisio: [{ id: "a1" }] } };
  const meu = { docs: [{ id: "d1" }, { id: "d2" }, { id: "d3" }], temas: [], anexos: { fisio: [{ id: "a1" }] } };
  const deles = { docs: [{ id: "d2" }], temas: [], anexos: {} };
  const r = SINC.juntarBiblioteca(meu, deles, base);
  assert.deepStrictEqual(r.docs.map(d => d.id), ["d2", "d3"]);
  assert.deepStrictEqual(r.anexos, {});
});

test("3 vias: juntar de novo o que já foi juntado não muda nada", () => {
  const base = { duvidas: [{ id: "d1" }], principal: "concurso", _t: 1 };
  const deles = { duvidas: [], principal: "fisio", _t: 3 };
  const r1 = SINC.juntarEstado({ duvidas: [{ id: "d1" }, { id: "d2" }], principal: "concurso", _t: 2 }, deles, base);
  assert.ok(SINC.igual(SINC.juntarEstado(r1, deles, base), r1));
  assert.ok(SINC.igual(SINC.juntarEstado(r1, deles, deles), r1));
});
