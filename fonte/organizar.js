/* estudaai: organizador de PDF no navegador (port de nucleo/organizar.py).
   Entrada: {paginas: [texto por página], sumario: [[titulo, paginaIndex0]], titulo}
   Saída:   {doc, topicos, aulas, cartoes, textos}. Sem IA, determinístico. */
const ORG = (() => {
  const STOP = new Set(`a à ao aos as às até após com como contra da das de dela dele deles demais depois do dos e é ela elas ele eles em entre era essa
essas esse esses esta está estão estas este estes eu foi foram há isso isto já la lhe lhes mais mas me mesmo meu minha muito
na nas nem no nos nós num numa o os ou para pela pelas pelo pelos por qual quando que quem se sem ser será seu seus sobre sua
suas são também te tem têm ter um uma umas uns vai você vocês the and for with from that this are was were have has not
cada outro outra outros outras pode podem deve devem sendo sido seja sejam assim ainda apenas bem onde porque pois segundo
qualquer quais todo toda todos todas forma parte caso modo vez vezes dia dias ano anos além então sempre grande nova novo
art artigo inciso parágrafo página capítulo seção figura tabela exemplo exemplos
explica acontece começa depende costuma ajuda realiza formam forma quanto mesma mesmos isso esse dessa desse nessa nesse`.split(/\s+/));
  const PRONOMES = new Set(["ele", "ela", "eles", "elas", "isso", "isto", "este", "esta", "esse", "essa", "que", "o que", "aquilo", "tudo", "nada", "cada um"]);
  const VERBAL = ["ar", "er", "ir", "ava", "avam", "iam", "ou", "aram", "eram", "iram", "ando", "endo", "indo", "am", "em", "ará", "erá", "irá"];
  const verbal = w => VERBAL.some(v => w.endsWith(v));
  const PALAVRA = /[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-]{3,}/g;
  const VERBOS_DEF = "(?:é|são|consiste em|consistem em|refere-se a|referem-se a|significa|significam|corresponde a|define-se como|caracteriza-se por)";
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const B = "(?<![A-Za-zÀ-ÿ])", E = "(?![A-Za-zÀ-ÿ])";             // \b que entende acentos

  function limpar(t) { return t.replace(/­/g, "").replace(/(\w)-\n(\w)/g, "$1$2").replace(/[ \t]+/g, " "); }
  function paragrafos(t) {
    const out = []; let buf = [];
    for (let l of t.split("\n")) {
      l = l.trim();
      if (!l) { if (buf.length) { out.push(buf.join(" ")); buf = []; } continue; }
      buf.push(l);
      if (/[.!?:;]$/.test(l) && l.length < 70) { out.push(buf.join(" ")); buf = []; }
    }
    if (buf.length) out.push(buf.join(" "));
    return out.filter(p => p.trim()).join("\n\n");
  }
  function frases(t) {
    return t.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9"“(])/).map(s => s.trim()).filter(s => s.length >= 25 && s.length <= 320);
  }
  function eTitulo(l) {
    l = l.trim();
    if (l.length < 4 || l.length > 90 || /[.,;]$/.test(l)) return false;
    if (/^(\d+(\.\d+){0,3})[.)]?\s+[A-ZÀ-Ú]/.test(l) && l.split(/\s+/).length <= 12) return true;
    if (/^(CAPÍTULO|CAPITULO|SEÇÃO|SECAO|UNIDADE|MÓDULO|MODULO|AULA|TÍTULO|TITULO|PARTE)\b/i.test(l)) return true;
    const letras = [...l].filter(c => /[A-Za-zÀ-ÿ]/.test(c));
    return letras.length >= 4 && letras.filter(c => c === c.toUpperCase() && c !== c.toLowerCase()).length / letras.length > 0.85 && l.split(/\s+/).length <= 10;
  }
  function secoes(ext, max = 60) {
    const pags = ext.paginas, n = pags.length; let res = [], origem;
    if (ext.sumario && ext.sumario.length >= 2) {
      const m = ext.sumario;
      m.forEach(([t, p], i) => { const fim = Math.max(p, i + 1 < m.length ? m[i + 1][1] - 1 : n - 1); res.push({ titulo: t, pi: p, pf: fim, texto: pags.slice(p, fim + 1).join("\n") }); });
      origem = "sumário do PDF";
    } else {
      let atual = null;
      pags.forEach((txt, pi) => {
        txt.split("\n").forEach((linha, li) => {
          if (eTitulo(linha)) {
            if (atual) { atual.pf = Math.max(atual.pi, li < 3 ? pi - 1 : pi); res.push(atual); }
            atual = { titulo: linha.trim().replace(/:$/, ""), pi, pf: pi, linhas: [] };
          } else if (atual) atual.linhas.push(linha);
          else atual = { titulo: "Introdução", pi, pf: pi, linhas: [linha] };
        });
      });
      if (atual) { atual.pf = Math.max(atual.pi, n - 1); res.push(atual); }
      res.forEach(s => { s.texto = s.linhas.join("\n"); delete s.linhas; });
      origem = "títulos do texto";
      if (res.filter(s => s.texto.split(/\s+/).length > 60).length < 2) {
        res = []; const bl = n <= 30 ? 2 : 3;
        for (let i = 0; i < n; i += bl) res.push({ titulo: `Páginas ${i + 1}–${Math.min(n, i + bl)}`, pi: i, pf: Math.min(n, i + bl) - 1, texto: pags.slice(i, i + bl).join("\n") });
        origem = "blocos de páginas";
      }
    }
    let j = [];
    for (const s of res) {
      if (j.length && s.texto.split(/\s+/).filter(Boolean).length < 60) { const u = j[j.length - 1]; u.texto += "\n" + s.titulo + "\n" + s.texto; u.pf = Math.max(u.pf, s.pf); }
      else j.push(s);
    }
    const f = j.filter(s => s.texto.split(/\s+/).filter(Boolean).length >= 30); j = (f.length ? f : j).slice(0, max);
    return j.map(s => ({ ...s, texto: paragrafos(s.texto), titulo: s.titulo.replace(/\s+/g, " ").slice(0, 90), origem }));
  }
  const tokens = t => (t.match(PALAVRA) || []).map(w => w.toLowerCase());
  function termos(textos, k = 8, fixos = null) {
    const docs = textos.map(t => {
      const c = new Map(); const add = (w, v) => c.set(w, (c.get(w) || 0) + v);
      tokens(t).forEach(w => { if (!STOP.has(w)) add(w, 1); });
      const bi = new Map();
      t.split(/[.,;:!?()\n]/).forEach(tr => {
        const tk = (tr.match(/[A-Za-zÀ-ÿ\-]+/g) || []).map(w => w.toLowerCase());
        for (let i = 0; i + 1 < tk.length; i++) { const a = tk[i], b = tk[i + 1];
          if (a.length > 3 && b.length > 3 && !STOP.has(a) && !STOP.has(b) && !verbal(a) && !verbal(b)) bi.set(a + " " + b, (bi.get(a + " " + b) || 0) + 1); }
      });
      bi.forEach((n, b) => { if (n >= 2) c.set(b, n * 1.8); });
      return c;
    });
    const df = new Map(); docs.forEach(d => d.forEach((_, w) => df.set(w, (df.get(w) || 0) + 1)));
    const N = docs.length;
    return docs.map((d, i) => {
      const fx = fixos ? fixos[i] : new Set(); const sc = [];
      d.forEach((c, w) => {
        if (c < 2 && N > 1 && !fx.has(w)) return;
        let v = c * Math.log(1 + N / df.get(w)) * (w.length > 6 ? 1.3 : 1);
        if (!w.includes(" ") && verbal(w) && !fx.has(w)) v *= .35;
        if (fx.has(w)) v *= 2.5;
        sc.push([w, v]);
      });
      sc.sort((a, b) => b[1] - a[1]);
      let esc = [];
      for (const [w] of sc) {
        if (esc.some(e => e.includes(" ") && e.split(" ").includes(w))) continue;
        if (w.includes(" ")) esc = esc.filter(e => !w.split(" ").includes(e));
        esc.push(w); if (esc.length >= k) break;
      }
      return esc;
    });
  }
  function definicoes(fr) {
    const out = [];
    const re1 = new RegExp(`^(?:(?:Os|As|Uma|Um|O|A)\\s+)?([A-ZÀ-Úa-zà-ú][\\wÀ-ÿ\\s\\-/()]{2,55}?)\\s+${VERBOS_DEF}\\s+(.{15,260})$`);
    for (const f of fr) {
      const m = f.match(re1);
      if (m && m[1].split(/\s+/).length <= 6) {
        const termo = m[1].trim().replace(/[ ,]+$/, ""); const p = termo.toLowerCase().split(/\s+/);
        if (PRONOMES.has(termo.toLowerCase()) || STOP.has(termo.toLowerCase()) || termo.length < 4 || p.length > 5 || p.some(x => ["quando", "que", "se", "onde", "como"].includes(x)) || (p.length > 2 && p.slice(1).some(x => /(ece|ica|ia|ou)$/.test(x)))) continue;
        out.push([termo, f]);
      } else { const m2 = f.match(/^([A-ZÀ-Ú][\wÀ-ÿ\s\-]{2,45}):\s+(.{15,260})$/); if (m2) out.push([m2[1].trim(), m2[2].trim()]); }
    }
    const vistos = new Set(); return out.filter(([t]) => !vistos.has(t.toLowerCase()) && vistos.add(t.toLowerCase())).slice(0, 8);
  }
  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function cloze(fr, ts, n = 6) {
    const cards = [], usados = new Set();
    const num = /(?<![\w])(\d{1,4}(?:[.,]\d+)?)\s*(dias|anos|meses|horas|%|por cento|mV|kg|cm|mm|vezes|semanas)(?![A-Za-zÀ-ÿ])/i;
    for (const f of fr) {
      const m = f.match(num);
      if (m && !usados.has(f)) { cards.push({ f: f.slice(0, m.index) + "<b>_____</b> " + m[2] + f.slice(m.index + m[0].length), v: `<b>${m[1]} ${m[2]}</b><br><small>${escH(f)}</small>` }); usados.add(f); }
      if (cards.length >= Math.floor(n / 2)) break;
    }
    for (const t of ts) {
      for (const f of fr) {
        if (usados.has(f)) continue;
        const m = f.match(new RegExp(B + escRe(t) + E, "i"));
        if (m && m.index > 0) { cards.push({ f: f.slice(0, m.index) + "<b>_____</b>" + f.slice(m.index + m[0].length), v: `<b>${escH(m[0])}</b><br><small>${escH(f)}</small>`, resp: m[0] }); usados.add(f); break; }
      }
      if (cards.length >= n) break;
    }
    return cards;
  }
  function destacar(p, ts) { let h = escH(p); ts.slice(0, 6).forEach(t => { h = h.replace(new RegExp(B + "(" + escRe(t) + ")" + E, "i"), "<b>$1</b>"); }); return h; }
  function rnd(seed) { let x = parseInt(hash(seed), 36) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1e6) / 1e6; }; }
  function aulaAuto(s, ts, fr, defs, clz, todos, docId) {
    const r = rnd(s.titulo), emb = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const pars = s.texto.split("\n\n").filter(p => p.split(/\s+/).length > 8); const blocos = []; let buf = [], n = 0;
    for (const p of pars) { buf.push(p); n += p.split(/\s+/).length; if (n >= 140) { blocos.push(buf); buf = []; n = 0; } }
    if (buf.length) blocos.push(buf);
    const ramos = ts.slice(0, 6).map(t => { const tr = fr.filter(f => new RegExp(B + escRe(t) + E, "i").test(f)).slice(0, 2).map(x => x.length > 70 ? x.slice(0, 70) + "…" : x); return [t[0].toUpperCase() + t.slice(1), tr.length ? tr : ["aparece neste trecho"]]; });
    const quiz = clz.filter(c => c.resp).slice(0, 5).map(c => {
      const certo = c.resp; let d = todos.filter(t => t.toLowerCase() !== certo.toLowerCase() && t.includes(" ") === certo.includes(" "));
      if (d.length < 3) d = todos.filter(t => t.toLowerCase() !== certo.toLowerCase());
      const ops = emb([certo, ...emb(d).slice(0, 3)]);
      return { q: c.f.replace(/<[^>]+>/g, ""), o: ops, a: ops.indexOf(certo), e: c.v.split("<br>").pop().replace(/<[^>]+>/g, "") };
    });
    const a = {
      titulo: s.titulo, auto: true, ideia: fr[0] || s.texto.slice(0, 200), fonte: { doc: docId, pi: s.pi + 1, pf: s.pf + 1 },
      mapa: { raiz: s.titulo.slice(0, 40), ramos: ramos.length ? ramos : [["Trecho", ["Leia o texto original"]]] },
      recupere: [`O que você já sabe sobre "${s.titulo}"?`, ts[0] ? `Como você explicaria "${ts[0]}" com suas palavras?` : "Qual parece ser a ideia principal?", ts[1] ? `Que relação pode existir entre "${ts[0]}" e "${ts[1]}"?` : "Onde isso se aplica na prática?"],
      blocos: blocos.slice(0, 8).map((b, i) => ({ t: `Parte ${i + 1}`, html: b.map(p => `<p>${destacar(p, ts)}</p>`).join("") })),
      quiz, feynman: { pergunta: `Explique "${s.titulo}" em 3 frases simples.`, chaves: ts.slice(0, 6) }, fontes: [`PDF, páginas ${s.pi + 1}–${s.pf + 1}`]
    };
    if (defs.length >= 3) { a.widget = "parear"; a.parear = defs.slice(0, 6).map(([t, d]) => [t, d.length > 110 ? d.slice(0, 110) + "…" : d]); }
    return a;
  }
  function organizar(ext, nome, docId) {
    ext.paginas = ext.paginas.map(limpar);
    const sec = secoes(ext);
    const defsPor = sec.map(s => definicoes(frases(s.texto)));
    const ts = termos(sec.map(s => s.texto), 8, defsPor.map(d => new Set(d.map(([t]) => t.toLowerCase()))));
    const todos = [...new Set(ts.flat())].sort();
    const topicos = [], aulas = {}, cartoes = [], textos = {};
    sec.forEach((s, i) => {
      const tid = `p-${docId}-${i + 1}`, fr = frases(s.texto), defs = defsPor[i], clz = cloze(fr, ts[i]), pal = s.texto.split(/\s+/).filter(Boolean).length;
      topicos.push({ id: tid, t: s.titulo, p: pal > 600 ? 3 : pal > 200 ? 2 : 1, pi: s.pi + 1, pf: s.pf + 1, palavras: pal });
      defs.forEach(([t, d]) => cartoes.push({ id: hash(tid + "|" + t), f: `O que é <b>${escH(t)}</b>?`, v: escH(d), doc: docId, pag: s.pi + 1 }));
      clz.forEach(c => cartoes.push({ id: hash(tid + "|" + c.f), f: c.f, v: c.v, doc: docId, pag: s.pi + 1 }));
      aulas[tid] = aulaAuto(s, ts[i], fr, defs, clz, todos, docId); textos[tid] = s.texto;
    });
    return { doc: { id: docId, nome, titulo: ext.titulo || nome, paginas: ext.paginas.length, origem: sec[0] ? sec[0].origem : "", secoes: sec.length, palavras: sec.reduce((x, s) => x + s.texto.split(/\s+/).length, 0) }, topicos, aulas, cartoes, textos };
  }
  /* pdf.js → {paginas, sumario, titulo} */
  async function lerPDF(pdfjs, buffer) {
    const pdf = await pdfjs.getDocument({ data: buffer, isEvalSupported: false }).promise;
    const paginas = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i); const tc = await pg.getTextContent(); let txt = "", y = null;
      for (const it of tc.items) {
        if (!("str" in it)) continue;
        const yy = it.transform ? Math.round(it.transform[5]) : y;
        if (y !== null && yy !== null && Math.abs(yy - y) > 2 && !txt.endsWith("\n")) txt += "\n";
        txt += it.str; if (it.hasEOL) txt += "\n"; y = yy;
      }
      paginas.push(txt);
    }
    let sumario = [];
    try {
      const out = await pdf.getOutline();
      const andar = async (lista, nivel) => { for (const it of lista || []) {
        try { let dest = it.dest; if (typeof dest === "string") dest = await pdf.getDestination(dest); if (dest && dest[0]) sumario.push([String(it.title).trim(), await pdf.getPageIndex(dest[0])]); } catch (e) { }
        if (nivel < 1 && it.items && it.items.length) await andar(it.items, nivel + 1); } };
      await andar(out, 0);
      const vistos = new Set(); sumario = sumario.sort((a, b) => a[1] - b[1]).filter(([t, p]) => t && !vistos.has(p) && vistos.add(p));
    } catch (e) { sumario = []; }
    let titulo = ""; try { const meta = await pdf.getMetadata(); titulo = ((meta && meta.info && meta.info.Title) || "").trim(); } catch (e) { }
    return { paginas, sumario: sumario.length >= 2 ? sumario : [], titulo };
  }
  return { organizar, lerPDF, _: { secoes, termos, definicoes, frases } };
})();
if (typeof module !== "undefined") module.exports = ORG;
