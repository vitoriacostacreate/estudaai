// Testes do prepara.ai (fonte/js/46-prepara.js + fonte/prepara-mudanca.js).   node --test testes/
const test = require("node:test");
const assert = require("node:assert");
const PREP = require("../fonte/js/46-prepara.js");
const PREPARA = require("../fonte/prepara-mudanca.js");

test("num entende formatos brasileiros", () => {
  assert.strictEqual(PREP.num("1.234,56"), 1234.56);
  assert.strictEqual(PREP.num("R$ 2 mil"), 2000);
  assert.strictEqual(PREP.num("2k"), 2000);
  assert.strictEqual(PREP.num("1.500"), 1500);
  assert.strictEqual(PREP.num("257.25"), 257.25);
  assert.strictEqual(PREP.num(""), 0);
  assert.strictEqual(PREP.num("abc"), 0);
});

test("capital líquido = entradas − saídas, e falta para a meta", () => {
  const r = { din_hoje: "1000", din_mes: "800", din_meses: "3", din_divida: "2000", din_contas: "1500", din_saida: "3000", din_meta: "8000" };
  const c = PREP.capital(r, [{ nome: "Notebook", valor: "2.500", vendido: true }, { nome: "Cama", valor: "600" }]);
  assert.strictEqual(c.bens, 3100);
  assert.strictEqual(c.jaVendido, 2500);
  assert.strictEqual(c.entradas, 1000 + 2400 + 3100);
  assert.strictEqual(c.liquido, 6500 - 6500);
  assert.strictEqual(c.falta, 8000);
  assert.strictEqual(PREP.capital({}, []).falta, null);
});

test("matriz ordena por total ponderado e ignora rotas sem nota", () => {
  const cr = [{ id: "a", peso: 3 }, { id: "b", peso: 1 }];
  const rotas = [{ id: "x", nome: "X" }, { id: "y", nome: "Y" }, { id: "z", nome: "Z" }];
  const rk = PREP.matriz(rotas, cr, { x: { a: 2, b: 5 }, y: { a: 5 } }, {});
  assert.deepStrictEqual(rk.map(r => r.id), ["y", "x"]);
  assert.strictEqual(rk[0].total, 15); assert.strictEqual(rk[1].total, 11); assert.strictEqual(rk[0].max, 20);
  assert.strictEqual(rk[0].completo, false); assert.strictEqual(rk[1].completo, true);
  assert.strictEqual(PREP.matriz(rotas, cr, { x: { a: 2, b: 5 } }, { a: 1 })[0].total, 7);   /* peso escolhido vence o padrão */
});

test("Go/No-Go só libera com todos os críticos", () => {
  const its = PREPARA.gonogo; const r = {};
  its.filter(i => !i.critico).forEach(i => r["go_" + i.id] = true);
  assert.strictEqual(PREP.gonogo(its, r).vai, false);
  its.filter(i => i.critico).forEach(i => r["go_" + i.id] = true);
  assert.strictEqual(PREP.gonogo(its, r).vai, true);
});

test("faixa do Working Holiday é 18 a 30", () => {
  assert.strictEqual(PREP.faixaWH(""), null);
  assert.strictEqual(PREP.faixaWH("30"), true);
  assert.strictEqual(PREP.faixaWH(31), false);
  assert.strictEqual(PREP.faixaWH(17), false);
});

test("progresso conta checks, campos e widgets", () => {
  const im = { faca: [{ id: "a", tipo: "check" }, { id: "b", tipo: "texto" }, { id: "w", tipo: "widget" }] };
  assert.deepStrictEqual(PREP.progresso(im, { a: true, b: "  " }), { feitas: 1, total: 3, p: 1 / 3 });
  assert.strictEqual(PREP.progresso(im, { a: true, b: "ok", w_w: true }).feitas, 3);
});

test("conteúdo: ids únicos, marcos em ordem, rotas válidas e o .md sai inteiro", () => {
  const ids = PREPARA.imersoes.flatMap(i => i.faca.map(t => t.id));
  assert.strictEqual(new Set(ids).size, ids.length, "ids de tarefa repetidos");
  const datas = PREPARA.marcos.map(m => m.data);
  assert.deepStrictEqual(datas, datas.slice().sort());
  assert.strictEqual(datas[datas.length - 1], PREPARA.meta.data);
  assert.ok(PREPARA.rotas.every(r => ["sim", "talvez", "nao"].includes(r.cabe)));
  for (const t of PREPARA.imersoes.flatMap(i => i.faca)) if (t.tipo === "widget") assert.ok(["bens", "matriz", "marcos", "gonogo"].includes(t.widget));
  const md = PREP.markdown(PREPARA, { r: { idade: "27", rota_a: "Mercosul" }, bens: [{ nome: "TV", valor: "900" }], notas: { argentina: { prazo: 5 } }, pesos: {}, concluidas: { diagnostico: true } }, "2026-11-06");
  assert.match(md, /# Meu plano de mudança/);
  assert.match(md, /Rota A \(a que vou perseguir\)\*\* Mercosul/);
  assert.match(md, /\| TV \| R\$ 900 \| não \|/);
  assert.match(md, /1\. Mercosul: Argentina \(Buenos Aires ou Córdoba\): 15\/65/);
  assert.match(md, /AINDA NÃO/);
});

test("conteúdo: toda imersão tem mapa curto, versão mínima e pergunta de recuperação válida", () => {
  for (const im of PREPARA.imersoes) {
    assert.ok(im.mapa.length >= 3 && im.mapa.length <= 7, im.id + ": mapa com 3 a 7 ramos");
    assert.ok(im.minimo && im.minimo.length < 120, im.id + ": mínimo curto");
    const q = im.recupere; assert.ok(q.op.length >= 3 && Number.isInteger(q.c) && q.c >= 0 && q.c < q.op.length, im.id + ": recupere");
    assert.ok(q.por, im.id + ": explicação da resposta");
  }
  const certas = PREPARA.imersoes.map(i => i.recupere.c);
  assert.ok(new Set(certas).size > 1, "a resposta certa não pode estar sempre na mesma posição");
});

test("rota: nome pelo id e comprovação convertida em reais pela cotação", () => {
  assert.strictEqual(PREP.rotaNome(PREPARA.rotas, "paraguai"), "Mercosul: Paraguai (Assunção)");
  assert.strictEqual(PREP.rotaNome(PREPARA.rotas, "texto livre"), "texto livre");
  assert.strictEqual(PREP.rotaNome(PREPARA.rotas, ""), "");
  const fr = PREPARA.rotas.find(r => r.id === "franca");
  assert.deepStrictEqual(PREP.metaRota(fr, { cot_eur: "6,20" }), { valor: 2500, moeda: "EUR", reais: 15500 });
  assert.strictEqual(PREP.metaRota(fr, {}).reais, null);                         /* sem cotação: não inventa */
  assert.strictEqual(PREP.metaRota(PREPARA.rotas.find(r => r.id === "argentina"), { cot_eur: 6 }), null);   /* rota sem comprovação fixa */
  assert.strictEqual(PREP.metaRota(PREPARA.rotas.find(r => r.id === "nz"), { cot_eur: 6 }).reais, null);  /* sem cotação de NZD */
});

test("marcos editáveis: troca data e texto, acrescenta os dela e mantém a ordem", () => {
  const est = { r: {}, marcosEd: { m2: { data: "2026-11-25", t: "Rotas escolhidas" } }, marcosExtra: [{ id: "x1", data: "2026-11-20", t: "Vender o notebook", decisao: false }] };
  const l = PREP.listaMarcos(PREPARA, est);
  assert.deepStrictEqual(l.map(m => m.data), l.map(m => m.data).slice().sort());
  const m2 = l.find(m => m.id === "m2"); assert.strictEqual(m2.data, "2026-11-25"); assert.strictEqual(m2.t, "Rotas escolhidas"); assert.strictEqual(m2.editado, true); assert.strictEqual(m2.decisao, true);
  assert.ok(l.find(m => m.id === "x1").proprio);
  assert.strictEqual(l.length, PREPARA.marcos.length + 1);
  assert.strictEqual(PREP.listaMarcos(PREPARA, { r: {} }).length, PREPARA.marcos.length);
});

test("lembrete semanal: só depois de começar e a cada 7 dias", () => {
  assert.strictEqual(PREP.revisaoVencida({ r: {}, concluidas: {} }, "2026-11-06"), false);
  assert.strictEqual(PREP.revisaoVencida({ r: { idade: "27" }, concluidas: {} }, "2026-11-06"), true);
  assert.strictEqual(PREP.revisaoVencida({ r: { idade: "27" }, concluidas: {}, revisado: "2026-11-01" }, "2026-11-06"), false);
  assert.strictEqual(PREP.revisaoVencida({ r: { idade: "27" }, concluidas: {}, revisado: "2026-10-30" }, "2026-11-06"), true);
});

test("pedido para a IA revisar leva o plano e pede riscos", () => {
  const p = PREP.promptIA(PREPARA, { r: { rota_a: "uruguai" }, bens: [], notas: {}, pesos: {}, concluidas: {} }, "2026-11-06");
  assert.match(p, /riscos/i); assert.match(p, /Mercosul: Uruguai/); assert.match(p, /site oficial/);
  assert.match(p, /08\/02\/2027/); assert.match(p, /Trabalho previsto/); assert.match(p, /Ponte barata/); assert.match(p, /fora do comum/);
});

test("novo objetivo: no avião em 08/02, trabalho previsto é crítico e a estratégia tem 3 passos", () => {
  assert.strictEqual(PREPARA.meta.data, "2027-02-08");
  assert.ok(PREPARA.gonogo.find(g => g.id === "trabalho").critico, "trabalho previsto precisa ser critério crítico");
  assert.strictEqual(PREPARA.estrategia.passos.length, 3);
  assert.deepStrictEqual(PREPARA.imersoes.map(i => i.n), PREPARA.imersoes.map((_, k) => k + 1), "imersões numeradas em sequência");
  assert.ok(PREPARA.rotas.filter(r => r.cabe === "sim").length >= 3, "as rotas da ponte (Mercosul) cabem na data");
});
