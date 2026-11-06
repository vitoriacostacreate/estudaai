/* ============ prepara.ai: núcleo (sem DOM, testado em testes/prepara.test.js) ============
   Contas do plano de mudança: capital líquido, matriz de rotas, progresso das imersões, Go/No-Go e o .md do plano.
   O conteúdo (textos, rotas, marcos) fica em fonte/prepara-mudanca.js (const PREPARA). */
const PREP = (() => {
  /* "1.234,56" | "1234.56" | "R$ 2 mil" → número. Vazio → 0. */
  function num(v) {
    if (typeof v === "number") return isFinite(v) ? v : 0;
    let s = String(v == null ? "" : v).trim().toLowerCase().replace(/r\$|€|us\$|\s/g, "");
    if (!s) return 0;
    let mult = 1; if (s.endsWith("mil")) { mult = 1000; s = s.slice(0, -3); } else if (s.endsWith("k")) { mult = 1000; s = s.slice(0, -1); }
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    const n = parseFloat(s); return isFinite(n) ? n * mult : 0;
  }
  const brl = n => "R$ " + Math.round(n).toLocaleString("pt-BR");

  /* Dinheiro disponível no dia da partida.
     bens: [{nome, valor, vendido}] (conta tudo, vendido ou não, como estimativa; "jaVendido" separa o que já entrou). */
  function capital(r, bens) {
    const b = (bens || []).reduce((a, x) => a + num(x.valor), 0);
    const jaVendido = (bens || []).filter(x => x.vendido).reduce((a, x) => a + num(x.valor), 0);
    const entradas = num(r.din_hoje) + num(r.din_mes) * num(r.din_meses) + b;
    const saidas = num(r.din_divida) + num(r.din_contas) + num(r.din_saida);
    const liquido = entradas - saidas;
    const meta = num(r.din_meta);
    return { bens: b, jaVendido, entradas, saidas, liquido, meta, falta: meta ? Math.max(0, meta - liquido) : null };
  }

  /* Matriz de decisão: notas[rota][criterio] de 1 a 5, pesos[criterio] de 1 a 3. Rotas sem nota ficam de fora. */
  function matriz(rotas, criterios, notas, pesos) {
    const max = criterios.reduce((a, c) => a + 5 * (pesos[c.id] || c.peso || 1), 0);
    return rotas.map(rt => {
      const n = notas[rt.id] || {}; const preenchido = criterios.filter(c => n[c.id]).length;
      const total = criterios.reduce((a, c) => a + (num(n[c.id]) || 0) * (pesos[c.id] || c.peso || 1), 0);
      return { id: rt.id, nome: rt.nome, total, max, pct: max ? total / max : 0, preenchido, completo: preenchido === criterios.length };
    }).filter(x => x.preenchido).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  }

  /* Uma tarefa conta como feita quando o check está marcado ou o campo tem resposta. */
  const feita = (t, r) => t.tipo === "check" ? !!r[t.id] : t.tipo === "widget" ? !!r["w_" + t.id] : String(r[t.id] == null ? "" : r[t.id]).trim() !== "";
  function progresso(imersao, r) {
    const ts = imersao.faca || []; const f = ts.filter(t => feita(t, r)).length;
    return { feitas: f, total: ts.length, p: ts.length ? f / ts.length : 0 };
  }
  function geral(imersoes, r, concluidas) {
    const ps = imersoes.map(i => progresso(i, r)); const feitas = ps.reduce((a, p) => a + p.feitas, 0), total = ps.reduce((a, p) => a + p.total, 0);
    return { feitas, total, p: total ? feitas / total : 0, concluidas: imersoes.filter(i => concluidas[i.id]).length, imersoes: imersoes.length };
  }

  /* Go/No-Go: só é "vai" se TODOS os critérios críticos estiverem marcados. */
  function gonogo(itens, r) {
    const crit = itens.filter(i => i.critico), faltam = crit.filter(i => !r["go_" + i.id]);
    const extras = itens.filter(i => !i.critico && !r["go_" + i.id]);
    return { vai: faltam.length === 0, faltam, extras, marcados: itens.filter(i => r["go_" + i.id]).length, total: itens.length };
  }

  /* Idade dentro da faixa de 18 a 30 dos programas Working Holiday para brasileiros (Japão, França, Alemanha, Austrália, NZ). */
  function faixaWH(idade) { const n = num(idade); if (!n) return null; return n >= 18 && n <= 30; }

  /* Marcos com status em relação a hoje (iso "AAAA-MM-DD"). */
  function marcos(lista, hojeIso, r) {
    return lista.map(m => ({ ...m, feito: !!r["m_" + m.id], passou: m.data < hojeIso, dias: Math.round((Date.parse(m.data) - Date.parse(hojeIso)) / 864e5) }));
  }
  /* Marcos editáveis: os padrão com as trocas dela (marcosEd[id] = {data, t}) + os que ela criou (marcosExtra), em ordem de data. */
  function listaMarcos(P, est) {
    const ed = est.marcosEd || {};
    const base = P.marcos.map(m => ed[m.id] ? { ...m, ...ed[m.id], editado: true } : { ...m });
    const extra = (est.marcosExtra || []).map(m => ({ decisao: false, ...m, proprio: true }));
    return base.concat(extra).sort((a, b) => a.data < b.data ? -1 : a.data > b.data ? 1 : 0);
  }

  /* Rota A/B guardam o id da rota; texto antigo (livre) continua aparecendo como foi escrito. */
  function rotaNome(rotas, v) { const x = rotas.find(r => r.id === v); return x ? x.nome : String(v == null ? "" : v); }
  /* Comprovação mínima da rota em reais. Sem cotação daquela moeda, reais = null (nunca chuta câmbio). */
  const COTACAO = { EUR: "cot_eur", USD: "cot_usd" };
  function metaRota(rota, r) {
    if (!rota || !rota.comprova) return null;
    const [valor, moeda] = rota.comprova, cot = COTACAO[moeda] ? num(r[COTACAO[moeda]]) : 0;
    return { valor, moeda, reais: cot ? Math.round(valor * cot) : null };
  }

  /* Lembrete semanal na Início: só depois que ela começou, e 7 dias depois da última revisão dos marcos. */
  function revisaoVencida(est, hojeIso) {
    const comecou = Object.values(est.r || {}).some(v => v !== "" && v !== false && v != null) || Object.values(est.concluidas || {}).some(Boolean);
    if (!comecou) return false;
    if (!est.revisado) return true;
    return (Date.parse(hojeIso) - Date.parse(est.revisado)) / 864e5 >= 7;
  }

  /* Pedido para a IA do app revisar o plano (usa a mesma cadeia da revisão: assinatura → APIs → Gemini → chat). */
  function promptIA(P, est, hojeIso) {
    return `Você é uma consultora de mudança internacional, honesta e direta. Revise o plano abaixo de uma brasileira de Campo Grande/MS (área de TI: QA e suporte) que quer sair do Brasil de forma LEGAL até ${P.meta.dataBR}, com pouco dinheiro.

Responda em português do Brasil, em Markdown, com blocos curtos e nesta ordem:
1. **Os 3 maiores riscos** do plano (o que pode dar errado e quando), do mais grave ao menos grave.
2. **Contas que não fecham**: compare o capital líquido com a comprovação da rota A + colchão de 3 meses + passagem de volta.
3. **Datas apertadas**: marcos que dependem de algo que ela não controla (vaga, agendamento, consulado).
4. **O que eu faria nesta semana**: no máximo 3 ações, cada uma com o site oficial onde conferir.

Regras: não invente regra de imigração, valor ou prazo. Se não tiver certeza, diga "não tenho certeza" e mande conferir no site oficial do governo do destino. Os dados foram conferidos em ${P.meta.verificadoBR}; se souber de mudança posterior, avise.

---

${markdown(P, est, hojeIso)}`;
  }

  /* O plano inteiro em Markdown, para guardar, imprimir ou mandar para uma IA revisar. */
  function markdown(P, est, hojeIso) {
    const r = est.r || {}, L = [];
    const v = x => String(x == null ? "" : x).trim();
    L.push(`# Meu plano de mudança (prepara.ai)`, ``, `Gerado em ${hojeIso}. Meta: sair do Brasil até ${P.meta.dataBR}. Informações verificadas em ${P.meta.verificadoBR}; confira sempre na fonte oficial.`, ``);
    L.push(`## A pergunta que estou respondendo`, ``, P.pergunta.texto, ``);
    for (const im of P.imersoes) {
      const linhas = (im.faca || []).filter(t => t.tipo !== "widget").map(t => {
        if (t.tipo === "check") return `- [${r[t.id] ? "x" : " "}] ${t.rotulo}`;
        const resp = v(r[t.id]); const op = t.opcoes && t.opcoes.find(o => o[0] === resp);
        const txt = t.tipo === "rota" ? rotaNome(P.rotas, resp) : op ? op[1] : resp;
        return `- **${t.rotulo}** ${resp ? txt : "_(sem resposta)_"}`;
      });
      if (!linhas.length) continue;
      L.push(`## ${im.n}. ${im.titulo}${est.concluidas && est.concluidas[im.id] ? " ✔" : ""}`, ``, ...linhas, ``);
    }
    const c = capital(r, est.bens);
    L.push(`## Dinheiro`, ``, `- Bens para vender: ${brl(c.bens)} (já vendido: ${brl(c.jaVendido)})`, `- Entradas até a partida: ${brl(c.entradas)}`, `- Saídas (dívidas, contas, custo de saída): ${brl(c.saidas)}`, `- **Capital líquido no embarque: ${brl(c.liquido)}**`);
    if (c.meta) L.push(`- Meta da rota: ${brl(c.meta)} · ${c.falta ? "faltam " + brl(c.falta) : "meta atingida"}`);
    if ((est.bens || []).length) L.push(``, `| Item | Valor | Vendido |`, `|---|---|---|`, ...est.bens.map(b => `| ${v(b.nome) || "-"} | ${brl(num(b.valor))} | ${b.vendido ? "sim" : "não"} |`));
    L.push(``);
    const rk = matriz(P.rotas, P.criterios, est.notas || {}, est.pesos || {});
    if (rk.length) L.push(`## Ranking das rotas (minha matriz)`, ``, ...rk.map((x, i) => `${i + 1}. ${x.nome}: ${x.total}/${x.max} (${Math.round(x.pct * 100)}%)${x.completo ? "" : " · notas incompletas"}`), ``);
    const g = gonogo(P.gonogo, r);
    L.push(`## Go/No-Go`, ``, g.vai ? `**VAI.** Todos os critérios críticos estão cumpridos.` : `**AINDA NÃO.** Faltam: ${g.faltam.map(i => i.t).join("; ")}.`, ``);
    L.push(`## Marcos`, ``, ...marcos(listaMarcos(P, est), hojeIso, r).map(m => `- [${m.feito ? "x" : " "}] ${m.data.slice(8, 10)}/${m.data.slice(5, 7)}: ${m.t}`), ``);
    L.push(`## Fontes oficiais`, ``, ...P.fontes.map(f => `- [${f.nome}](${f.url})`), ``);
    return L.join("\n");
  }

  return { num, brl, capital, matriz, feita, progresso, geral, gonogo, faixaWH, marcos, listaMarcos, rotaNome, metaRota, revisaoVencida, promptIA, markdown };
})();
if (typeof module !== "undefined") module.exports = PREP;
