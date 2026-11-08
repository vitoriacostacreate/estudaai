/* ============ início: descobre o modo (local → nuvem → arquivo) ============ */
(async function iniciar() {
  let doServ = null;
  const naNuvem = window.claude && typeof window.claude.use === "function";
  if (location.protocol !== "file:" && !naNuvem) { try { INFO = await api("/api/info"); doServ = await api("/api/estado"); MODO = "local"; registrarSync(); } catch (e) { } }
  carregar(doServ);
  if (MODO === "local") {
    if (!doServ.top) { try { const loc = JSON.parse(localStorage.getItem(CHAVE)); if (loc && loc.top) carregar(loc); } catch (e) { } salvar(); }
    try { await carregarBiblioteca(); } catch (e) { toast("Não consegui ler a biblioteca: " + e.message); }
  }
  rodape(); rotear();
  if (naNuvem) iniciarNuvem();
  if (MODO === "local") verificarObsidian();   /* outro aparelho tem progresso novo no Obsidian? (22-sincronia) */
})();
