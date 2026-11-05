// Testes do organizador de PDF (fonte/organizar.js).   node --test testes/
// A fixture é o texto, página por página, de exemplos/apostila-exemplo.pdf.
const test = require("node:test");
const assert = require("node:assert");
const ORG = require("../fonte/organizar.js");
const ext = require("./fixtures/apostila-exemplo.json");

const r = ORG.organizar(structuredClone(ext), "apostila", "t1");

test("acha as seções pelos títulos numerados", () => {
  const titulos = r.topicos.map(t => t.t);
  assert.strictEqual(titulos.length, 4);
  assert.ok(titulos[1].startsWith("2. Contração"));
});

test("cada tópico guarda as páginas de origem", () => {
  for (const t of r.topicos) assert.ok(t.pi <= t.pf);
});

test("definições viram cartões, pronomes não", () => {
  const frentes = r.cartoes.map(c => c.f).join(" ");
  assert.ok(frentes.includes("sarcômero"));
  assert.ok(!frentes.includes("<b>Ele</b>"));
});

test("reconhece expressões de duas palavras", () => {
  const termos = Object.values(r.aulas).flatMap(a => a.mapa.ramos.map(x => x[0].toLowerCase()));
  assert.ok(termos.includes("ponte cruzada"));
});

test("quiz válido, com 4 alternativas e explicação sem HTML escapado", () => {
  for (const a of Object.values(r.aulas)) for (const q of a.quiz) {
    assert.ok(q.a >= 0 && q.a < q.o.length);
    assert.strictEqual(q.o.length, 4);
    assert.ok(q.q.includes("_____"));
    assert.ok(!/&(amp|quot|lt|gt);/.test(q.e));
  }
});

test("ids estáveis: o mesmo PDF gera os mesmos cartões", () => {
  const de_novo = ORG.organizar(structuredClone(ext), "apostila", "t1");
  assert.deepStrictEqual(de_novo.cartoes.map(c => c.id), r.cartoes.map(c => c.id));
});

test("texto do PDF é escapado nos cartões", () => {
  const e = { paginas: ["1. Teste\nO <script> é uma tag perigosa que aparece no texto do PDF de exemplo. O <script> não pode virar HTML de verdade. A tag perigosa precisa ser escapada sempre."], sumario: [], titulo: "" };
  const x = ORG.organizar(e, "t", "t2");
  for (const c of x.cartoes) assert.ok(!c.v.includes("<script>"));
});

/* escolherTema: PDF novo entra no tema que já existe; só cria tema se nada combinar. */
const temasT = [
  { id: "fisio", nome: "🦴 Fisioterapia (base do curso)", disciplinas: [{ nome: "Fisiologia", topicos: [{ t: "Contração muscular e fibras" }] }] },
  { id: "violao", nome: "Violão", disciplinas: [{ nome: "Acordes", topicos: [{ t: "Acordes maiores e menores" }] }] },
];
test("PDF com o nome do tema no arquivo vai para esse tema", () => {
  const pdf = { doc: { nome: "tendinite_fisioterapia_para_leigos", titulo: "Tendinite e fisioterapia" }, topicos: [{ t: "O que é tendinite" }], textos: {} };
  assert.strictEqual(ORG.escolherTema(pdf, temasT).id, "fisio");
});
test("PDF pelo conteúdo: apostila de músculo vai para fisioterapia", () => {
  const fisio = { id: "fisioterapia", ...require("../conteudo/temas/fisioterapia.json") };
  assert.strictEqual(ORG.escolherTema(r, [fisio, temasT[1]]).id, "fisioterapia");
});
test("PDF de assunto sem tema não é vinculado (cria tema novo)", () => {
  const pdf = { doc: { nome: "receitas de bolo", titulo: "" }, topicos: [{ t: "Bolo de cenoura" }], textos: { a: "farinha ovos açúcar forno" } };
  assert.strictEqual(ORG.escolherTema(pdf, temasT), null);
});
