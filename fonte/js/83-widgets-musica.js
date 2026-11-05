function wPiano(box, a) {
  const modo = a.pianoModo || "escala"; const BASE = 60; const N = 24;
  const pretas = [1, 3, 6, 8, 10];
  let raiz = 0, tipo = "maior", marcadas = [];
  const ESC = { maior: [0, 2, 4, 5, 7, 9, 11] }; const TRI = { maior: [0, 4, 7], menor: [0, 3, 7], diminuta: [0, 3, 6], aumentada: [0, 4, 8] };
  const PROG = { "I–V–vi–IV": [[0, "maior"], [7, "maior"], [9, "menor"], [5, "maior"]], "ii–V–I": [[2, "menor"], [7, "maior"], [0, "maior"]], "I–vi–IV–V": [[0, "maior"], [9, "menor"], [5, "maior"], [7, "maior"]] };
  const nomeAc = (r, t) => NOMES[r % 12] + (t === "menor" ? "m" : t === "diminuta" ? "°" : t === "aumentada" ? "+" : "");
  const controles = () => {
    if (modo === "escala") return `<label for="raiz">Tônica</label><select id="raiz">${NOMES_PT.map((n, i) => `<option value="${i}" ${i === raiz ? "selected" : ""}>${n} maior</option>`).join("")}</select><div class="row"><button class="btn pri" id="tocar">Tocar a escala</button><span class="sub" id="info"></span></div>`;
    const tri = `<div class="row">${Object.keys(TRI).map(t => `<button class="btn sm ${t === tipo ? "pri" : ""}" data-t="${t}">${t}</button>`).join("")}</div><label for="raiz">Nota fundamental</label><select id="raiz">${NOMES_PT.map((n, i) => `<option value="${i}" ${i === raiz ? "selected" : ""}>${n}</option>`).join("")}</select><div class="row"><button class="btn pri" id="tocar">Tocar o acorde</button><span class="sub" id="info"></span></div>`;
    const prog = `<div class="row">${Object.keys(PROG).map(p => `<button class="btn sm" data-p="${p}">▶ ${p} em Dó</button>`).join("")}</div><p class="sub" id="pinfo"></p>`;
    if (modo === "triades") return tri; if (modo === "progressoes") return prog; return tri + prog;
  };
  box.innerHTML = `<div class="wid"><h3>${modo === "escala" ? "Monte a escala maior de qualquer nota" : modo === "progressoes" ? "Toque as progressões" : "Ouça e veja os acordes"}</h3><p class="sub">Você também pode clicar nas teclas para tocar.</p><div class="grid" style="gap:10px">${controles()}</div><div class="piano" id="pn"></div></div>`;
  const pn = $("#pn", box); let x = 0; const WW = 40;
  for (let i = 0; i < N; i++) { const pc = i % 12; const k = document.createElement("div"); k.className = "k " + (pretas.includes(pc) ? "b" : "w"); k.dataset.m = BASE + i; if (pretas.includes(pc)) { k.style.left = (x - 12) + "px"; k.style.width = "24px"; } else { k.style.left = x + "px"; k.style.width = WW + "px"; x += WW; } k.textContent = pretas.includes(pc) ? "" : NOMES[pc]; k.onclick = () => { nota(midiF(BASE + i)); piscar([BASE + i]); }; pn.appendChild(k); }
  pn.style.minWidth = x + "px";
  const marcar = ms => { pn.querySelectorAll(".k").forEach(k => k.classList.toggle("hi", ms.includes(+k.dataset.m))); };
  const piscar = (ms, dur = 500) => { ms.forEach(m => { const k = pn.querySelector(`[data-m="${m}"]`); if (k) { k.classList.add("on"); setTimeout(() => k.classList.remove("on"), dur); } }); };
  const atualizar = () => {
    if (modo === "escala") { marcadas = ESC.maior.map(i => BASE + raiz + i).concat([BASE + raiz + 12]); marcar(marcadas); $("#info", box).textContent = ESC.maior.map(i => NOMES_PT[(raiz + i) % 12]).join(" · ") + "   (T T S T T T S)"; }
    else if ($("#info", box)) { marcadas = TRI[tipo].map(i => BASE + raiz + i); marcar(marcadas); $("#info", box).textContent = `${nomeAc(raiz, tipo)}: ` + TRI[tipo].map(i => NOMES_PT[(raiz + i) % 12]).join(" – "); }
  };
  const sel = $("#raiz", box); if (sel) sel.onchange = e => { raiz = +e.target.value; atualizar(); };
  box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { tipo = b.dataset.t; box.querySelectorAll("[data-t]").forEach(x => x.classList.toggle("pri", x === b)); atualizar(); });
  const toc = $("#tocar", box); if (toc) toc.onclick = () => { if (modo === "escala") marcadas.forEach((m, i) => { nota(midiF(m), i * .32, .5); setTimeout(() => piscar([m], 300), i * 320); }); else { marcadas.forEach(m => nota(midiF(m), 0, 1.4, "triangle", .12)); piscar(marcadas, 900); } };
  box.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { const seq = PROG[b.dataset.p]; seq.forEach(([r, t], i) => { const ms = TRI[t].map(k => BASE + r + k); ms.forEach(m => nota(midiF(m), i * .9, 1, "triangle", .1)); nota(midiF(BASE - 12 + r), i * .9, 1, "sine", .2); setTimeout(() => { marcar(ms); piscar(ms, 800); $("#pinfo", box).textContent = seq.map(([r2, t2], j) => (j === i ? "▶ " : "") + nomeAc(r2, t2)).join("   "); }, i * 900); }); });
  atualizar();
}
function wSeq(box) {
  const LIN = [["Kick", "#f2a35b"], ["Snare", "#35c9bd"], ["Hi-hat", "#a98bf0"]];
  const PRE = { "Four on the floor": [[0, 4, 8, 12], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14]], "Hip-hop": [[0, 7, 10], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14]], "Limpar": [[], [], []] };
  let grade = PRE["Four on the floor"].map(l => Array.from({ length: 16 }, (_, i) => l.includes(i))); let bpm = 100, tocando = false, passo = 0, prox = 0, tim;
  box.innerHTML = `<div class="wid"><h3>Sequenciador de 16 passos</h3><p class="sub">Igual ao Channel Rack do FL: cada coluna é uma semicolcheia; os passos 1, 5, 9 e 13 são os tempos.</p>
    <div class="row"><button class="btn pri" id="play">▶ Tocar</button>${Object.keys(PRE).map(p => `<button class="btn sm" data-pre="${p}">${p}</button>`).join("")}</div>
    <label for="bpm">BPM: <b id="bv">100</b></label><input type="range" id="bpm" min="60" max="160" value="100"><div class="seq" id="sq"></div></div>`;
  const sq = $("#sq", box);
  const draw = () => { sq.innerHTML = LIN.map(([n, c], r) => `<div class="linha" style="--rc:${c}"><b>${n}</b>${grade[r].map((on, i) => `<button class="st ${on ? "on" : ""}" data-r="${r}" data-i="${i}" aria-label="${n} passo ${i + 1}"></button>`).join("")}</div>`).join(""); sq.querySelectorAll(".st").forEach(b => b.onclick = () => { grade[b.dataset.r][b.dataset.i] = !grade[b.dataset.r][b.dataset.i]; b.classList.toggle("on"); }); };
  const som = (r, t) => { const ac = audio(); if (!ac) return; if (r === 0) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .15); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .32); }
    else { const n = ac.createBufferSource(); const b = ac.createBuffer(1, ac.sampleRate * .25, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; n.buffer = b; const f = ac.createBiquadFilter(); f.type = r === 1 ? "bandpass" : "highpass"; f.frequency.value = r === 1 ? 1800 : 7000; const g = ac.createGain(); g.gain.setValueAtTime(r === 1 ? .5 : .18, t); g.gain.exponentialRampToValueAtTime(.001, t + (r === 1 ? .18 : .05)); n.connect(f).connect(g).connect(ac.destination); n.start(t); n.stop(t + .25); } };
  const agenda = () => { const ac = audio(); while (prox < ac.currentTime + .12) { const p = passo; grade.forEach((l, r) => { if (l[p]) som(r, prox); }); const atraso = Math.max(0, (prox - ac.currentTime) * 1000); setTimeout(() => sq.querySelectorAll(".st").forEach(b => b.classList.toggle("cur", +b.dataset.i === p)), atraso); prox += 60 / bpm / 4; passo = (passo + 1) % 16; } };
  $("#play", box).onclick = e => { const ac = audio(); if (!ac) return; tocando = !tocando; e.target.textContent = tocando ? "■ Parar" : "▶ Tocar"; if (tocando) { passo = 0; prox = ac.currentTime + .05; tim = setInterval(agenda, 25); timers.push(tim); } else { clearInterval(tim); sq.querySelectorAll(".cur").forEach(b => b.classList.remove("cur")); } };
  $("#bpm", box).oninput = e => { bpm = +e.target.value; $("#bv", box).textContent = bpm; };
  box.querySelectorAll("[data-pre]").forEach(b => b.onclick = () => { grade = PRE[b.dataset.pre].map(l => Array.from({ length: 16 }, (_, i) => l.includes(i))); draw(); });
  draw();
}
function wAcordes(box) {
  const AC_ = { C: "x32010", G: "320003", D: "xx0232", A: "x02220", E: "022100", Am: "x02210", Em: "022000", Dm: "xx0231" };
  const AF = [82.41, 110, 146.83, 196, 246.94, 329.63]; let atual = "C";
  const svg = s => { const W = 220, H = 250, x0 = 35, dx = 30, y0 = 50, dy = 40; let g = `<svg viewBox="0 0 ${W} ${H}" width="220" height="250" role="img" aria-label="Diagrama do acorde ${atual}">`;
    g += `<rect x="${x0}" y="${y0 - 5}" width="${dx * 5}" height="6" fill="#e9edf7"/>`;
    for (let i = 0; i < 6; i++) g += `<line x1="${x0 + i * dx}" y1="${y0}" x2="${x0 + i * dx}" y2="${y0 + dy * 4}" stroke="#9aa4be" stroke-width="${2.4 - i * .3}"/>`;
    for (let f = 1; f <= 4; f++) g += `<line x1="${x0}" y1="${y0 + f * dy}" x2="${x0 + dx * 5}" y2="${y0 + f * dy}" stroke="#2b3550" stroke-width="2"/>`;
    [...s].forEach((c, i) => { const X = x0 + i * dx; if (c === "x") g += `<text x="${X}" y="${y0 - 14}" text-anchor="middle" fill="#ff7d86" font-size="16" font-weight="800">×</text>`; else if (c === "0") g += `<circle cx="${X}" cy="${y0 - 19}" r="7" fill="none" stroke="#5fd38d" stroke-width="2.5"/>`; else g += `<circle cx="${X}" cy="${y0 + (+c - .5) * dy}" r="11" fill="#7f9cff"/>`; });
    ["6ª", "5ª", "4ª", "3ª", "2ª", "1ª"].forEach((n, i) => g += `<text x="${x0 + i * dx}" y="${y0 + dy * 4 + 22}" text-anchor="middle" fill="#9aa4be" font-size="11">${n}</text>`);
    return g + "</svg>"; };
  const tocar = s => [...s].forEach((c, i) => { if (c !== "x") nota(AF[i] * Math.pow(2, (+c) / 12), i * .045, 1.6, "triangle", .11); });
  const draw = () => { box.innerHTML = `<div class="wid"><h3>Os 8 acordes abertos</h3><p class="sub">Clique para ver e ouvir. Depois feche os olhos e tente montar no violão de memória.</p><div class="cordas">${Object.keys(AC_).map(k => `<button class="${k === atual ? "on" : ""}" data-a="${k}">${k}</button>`).join("")}</div><div class="row" style="align-items:flex-start;gap:24px">${svg(AC_[atual])}<div class="bloco" style="flex:1;min-width:220px"><h3>${atual}</h3><p>Cordas (da 6ª à 1ª): <b>${AC_[atual].toUpperCase().split("").join(" ")}</b></p><p class="sub">× = não tocar · ○ = corda solta · número = casa</p><button class="btn pri" id="dedilhar">▶ Ouvir de novo</button></div></div></div>`;
    box.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { atual = b.dataset.a; draw(); tocar(AC_[atual]); }); $("#dedilhar", box).onclick = () => tocar(AC_[atual]); };
  draw();
}
function wMetronomo(box) {
  let bpm = 60, on = false, tempo = 0, prox = 0, tim, taps = [];
  box.innerHTML = `<div class="wid"><h3>Metrônomo</h3><p class="sub">Troque de acorde no tempo 1 (laranja). Quando acertar 8 de 10 trocas, suba 5 BPM.</p><div class="met" id="mt"><i class="um"></i><i></i><i></i><i></i></div><label for="mbpm">BPM: <b id="mv">60</b></label><input type="range" id="mbpm" min="40" max="160" value="60"><div class="row"><button class="btn pri" id="mplay">▶ Iniciar</button><button class="btn" id="tap">Tap (bata no ritmo)</button><button class="btn sm" id="m5">+5 BPM</button></div></div>`;
  const luzes = box.querySelectorAll("#mt i");
  const agenda = () => { const ac = audio(); while (prox < ac.currentTime + .1) { const b = tempo; nota(b === 0 ? 1500 : 1000, prox - ac.currentTime, .06, "square", b === 0 ? .12 : .07); setTimeout(() => luzes.forEach((l, i) => l.classList.toggle("on", i === b)), Math.max(0, (prox - ac.currentTime) * 1000)); prox += 60 / bpm; tempo = (tempo + 1) % 4; } };
  const set = v => { bpm = Math.max(40, Math.min(160, v)); $("#mbpm", box).value = bpm; $("#mv", box).textContent = bpm; };
  $("#mbpm", box).oninput = e => set(+e.target.value); $("#m5", box).onclick = () => set(bpm + 5);
  $("#mplay", box).onclick = e => { const ac = audio(); if (!ac) return; on = !on; e.target.textContent = on ? "■ Parar" : "▶ Iniciar"; if (on) { tempo = 0; prox = ac.currentTime + .05; tim = setInterval(agenda, 25); timers.push(tim); } else { clearInterval(tim); luzes.forEach(l => l.classList.remove("on")); } };
  $("#tap", box).onclick = () => { const t = performance.now(); taps = taps.filter(x => t - x < 3000); taps.push(t); if (taps.length > 2) { const d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); set(Math.round(60000 / d)); } };
}
