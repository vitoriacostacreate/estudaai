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
