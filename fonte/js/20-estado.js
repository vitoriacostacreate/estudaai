/* ============ estado (progresso da aluna) ============
   st fica no localStorage e também no servidor (modo local) ou na conta Claude (modo nuvem). */
const CHAVE = "estudaai.v1";
let st, MODO = "arquivo", INFO = {};
function carregar(doServidor) {
  try { st = doServidor && Object.keys(doServidor).length ? doServidor : (JSON.parse(localStorage.getItem(CHAVE)) || {}); } catch (e) { st = {}; }
  st.top ||= {}; st.cards ||= {}; st.dias ||= {}; st.temasUser ||= []; st.aulasUser ||= {}; st.notas ||= {};
  st.tentativas ||= []; st.duvidas ||= []; st.respostasIA ||= [];   /* revisão com IA e dúvidas (52-revisao-ia) */
  st.foco ||= {}; st.foco.sessoes ||= []; st.foco.cats ||= []; st.foco.atual ||= null;   /* acrescentou.ai (45-foco, 78-tela-foco) */
  st.prepara ||= {}; st.prepara.r ||= {}; st.prepara.bens ||= []; st.prepara.notas ||= {}; st.prepara.pesos ||= {}; st.prepara.concluidas ||= {}; st.prepara.marcosEd ||= {}; st.prepara.marcosExtra ||= [];   /* prepara.ai (46-prepara, 79-tela-prepara) */
  st.principal ||= "concurso"; st.novos ||= { data: "", n: 0 }; st.hoje ||= { data: "", feitos: [] };
  if (st.hoje.data !== hojeStr()) st.hoje = { data: hojeStr(), feitos: [] };
}
let _salvarT;
function salvar() {
  st._t = Date.now();
  try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) { }
  if (MODO === "nuvem") { clearTimeout(_salvarT); _salvarT = setTimeout(enviarEstado, 800); }
  if (MODO === "local") { clearTimeout(_salvarT); _salvarT = setTimeout(() => api("/api/estado", { method: "PUT", ...json(st) }).then(registrarSync).catch(() => toast("Não consegui salvar no servidor. O estudaai ainda está rodando?")), 400); }
}
/* Data da última sincronização bem-sucedida (servidor local ou nuvem), guardada por aparelho. */
const CHAVE_SYNC = "estudaai.sync";
function registrarSync() { try { localStorage.setItem(CHAVE_SYNC, new Date().toISOString()); } catch (e) { } }
function ultimaSync() { try { const v = localStorage.getItem(CHAVE_SYNC); return v ? new Date(v) : null; } catch (e) { return null; } }
function marcarDia(pontos) { const d = hojeStr(); st.dias[d] = (st.dias[d] || 0) + pontos; }
function marcarFeito(...ids) { for (const id of ids) if (!st.hoje.feitos.includes(id)) st.hoje.feitos.push(id); }

/* ---------- servidor local ---------- */
async function api(url, op) { const r = await fetch(url, op); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || ("Erro " + r.status)); return j; }
const json = obj => ({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
