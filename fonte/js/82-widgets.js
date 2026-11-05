/* ============ WIDGETS ============ */
function montarWidget(box, a, cor) {
  const w = a.widget; box.style.setProperty("--c", cor);
  const W = { tabelaVerdade: wTabela, parear: wParear, ordenar: wOrdenar, costas: wCostas, potencial: wPotencial, esquecimento: wEsquecimento, piano: wPiano, sequenciador: wSeq, acordes: wAcordes, metronomo: wMetronomo, soletrar: wSoletrar };
  if (W[w]) W[w](box, a, cor); else box.innerHTML = `<div class="wid">Prática não disponível.</div>`;
}
function wTabela(box) {
  const OPS = { "∧": (p, q) => p && q, "∨": (p, q) => p || q, "→": (p, q) => !p || q, "↔": (p, q) => p === q, "⊻": (p, q) => p !== q };
  let op = "→"; let resp = {};
  const draw = () => {
    box.innerHTML = `<div class="wid"><h3>Monte a tabela-verdade</h3><p class="sub">Escolha o conectivo e clique nas células para marcar V ou F. Depois confira.</p>
    <div class="row">${Object.keys(OPS).map(o => `<button class="btn sm ${o === op ? "pri" : ""}" data-op="${o}">p ${o} q</button>`).join("")}</div>
    <table class="tab tv" style="max-width:420px"><tr><th>p</th><th>q</th><th>p ${op} q</th></tr>${[[1, 1], [1, 0], [0, 1], [0, 0]].map(([p, q], i) => `<tr><td>${p ? "V" : "F"}</td><td>${q ? "V" : "F"}</td><td><button data-i="${i}" class="${resp[i] || ""}">${resp[i] || "?"}</button></td></tr>`).join("")}</table>
    <div class="row"><button class="btn pri" id="conf">Conferir</button><span id="res" class="sub"></span></div></div>`;
    box.querySelectorAll("[data-op]").forEach(b => b.onclick = () => { op = b.dataset.op; resp = {}; draw(); });
    box.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const i = b.dataset.i; resp[i] = resp[i] === "V" ? "F" : "V"; draw(); });
    $("#conf", box).onclick = () => { let ok = 0; [[1, 1], [1, 0], [0, 1], [0, 0]].forEach(([p, q], i) => { const c = OPS[op](!!p, !!q) ? "V" : "F"; const b = box.querySelector(`[data-i="${i}"]`); b.classList.add(resp[i] === c ? "certo" : "erro"); if (resp[i] === c) ok++; }); $("#res", box).textContent = ok === 4 ? "Perfeito! Troque de conectivo." : `${ok}/4 certas. Lembre da situação especial do conectivo.`; };
  };
  draw();
}
function wParear(box, a) {
  const pares = a.parear; let esq = shuffle(pares.map((p, i) => i)), dir = shuffle(pares.map((p, i) => i)); let sel = null, feitos = new Set(), erros = 0;
  const draw = () => {
    box.innerHTML = `<div class="wid"><h3>Ligue os pares</h3><p class="sub">Clique num item da esquerda e depois no par dele à direita.</p><div class="par"><div class="col">${esq.map(i => `<button data-l="${i}" class="${feitos.has(i) ? "ok" : sel === i ? "sel" : ""}">${esc(pares[i][0])}</button>`).join("")}</div><div class="col">${dir.map(i => `<button data-r="${i}" class="${feitos.has(i) ? "ok" : ""}">${esc(pares[i][1])}</button>`).join("")}</div></div><p class="sub">${feitos.size === pares.length ? `🎉 Completo com ${erros} erro(s). <button class="btn sm" id="denovo">Jogar de novo</button>` : `${feitos.size}/${pares.length} pares · ${erros} erro(s)`}</p></div>`;
    box.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { const i = +b.dataset.l; if (feitos.has(i)) return; sel = i; draw(); });
    box.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { const i = +b.dataset.r; if (sel === null || feitos.has(i)) return; if (i === sel) { feitos.add(i); sel = null; draw(); } else { erros++; b.classList.add("no"); setTimeout(() => b.classList.remove("no"), 350); $(".sub:last-child", box).textContent = `${feitos.size}/${pares.length} pares · ${erros} erro(s)`; } });
    const d = $("#denovo", box); if (d) d.onclick = () => { esq = shuffle(esq); dir = shuffle(dir); feitos = new Set(); erros = 0; sel = null; draw(); };
  };
  draw();
}
function wOrdenar(box, a) {
  const certa = a.ordenar; let pool = shuffle(certa.map((_, i) => i)), resp = [], checado = false;
  const draw = () => {
    box.innerHTML = `<div class="wid"><h3>${esc(a.ordenarTitulo || "Coloque na ordem certa")}</h3><p class="sub">Clique nos itens na ordem em que acontecem.</p><div class="ord">${pool.map(i => `<button data-i="${i}" class="${resp.includes(i) ? "usado" : ""}" ${resp.includes(i) ? "disabled" : ""}>${esc(certa[i])}</button>`).join("")}</div>
    <div class="resposta">${resp.map((i, k) => `<div class="${checado ? (i === k ? "ok" : "no") : ""}">${esc(certa[i])}</div>`).join("")}</div>
    <div class="row"><button class="btn" id="limpar">Recomeçar</button><button class="btn pri" id="conf" ${resp.length < certa.length ? "disabled" : ""}>Conferir</button><span class="sub" id="res"></span></div></div>`;
    box.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { resp.push(+b.dataset.i); checado = false; draw(); });
    $("#limpar", box).onclick = () => { resp = []; checado = false; pool = shuffle(pool); draw(); };
    $("#conf", box).onclick = () => { checado = true; draw(); const ok = resp.filter((i, k) => i === k).length; $("#res", box).textContent = ok === certa.length ? "🎉 Ordem perfeita!" : `${ok}/${certa.length} na posição certa`; };
  };
  draw();
}
function wCostas(box) {
  const CAM = [
    ["Pele e subcutâneo", "#f4c7a8", "Proteção e gordura, com muitos receptores. O toque e o calor já reduzem a percepção de tensão."],
    ["Fáscia toracolombar", "#e9e2c8", "Lâminas de colágeno em losango na lombar. Liga o latíssimo do dorso ao glúteo máximo do lado oposto e recebe a tração do transverso do abdome. É muito inervada."],
    ["Camada superficial", "#ee7fa8", "Trapézio, latíssimo do dorso, romboides e levantador da escápula. Ligam a coluna à escápula e ao braço. Tensionam com o uso de computador e com estresse (trapézio superior)."],
    ["Camada intermediária", "#f2a35b", "Serráteis posteriores superior e inferior. Finos, ligados à respiração."],
    ["Camada profunda", "#a98bf0", "Eretores da espinha (iliocostal, longuíssimo, espinal) estendem a coluna. Os transversoespinais (semiespinal, multífidos, rotadores) estabilizam vértebra a vértebra. Inervados pelos ramos dorsais."],
    ["Vértebras, discos e facetas", "#7f9cff", "O disco tem anel fibroso por fora e núcleo pulposo por dentro. As facetas são as pequenas articulações de trás. Os ligamentos dão a estabilidade passiva."]];
  let s = 2;
  const draw = () => {
    box.innerHTML = `<div class="wid"><h3>Atravesse as camadas das costas</h3><p class="sub">Clique em cada camada, de fora para dentro.</p><div class="grid g2" style="align-items:start"><div class="cam">${CAM.map((c, i) => `<button data-i="${i}" style="--cc:${c[1]}" class="${i === s ? "sel" : ""}">${i + 1}. ${c[0]}</button>`).join("")}</div>
    <div class="bloco" style="border-left:6px solid ${CAM[s][1]}"><h3>${CAM[s][0]}</h3><p>${CAM[s][2]}</p><p class="pratica">${s === 2 ? "Palpe: encolha os ombros e sinta o trapézio superior endurecer." : s === 4 ? "Palpe: mão ao lado da coluna lombar e incline o tronco à frente. São os eretores." : s === 1 ? "Imagine um cinto em losango na lombar costurando os dois lados do corpo." : "Respire fundo pelo abdome 3 vezes e note se os ombros descem."}</p></div></div></div>`;
    box.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { s = +b.dataset.i; draw(); });
  };
  draw();
}
function wPotencial(box) {
  box.innerHTML = `<div class="wid"><h3>Dispare um neurônio</h3><p class="sub">Ajuste a força do estímulo e clique em Estimular. Abaixo do limiar (−55 mV), nada acontece. Acima dele, o disparo é sempre do mesmo tamanho.</p>
    <label for="forca">Força do estímulo: <b id="fv">+20</b> mV</label><input type="range" id="forca" min="2" max="30" value="20">
    <div class="row"><button class="btn pri" id="est">Estimular</button><span id="fase" class="pill ac">Repouso: −70 mV</span></div><canvas id="cv" width="760" height="260"></canvas></div>`;
  const cv = $("#cv", box), ctx = cv.getContext("2d"); const W = cv.width, H = cv.height; const y = mv => H - 20 - (mv + 90) / 140 * (H - 40);
  const curva = f => { const pts = []; const disp = -70 + f >= -55; for (let t = 0; t <= 6; t += .02) { let v; if (t < 1) v = -70; else if (!disp) v = -70 + f * Math.exp(-(t - 1) * 2.2) * Math.min(1, (t - 1) * 8); else { const u = t - 1; if (u < .25) v = -70 + (f) * u / .25; else if (u < .6) v = -70 + f + (35 - (-70 + f)) * ((u - .25) / .35) ** 1.5; else if (u < 1.4) v = 35 - 115 * ((u - .6) / .8); else if (u < 3.2) v = -80 + 10 * ((u - 1.4) / 1.8); else v = -70; } pts.push([t, v]); } return { pts, disp }; };
  const base = () => { ctx.clearRect(0, 0, W, H); ctx.font = "12px Figtree,sans-serif"; [[-70, "repouso −70"], [-55, "limiar −55"], [0, "0 mV"], [35, "+35"]].forEach(([mv, l]) => { ctx.strokeStyle = mv === -55 ? "#f2a35b" : "#2b3550"; ctx.setLineDash(mv === -55 ? [6, 5] : []); ctx.beginPath(); ctx.moveTo(60, y(mv)); ctx.lineTo(W - 10, y(mv)); ctx.stroke(); ctx.fillStyle = "#9aa4be"; ctx.fillText(l, 4, y(mv) + 4); }); ctx.setLineDash([]); };
  const fase = (t, v, disp) => { if (t < 1) return "Repouso: −70 mV"; if (!disp) return "Abaixo do limiar: nada dispara"; const u = t - 1; if (u < .6) return "Despolarização: Na⁺ entra"; if (u < 1.4) return "Repolarização: K⁺ sai"; if (u < 3.2) return "Hiperpolarização (refratário)"; return "Volta ao repouso"; };
  base(); let anim;
  $("#forca", box).oninput = e => $("#fv", box).textContent = "+" + e.target.value;
  $("#est", box).onclick = () => { cancelAnimationFrame(anim); const { pts, disp } = curva(+$("#forca", box).value); let k = 0; const passo = () => { base(); ctx.strokeStyle = "#7f9cff"; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= k && i < pts.length; i++) { const [t, v] = pts[i]; const X = 60 + t / 6 * (W - 70); i ? ctx.lineTo(X, y(v)) : ctx.moveTo(X, y(v)); } ctx.stroke(); ctx.lineWidth = 1; const [t, v] = pts[Math.min(k, pts.length - 1)]; $("#fase", box).textContent = fase(t, v, disp); if (k < pts.length) { k += 3; anim = requestAnimationFrame(passo); } }; passo(); if (disp) nota(880, .05, .12, "square", .05); };
}
function wEsquecimento(box) {
  const revis = new Set([1, 3]); const DIAS = 30;
  box.innerHTML = `<div class="wid"><h3>Vença a curva do esquecimento</h3><p class="sub">Escolha em que dias você revisa. Cada revisão volta a memória a 100% e deixa a queda seguinte mais lenta.</p><div class="row" id="chips">${[1, 2, 3, 5, 7, 10, 14, 21].map(d => `<button class="btn sm" data-d="${d}">dia ${d}</button>`).join("")}</div><canvas id="cv" width="760" height="260"></canvas><p class="sub" id="ret"></p></div>`;
  const cv = $("#cv", box), ctx = cv.getContext("2d"), W = cv.width, H = cv.height; const X = d => 50 + d / DIAS * (W - 70), Y = r => 20 + (1 - r) * (H - 50);
  const draw = () => {
    box.querySelectorAll("[data-d]").forEach(b => b.className = "btn sm" + (revis.has(+b.dataset.d) ? " pri" : ""));
    ctx.clearRect(0, 0, W, H); ctx.font = "12px Figtree,sans-serif"; ctx.fillStyle = "#9aa4be";
    [0, .5, 1].forEach(r => { ctx.strokeStyle = "#2b3550"; ctx.beginPath(); ctx.moveTo(50, Y(r)); ctx.lineTo(W - 20, Y(r)); ctx.stroke(); ctx.fillText(Math.round(r * 100) + "%", 8, Y(r) + 4); });
    [0, 7, 14, 21, 30].forEach(d => ctx.fillText("dia " + d, X(d) - 14, H - 8));
    const semRev = d => Math.exp(-d / 1.6); ctx.strokeStyle = "#ff7d86"; ctx.setLineDash([5, 5]); ctx.beginPath(); for (let d = 0; d <= DIAS; d += .1) d ? ctx.lineTo(X(d), Y(semRev(d))) : ctx.moveTo(X(d), Y(1)); ctx.stroke(); ctx.setLineDash([]);
    let S = 1.6, ult = 0, fim = 0; ctx.strokeStyle = "#5fd38d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(0), Y(1));
    for (let d = 0; d <= DIAS + .001; d += .1) { const dr = Math.round(d * 10) / 10; if (revis.has(dr) && dr > ult) { ctx.lineTo(X(dr), Y(Math.exp(-(dr - ult) / S))); ctx.lineTo(X(dr), Y(1)); ult = dr; S *= 2.6; } const r = Math.exp(-(d - ult) / S); ctx.lineTo(X(d), Y(r)); fim = r; }
    ctx.stroke(); ctx.lineWidth = 1;
    $("#ret", box).innerHTML = `No dia 30: <b style="color:var(--ok)">${Math.round(fim * 100)}%</b> com suas revisões × <b style="color:var(--bad)">${Math.round(semRev(30) * 100)}%</b> sem revisar. <span class="sub">(Modelo ilustrativo baseado em Ebbinghaus; os números reais variam.)</span>`;
  };
  box.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { const d = +b.dataset.d; revis.has(d) ? revis.delete(d) : revis.add(d); draw(); });
  draw();
}
function wSoletrar(box) {
  let tim; box.innerHTML = `<div class="wid"><h3>Treino de datilologia</h3><p class="sub">Digite uma palavra. As letras aparecem no ritmo escolhido: faça cada uma com a mão dominante, sem parar.</p><div class="row"><input type="text" id="pal" value="VITORIA" style="max-width:260px" aria-label="Palavra para soletrar"><button class="btn pri" id="ir">Começar</button></div><label for="vel">Ritmo: <b id="vv">1,2</b> s por letra</label><input type="range" id="vel" min="5" max="25" value="12"><div class="letra" id="lt">A</div><div class="row" id="dots" style="justify-content:center"></div><p class="sub">Assista ao alfabeto feito por uma pessoa surda no <a href="https://www.ines.gov.br/dicionario-de-libras/" target="_blank" rel="noopener">dicionário do INES</a> ou no app Hand Talk e compare.</p></div>`;
  $("#vel", box).oninput = e => $("#vv", box).textContent = (e.target.value / 10).toFixed(1).replace(".", ",");
  $("#ir", box).onclick = () => { clearInterval(tim); const p = semAcento($("#pal", box).value.toUpperCase()).replace(/[^A-ZÇ]/g, ""); if (!p) return; let i = 0; const dots = $("#dots", box); dots.innerHTML = [...p].map(() => '<span class="pill">•</span>').join(""); const show = () => { if (i >= p.length) { clearInterval(tim); $("#lt", box).textContent = "✓"; return; } $("#lt", box).textContent = p[i]; dots.children[i].className = "pill ac"; i++; }; show(); tim = setInterval(show, +$("#vel", box).value * 100); timers.push(tim); };
}
function widgetCalcProva() {
  return `<details class="card wid recolhe" id="calc"><summary><span class="ico-t sm" style="--c:var(--ac)">${ico("progresso")}</span><span><b>Simular minha nota na prova</b><small class="sub">Veja quantos acertos você precisa por área</small></span>${ico("dir", "fim")}</summary><p class="sub">Arraste o número de acertos. Específicos, RLM e Legislação valem 2 pontos por questão. Você precisa de 50 pontos e não pode zerar nenhuma área.</p><div class="grid g2" id="cs"></div><div class="bar" style="--c:var(--ac);height:14px"><i id="cb"></i></div><p id="cr" style="font-size:18px"></p></details>`;
}
function ligarCalcProva() {
  const A = [["Específicos", 20, 2, 14], ["Raciocínio lógico", 10, 2, 6], ["Legislação", 10, 2, 6], ["Português", 15, 1, 9], ["Inglês", 5, 1, 3]];
  $("#cs").innerHTML = A.map(([n, q, p, v], i) => `<div><label for="c${i}">${n}: <b id="cv${i}">${v}</b>/${q} acertos (${p} pt cada)</label><input type="range" id="c${i}" min="0" max="${q}" value="${v}"></div>`).join("");
  const calc = () => { let tot = 0, zero = false; A.forEach(([n, q, p], i) => { const v = +$("#c" + i).value; $("#cv" + i).textContent = v; tot += v * p; if (!v) zero = true; }); $("#cb").style.width = tot + "%"; $("#cb").style.background = !zero && tot >= 50 ? "var(--ok)" : "var(--bad)"; $("#cr").innerHTML = `<b>${tot}</b> de 100 pontos · ${zero ? "❌ eliminada (zerou uma área)" : tot >= 50 ? "✅ aprovada (para entrar nas vagas, mire 65 ou mais)" : "❌ abaixo de 50"}`; };
  A.forEach((_, i) => $("#c" + i).oninput = calc); calc();
}
