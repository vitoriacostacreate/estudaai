/* ============ dados ============ */
/* Todos os temas (prontos, dos PDFs e criados por ela), já prontos para exibir:
   nome sem emoji, seções anexadas e cor única. A cor vem de: escolha dela (st.coresTema) → cor salva no tema;
   se essa cor já é de outro tema, pega a primeira livre da paleta, para cada tema ter a sua. */
function todosTemas() {
  const usadas = new Set(); const escolhidas = st.coresTema || {};
  return [...TEMAS, ...(BIB.temas || []), ...st.temasUser].map(t => {
    let cor = escolhidas[t.id] || t.cor;
    if (!escolhidas[t.id] && usadas.has(cor)) cor = CORES.find(c => !usadas.has(c)) || cor;
    usadas.add(cor);
    const disciplinas = (BIB.anexos && BIB.anexos[t.id] ? t.disciplinas.concat(BIB.anexos[t.id]) : t.disciplinas).map(d => ({ ...d, nome: limparNome(d.nome) }));
    return { ...t, nome: limparNome(t.nome), cor, disciplinas };
  });
}
const corLivre = () => { const usadas = new Set(todosTemas().map(t => t.cor)); return CORES.find(c => !usadas.has(c)) || CORES[usadas.size % CORES.length]; };
function tema(id) { return todosTemas().find(t => t.id === id); }
function topicos(t) { return t.disciplinas.flatMap(d => d.topicos.map(x => ({ ...x, disc: d }))); }
function acharTopico(tid) { for (const t of todosTemas()) for (const d of t.disciplinas) for (const x of d.topicos) if (x.id === tid) return { tema: t, disc: d, top: x }; return null; }
function aula(tid) { return st.aulasUser[tid] || AULAS[tid] || (BIB.aulas || {})[tid] || null; }
function situacao(tid) {
  const i = st.top[tid]; if (!i || !i.n) return "novo";
  if (i.prox && i.prox <= hojeStr()) return "revisar";
  if (i.int >= 21 && i.tot && i.ac / i.tot >= .8) return "dominado";
  return "estudado";
}
function registrarAula(tid, ac, tot) {
  const i = st.top[tid] || { n: 0, ac: 0, tot: 0, int: 0 };
  const r = tot ? ac / tot : null; const ant = i.int || 0; let novo;
  if (!ant) novo = (r === null || r < .6) ? 1 : 3; else if (r === null) novo = Math.round(ant * 1.5);
  else if (r >= .8) novo = Math.round(ant * 2.5); else if (r >= .6) novo = Math.round(ant * 1.5); else novo = 1;
  novo = Math.max(1, Math.min(novo, 60));
  Object.assign(i, { n: i.n + 1, ac: i.ac + ac, tot: i.tot + tot, int: novo, prox: addDias(novo), ultima: hojeStr() });
  st.top[tid] = i; marcarDia(3); salvar(); return i;
}
function progressoTema(t) { const ts = topicos(t); const v = ts.filter(x => situacao(x.id) !== "novo").length; return { v, n: ts.length, p: ts.length ? v / ts.length : 0 }; }

/* cartões */
