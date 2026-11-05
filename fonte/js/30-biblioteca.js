/* ============ biblioteca (PDFs importados) ============
   O PDF é lido e organizado aqui no navegador (pdf.js + organizar.js), igual nos modos local e nuvem.
   Cada PDF vira dois arquivos no armazém: o próprio PDF e um "pacote" JSON {topicos, aulas, cartoes, textos}.
   O índice {docs, temas, anexos} diz onde cada pacote está. */
let BIB = { docs: [], temas: [], anexos: {}, aulas: {}, cartoes: [], textos: {} };
const CARDS_BASE = CARDS.slice();

/* Armazém: mesma interface nos dois modos. Nuvem → assets e db do Claude; local → servidor.py (dados/arquivos/). */
function armazem() {
  if (MODO === "nuvem") return {
    lerIndice: async () => { const b = dadosDoc(await NUVEM.col.doc("biblioteca").get()); return b && b.json ? JSON.parse(b.json) : null; },
    gravarIndice: idx => NUVEM.col.doc("biblioteca").set({ json: JSON.stringify(idx), t: Date.now() }),
    enviar: async blob => { if (!NUVEM.assets) throw new Error("Envio de arquivos indisponível nesta visualização."); const u = await NUVEM.assets.upload(blob); return { id: u.id, url: u.url || "/_blob/" + u.id }; },
    apagar: async id => { if (NUVEM.assets) await NUVEM.assets.delete(id); },
  };
  if (MODO === "local") return {
    lerIndice: () => api("/api/biblioteca"),
    gravarIndice: idx => api("/api/biblioteca", { method: "PUT", ...json(idx) }),
    enviar: blob => api("/api/arquivos", { method: "POST", headers: { "Content-Type": blob.type }, body: blob }),
    apagar: id => api("/api/arquivos/" + encodeURIComponent(id), { method: "DELETE" }),
  };
  return null;
}
const indiceAtual = () => ({ docs: BIB.docs, temas: BIB.temas, anexos: BIB.anexos, vinculo: BIB.vinculo });
function mesclar() { CARDS.length = 0; CARDS.push(...CARDS_BASE, ...BIB.cartoes); }

/* Lê o índice e baixa os pacotes. Só rebaixa se a lista de PDFs mudou. Devolve true se mudou. */
async function carregarBiblioteca() {
  const A = armazem(); if (!A) return false;
  const idx = { docs: [], temas: [], anexos: {}, ...((await A.lerIndice()) || {}) };
  if (BIB._ok && idx.docs.map(d => d.id).join() === BIB.docs.map(d => d.id).join()) return false;
  const nova = { ...idx, aulas: {}, cartoes: [], textos: {}, _ok: true };
  for (const d of idx.docs) {
    try { const pk = await (await fetch(d.pacoteUrl)).json(); Object.assign(nova.aulas, pk.aulas); Object.assign(nova.textos, pk.textos); nova.cartoes.push(...pk.cartoes.map(c => ({ ...c, tema: d.tema, doc: d.id }))); }
    catch (e) { /* pacote inacessível: o PDF continua listado, sem aulas */ }
  }
  BIB = nova;
  if (vincularAntigos()) await A.gravarIndice(indiceAtual());
  mesclar(); return true;
}

/* Uma vez só: temas que o import antigo criou para cada PDF ("pdf-…") viram seções do tema certo, se houver um.
   Os ids dos tópicos não mudam, então o progresso dela continua. */
function vincularAntigos() {
  if (BIB.vinculo >= 2) return false;
  const base = [...TEMAS, ...st.temasUser];
  for (const t of BIB.temas.slice()) {
    const d = BIB.docs.find(x => x.id === t.doc); if (!d) continue;
    const tops = t.disciplinas.flatMap(x => x.topicos);
    const alvo = ORG.escolherTema({ doc: d, topicos: tops, textos: Object.fromEntries(tops.map(x => [x.id, BIB.textos[x.id] || ""])) }, base);
    if (!alvo) continue;
    BIB.temas = BIB.temas.filter(x => x !== t);
    (BIB.anexos[alvo.id] ||= []).push({ id: "d-" + d.id, nome: limparNome(t.nome).slice(0, 50), doc: d.id, topicos: tops });
    d.tema = alvo.id; BIB.cartoes.forEach(c => { if (c.doc === d.id) c.tema = alvo.id; });
  }
  BIB.vinculo = 2; return true;
}

let _pdfjs;
function carregarPDFjs() {
  if (_pdfjs) return _pdfjs;
  const base = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  const sc = src => new Promise((ok, falha) => { const el = document.createElement("script"); el.src = src; el.onload = ok; el.onerror = () => falha(new Error("Não consegui carregar o leitor de PDF (pdf.js). Importar PDF precisa de internet.")); document.head.appendChild(el); });
  _pdfjs = sc(base + "pdf.worker.min.js").then(() => sc(base + "pdf.min.js")).then(() => { const lib = window.pdfjsLib || window["pdfjs-dist/build/pdf"]; lib.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.js"; return lib; });
  _pdfjs.catch(() => { _pdfjs = null; });
  return _pdfjs;
}

/* destino: "auto" (padrão) anexa ao tema que já trata do assunto e só cria tema se nenhum combinar;
   "novo" sempre cria um tema; um id de tema anexa as seções a ele. */
async function importarPDF(f, destino, nomeTema) {
  const A = armazem(); if (!A) throw new Error("Importar PDF precisa do estudaai rodando no PC ou na nuvem.");
  const buf = await f.arrayBuffer(); const lib = await carregarPDFjs();
  const ext = await ORG.lerPDF(lib, buf.slice(0));
  const nome = f.name.replace(/\.pdf$/i, ""); const docId = slug(nome, 18) + "-" + sufixo(4);
  const r = ORG.organizar(ext, nome, docId);
  if (!r.topicos.length) throw new Error("Não encontrei texto. O PDF pode ser escaneado (imagem).");
  const pdf = await A.enviar(new Blob([buf], { type: "application/pdf" }));
  const pk = await A.enviar(new Blob([JSON.stringify({ topicos: r.topicos, aulas: r.aulas, cartoes: r.cartoes, textos: r.textos })], { type: "application/json" }));
  let temaId;
  if (!destino || destino === "auto") { const alvo = ORG.escolherTema(r, todosTemas()); destino = alvo ? alvo.id : "novo"; }
  if (destino === "novo") { temaId = "pdf-" + docId; BIB.temas.push({ id: temaId, nome: (nomeTema || r.doc.titulo).slice(0, 50), cor: corLivre(), desc: `Criado a partir de ${f.name} (${r.doc.paginas} páginas).`, doc: docId, disciplinas: [{ id: "d-" + docId, nome: "Seções do PDF", topicos: r.topicos }] }); }
  else { temaId = destino; (BIB.anexos[destino] ||= []).push({ id: "d-" + docId, nome: (r.doc.titulo || nome).slice(0, 50), doc: docId, topicos: r.topicos }); }
  const doc = { ...r.doc, tema: temaId, arquivo: f.name, importado: new Date().toLocaleString("pt-BR"), pdfAsset: pdf.id, pdfUrl: pdf.url, pacoteAsset: pk.id, pacoteUrl: pk.url };
  BIB.docs.push(doc); Object.assign(BIB.aulas, r.aulas); Object.assign(BIB.textos, r.textos); BIB.cartoes.push(...r.cartoes.map(c => ({ ...c, tema: temaId, doc: docId }))); mesclar();
  await A.gravarIndice(indiceAtual());
  return doc;
}
async function removerPDF(id) {
  const A = armazem(); const d = BIB.docs.find(x => x.id === id); if (!A || !d) return;
  BIB.docs = BIB.docs.filter(x => x.id !== id); BIB.temas = BIB.temas.filter(t => t.doc !== id);
  for (const k of Object.keys(BIB.anexos)) { BIB.anexos[k] = BIB.anexos[k].filter(a => a.doc !== id); if (!BIB.anexos[k].length) delete BIB.anexos[k]; }
  BIB.cartoes = BIB.cartoes.filter(c => c.doc !== id); for (const k of Object.keys(BIB.aulas)) if (k.startsWith("p-" + id + "-")) { delete BIB.aulas[k]; delete BIB.textos[k]; }
  await A.gravarIndice(indiceAtual()); mesclar();
  try { await A.apagar(d.pdfAsset); await A.apagar(d.pacoteAsset); } catch (e) { /* o índice já não aponta para eles */ }
}

function textoTopico(tid) { return BIB.textos[tid] || ""; }
function urlPDF(docId, pag) { const d = BIB.docs.find(x => x.id === docId); return d ? `${d.pdfUrl}#page=${pag}` : "#"; }
function buscarTexto(q) {
  q = q.toLowerCase(); const out = [];
  for (const [tid, txt] of Object.entries(BIB.textos)) { const i = txt.toLowerCase().indexOf(q); if (i < 0) continue; const ini = Math.max(0, i - 90); const info = acharTopico(tid);
    out.push({ topico: tid, titulo: info ? info.top.t : tid, trecho: (ini ? "…" : "") + txt.slice(ini, i + 160).replace(/\n/g, " ") + "…", ocorrencias: txt.toLowerCase().split(q).length - 1 }); }
  return out.sort((a, b) => b.ocorrencias - a.ocorrencias).slice(0, 30);
}
