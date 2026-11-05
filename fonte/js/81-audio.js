/* ============ áudio ============ */
let AC = null; const timers = [];
function audio() { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); } if (AC.state === "suspended") AC.resume(); return AC; }
function pararAudio() { timers.forEach(clearInterval); timers.length = 0; }
function nota(freq, t0 = 0, dur = .9, tipo = "triangle", vol = .18) {
  const ac = audio(); if (!ac) return; const t = ac.currentTime + t0; const o = ac.createOscillator(), g = ac.createGain();
  o.type = tipo; o.frequency.value = freq; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .05);
}
const midiF = m => 440 * Math.pow(2, (m - 69) / 12);
const NOMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const NOMES_PT = ["Dó", "Dó♯", "Ré", "Ré♯", "Mi", "Fá", "Fá♯", "Sol", "Sol♯", "Lá", "Lá♯", "Si"];
