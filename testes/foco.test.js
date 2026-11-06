// Testes do acrescentou.ai (fonte/js/45-foco.js): contagem de somas, pausa por ócio e resumo.   node --test testes/
const test = require("node:test");
const assert = require("node:assert");
const FOCO = require("../fonte/js/45-foco.js");

const MIN = 60e3, T0 = new Date(2026, 10, 5, 14, 0, 0).getTime();

test("só bloco fechado vale soma, e o tempo total guarda todos os segundos", () => {
  const s = FOCO.novo("aula", "x1", "Aula X", T0);
  const r = FOCO.encerrar(s, T0 + 47 * MIN + 12e3);
  assert.strictEqual(r.somas, 2);          /* blocos de 20 min */
  assert.strictEqual(r.seg, 47 * 60 + 12);
  assert.strictEqual(FOCO.placar(r.seg, r.bloco).resto, 7 * 60 + 12);
});

test("timer manual usa blocos de 30 min", () => {
  const s = FOCO.novo("manual", null, "Foco livre", T0);
  assert.strictEqual(FOCO.encerrar(s, T0 + 59 * MIN).somas, 1);
});

test("pausar e retomar não conta o tempo parado", () => {
  const s = FOCO.novo("manual", null, "", T0);
  FOCO.pausar(s, T0 + 10 * MIN);
  FOCO.retomar(s, T0 + 60 * MIN);
  assert.strictEqual(Math.round(FOCO.decorrido(s, T0 + 80 * MIN)), 30 * 60);
});

test("ócio de mais de 5 min pausa no último sinal de atividade", () => {
  const s = FOCO.novo("aula", "x1", "", T0);
  FOCO.atividade(s, T0 + 4 * MIN);
  assert.strictEqual(FOCO.verificarOcio(s, T0 + 8 * MIN), false);
  assert.strictEqual(FOCO.verificarOcio(s, T0 + 10 * MIN), true);
  assert.strictEqual(Math.round(FOCO.decorrido(s, T0 + 30 * MIN)), 4 * 60);
  FOCO.atividade(s, T0 + 30 * MIN);           /* voltou: retoma dali */
  assert.strictEqual(Math.round(FOCO.decorrido(s, T0 + 31 * MIN)), 5 * 60);
});

test("atividade depois de um ócio não detectado também descarta o intervalo", () => {
  const s = FOCO.novo("aula", "x1", "", T0);
  FOCO.atividade(s, T0 + 20 * MIN);           /* 20 min sem nenhum sinal: o intervalo não conta */
  assert.strictEqual(Math.round(FOCO.decorrido(s, T0 + 21 * MIN)), 60);
});

test("resumo soma por dia, tipo e categoria", () => {
  const regs = [
    FOCO.encerrar(FOCO.novo("aula", "a", "", T0), T0 + 25 * MIN),
    FOCO.encerrar(Object.assign(FOCO.novo("manual", null, "", T0), { cat: "violao" }), T0 + 65 * MIN),
  ];
  const r = FOCO.resumo(regs);
  assert.deepStrictEqual(r.total, { seg: 90 * 60, somas: 3, n: 2 });
  assert.strictEqual(r.dia["2026-11-05"].somas, 3);
  assert.strictEqual(r.tipo.aula.somas, 1);
  assert.strictEqual(r.cat.violao.seg, 65 * 60);
});

test("formata duração e relógio", () => {
  assert.strictEqual(FOCO.dur(47 * 60 + 59), "47 min");
  assert.strictEqual(FOCO.dur(67 * 60), "1 h 07 min");
  assert.strictEqual(FOCO.relogio(47 * 60 + 12), "47:12");
  assert.strictEqual(FOCO.relogio(3600 + 5), "1:00:05");
});
