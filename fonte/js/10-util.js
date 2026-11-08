/* ============ utilidades ============ */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const isoLocal = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const hojeStr = () => isoLocal(new Date());
const addDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoLocal(d); };
const semAcento = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const slug = (s, max) => semAcento(s.toLowerCase()).replace(/[^a-z0-9]+/g, "-").slice(0, max);
const sufixo = n => Date.now().toString(36).slice(-n);
const diasAte = (iso) => Math.ceil((new Date(iso + "T00:00:00") - new Date(hojeStr() + "T00:00:00")) / 864e5);
const fmt = iso => iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : "";
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
/* Ícones de traço (estilo Lucide), 24×24, herdam a cor do texto. ico("nome") devolve o <svg>. */
const ICONES = {
  inicio: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  temas: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  revisar: '<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  biblioteca: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="m15.5 4.8 3.8-1 3.4 15.4-3.8 1z"/>',
  progresso: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
  mala: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18M12 12v2"/>',
  prepara: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18M12 12v2"/>',
  lapis: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  foco: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M10 2h4M12 2v3"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  voltar: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  dir: '<path d="m9 6 6 6-6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  refazer: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  calendario: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chama: '<path d="M12 3c.6 3.2 4.5 5.2 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.6 2.2-4.9.4 1.4 1.1 2.3 2.3 2.9-.4-2.6-.6-5 0-7.5z"/>',
  arquivo: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  brilho: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z"/>',
  ler: '<path d="M2 5h7a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H2zM22 5h-7a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H22z"/>',
  nuvem: '<path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.5A4 4 0 0 1 17.5 18z"/>',
  sincronia: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
  enviar: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  baixar: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  paleta: '<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.7-.8 1.7-1.6 0-.9-.7-1.3-.7-2.1 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4c0-4.8-4-8.7-9-8.7z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>',
  estrela: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  festa: '<path d="M4 20 9 7l8 8z"/><path d="M14 4v2M20 10h-2M18.5 5.5 17 7M15 3l.5 1M21 9l-1 .5"/>',
  /* temas */
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  atividade: '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
  cerebro: '<path d="M9.5 4A2.5 2.5 0 0 0 7 6.5v.2A3 3 0 0 0 4.5 10a3 3 0 0 0 .7 2A3.2 3.2 0 0 0 6 17.3 3 3 0 0 0 9.5 20 2.5 2.5 0 0 0 12 17.5v-11A2.5 2.5 0 0 0 9.5 4z"/><path d="M14.5 4A2.5 2.5 0 0 1 17 6.5v.2a3 3 0 0 1 2.5 3.3 3 3 0 0 1-.7 2 3.2 3.2 0 0 1-.8 5.3 3 3 0 0 1-3.5 2.7 2.5 2.5 0 0 1-2.5-2.5"/>',
  sliders: '<path d="M5 21v-7M5 10V3M12 21v-9M12 8V3M19 21v-5M19 12V3M2 14h6M9 8h6M16 16h6"/>',
  musica: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  violao: '<path d="m21 3-7.5 7.5"/><path d="M13.5 10.5a3.2 3.2 0 0 0-4.3-.6L7.6 11.3A4.3 4.3 0 0 0 3.3 15.6 5.1 5.1 0 0 0 8.4 20.7a4.3 4.3 0 0 0 4.3-4.3l1.4-1.6a3.2 3.2 0 0 0-.6-4.3z"/><circle cx="8.8" cy="15.2" r="1.4"/>',
  mao: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  livro: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
};
const ico = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n] || ""}</svg>`;
const ICONE_TEMA = { concurso: "alvo", fisioterapia: "atividade", neurociencia: "cerebro", "fl-studio": "sliders", "teoria-musical": "musica", violao: "violao", libras: "mao" };
/* Bloco colorido com o ícone do tema. tam: "sm" | "" | "lg". */
const iconeTema = (t, tam = "") => `<span class="ico-t ${tam}" style="--c:${t.cor}">${ico(ICONE_TEMA[t.id] || (t.doc ? "arquivo" : "livro"))}</span>`;
/* Tira o emoji do começo ("🎯 Concurso" → "Concurso"): o ícone do tema faz esse papel. */
const limparNome = s => String(s || "").replace(/^[\p{Extended_Pictographic}‍️\s]+/u, "").trim() || String(s || "");

/* Paleta: as 7 primeiras são dos temas prontos; as outras ficam livres para PDFs e temas novos. */
const CORES = ["#7f9cff", "#ee7fa8", "#a98bf0", "#f2a35b", "#35c9bd", "#5fd38d", "#f4d35e", "#ff8a6b", "#5cc8f5", "#b5d96a", "#d68cf0", "#e0b98c"];
/* Sanitiza HTML vindo de aulas, cartões e IA: só tags de texto, sem scripts nem atributos perigosos. */
function limparHTML(html) {
  const ok = new Set(["P", "B", "I", "U", "STRONG", "EM", "UL", "OL", "LI", "TABLE", "TR", "TD", "TH", "THEAD", "TBODY", "BR", "KBD", "SPAN", "DIV", "SMALL", "CODE", "A", "H3", "H4", "SUP", "SUB", "PRE", "HR"]);
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html"); const raiz = doc.body.firstChild;
  raiz.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach(n => n.remove());
  (function limpa(n) { [...n.children].forEach(c => { if (!ok.has(c.tagName)) { c.replaceWith(...c.childNodes); return limpa(n); } [...c.attributes].forEach(at => { if (!["class", "href"].includes(at.name) || (at.name === "href" && !/^https?:/i.test(at.value))) c.removeAttribute(at.name); }); if (c.tagName === "A") c.setAttribute("target", "_blank"); limpa(c); }); })(raiz);
  return raiz.innerHTML;
}
