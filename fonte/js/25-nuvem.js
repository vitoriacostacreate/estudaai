/* ============ nuvem (artefato do Claude: db, user, assets, sample, downloads) ============
   O progresso vai para data/users/<id>/estado; a biblioteca é tratada pelo armazém (30-biblioteca.js). */
let NUVEM = null, ultimoSync = null;
function dadosDoc(r) { if (r == null) return null; if (typeof r.data === "function") return r.exists === false ? null : r.data(); if ("exists" in r && !r.exists) return null; if (r.data && typeof r.data === "object" && ("exists" in r || "id" in r)) return r.data; return r; }
let _enviando = false, _pendente = false;
async function enviarEstado() {
  if (!NUVEM) return;
  if (_enviando) { _pendente = true; return; }          /* já há um envio: reenvia ao terminar, para não perder a última mudança */
  _enviando = true;
  try { await NUVEM.col.doc("estado").set({ json: JSON.stringify(st), t: st._t || Date.now() }); ultimoSync = new Date(); registrarSync(); marcarSync(); }
  catch (e) { marcarSync("Não consegui salvar na nuvem agora. Fica salvo neste aparelho e tento de novo."); }
  finally { _enviando = false; if (_pendente) { _pendente = false; enviarEstado(); } }
}
function marcarSync(erro) { const c = document.getElementById("sync"); if (!c) return; c.classList.toggle("alerta", !!erro); c.innerHTML = ico("nuvem") + (erro ? "<b>offline</b>" : `<span class="l">salvo</span><b>${ultimoSync ? ultimoSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</b>`); c.title = erro || "Progresso salvo na sua conta: abre igual no PC, no notebook e no celular"; }
/* Puxa o progresso e a biblioteca. forcar === "remoto" descarta o que estiver só neste aparelho. Devolve true se algo mudou. */
async function puxarNuvem(forcar) {
  if (!NUVEM) return false; let mudou = false;
  try {
    const e = dadosDoc(await NUVEM.col.doc("estado").get());
    if (e && e.json && (forcar === "remoto" || (e.t || 0) > (st._t || 0))) { carregar(JSON.parse(e.json)); mudou = true; }
    else if (!e || (st._t || 0) > (e.t || 0)) await enviarEstado();
    if (await carregarBiblioteca()) mudou = true;
    ultimoSync = new Date(); registrarSync(); marcarSync();
  } catch (er) { marcarSync("Sem conexão com a nuvem agora."); }
  return mudou;
}
async function iniciarNuvem() {
  if (!(window.claude && typeof window.claude.use === "function")) return;
  try {
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!db || !user) return;
    const uid = await user.id(); if (!uid) return;
    NUVEM = { db, col: db.collection("data/users/" + uid) }; MODO = "nuvem";
    window.claude.use("assets").then(a => { NUVEM.assets = a; });
    window.claude.use("sample").then(sm => { NUVEM.sample = sm; INFO.ia = !!sm; });
    window.claude.use("downloads").then(d => { NUVEM.downloads = d; });
    rodape(); await puxarNuvem(); rotear();
    document.addEventListener("visibilitychange", async () => { if (document.visibilityState === "visible" && await puxarNuvem()) rotear(); });
  } catch (e) { }
}
