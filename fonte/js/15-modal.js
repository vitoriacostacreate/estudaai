/* ============ modal ============ */
function abrirModal(html, ligar) { fecharModal(); const m = document.createElement("div"); m.className = "modal"; m.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(m); m.addEventListener("click", e => { if (e.target === m || e.target.hasAttribute("data-fechar")) fecharModal(); }); if (ligar) ligar(m); }
function fecharModal() { document.querySelectorAll(".modal").forEach(m => m.remove()); }
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });
