/* ============ estado (progresso da aluna) ============
   st fica no localStorage e também no servidor (modo local) ou na conta Claude (modo nuvem). */
const CHAVE = "estudaai.v1";
let st, MODO = "arquivo", INFO = {};
function carregar(doServidor) {
  try { st = doServidor && Object.keys(doServidor).length ? doServidor : (JSON.parse(localStorage.getItem(CHAVE)) || {}); } catch (e) { st = {}; }
  st.top ||= {}; st.cards ||= {}; st.dias ||= {}; st.temasUser ||= []; st.aulasUser ||= {}; st.notas ||= {};
  st.tentativas ||= []; st.duvidas ||= []; st.respostasIA ||= [];   /* revisão com IA e dúvidas (52-revisao-ia) */
  st.principal ||= "concurso"; st.novos ||= { data: "", n: 0 }; st.hoje ||= { data: "", feitos: [] };
  if (st.hoje.data !== hojeStr()) st.hoje = { data: hojeStr(), feitos: [] };
}
let _salvarT;
function salvar() {
  st._t = Date.now();
  try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) { }
  if (MODO === "nuvem") { clearTimeout(_salvarT); _salvarT = setTimeout(enviarEstado, 800); }
  if (MODO === "local") { clearTimeout(_salvarT); _salvarT = setTimeout(() => api("/api/estado", { method: "PUT", ...json(st) }).catch(() => toast("Não consegui salvar no servidor. O estudaai ainda está rodando?")), 400); }
}
function marcarDia(pontos) { const d = hojeStr(); st.dias[d] = (st.dias[d] || 0) + pontos; }
function marcarFeito(...ids) { for (const id of ids) if (!st.hoje.feitos.includes(id)) st.hoje.feitos.push(id); }

/* ---------- servidor local ---------- */
async function api(url, op) { const r = await fetch(url, op); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || ("Erro " + r.status)); return j; }
const json = obj => ({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
