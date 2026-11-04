/* ───────────── FL STUDIO ───────────── */
AULAS.fl01 = {
  titulo: "Conhecer o FL Studio: as 4 janelas",
  ideia: "Tudo no FL passa por 4 janelas. O Channel Rack cria, o Piano Roll escreve notas, a Playlist organiza no tempo e o Mixer deixa bonito.",
  mapa: { raiz: "FL Studio", ramos: [
    ["F6 Channel Rack", ["Instrumentos e samples", "Step sequencer"]],
    ["F7 Piano Roll", ["Melodias", "Acordes", "Notas longas"]],
    ["F5 Playlist", ["Arranjo no tempo", "Patterns e áudio"]],
    ["F9 Mixer", ["Volume", "Efeitos", "Rotas"]],
    ["Browser", ["Samples", "Presets", "Plugins"]] ] },
  recupere: ["Você já abriu o FL? Que janela apareceu primeiro?", "Onde você acha que se escreve uma melodia?"],
  blocos: [
    { t: "O caminho de um som", html: `<div class="fluxo"><span>Browser (escolher o som)</span><span>Channel Rack (criar o pattern)</span><span>Piano Roll (notas)</span><span>Playlist (organizar no tempo)</span><span>Mixer (efeitos e volume)</span><span>Exportar</span></div>` },
    { t: "Atalhos que você vai usar 100 vezes por dia", html: `<table class="tab"><tr><th>Tecla</th><th>Janela</th><th>Para quê</th></tr><tr><td><kbd>F5</kbd></td><td>Playlist</td><td>Montar a música no tempo</td></tr><tr><td><kbd>F6</kbd></td><td>Channel Rack</td><td>Ver instrumentos e fazer batidas em passos</td></tr><tr><td><kbd>F7</kbd></td><td>Piano Roll</td><td>Escrever notas do canal selecionado</td></tr><tr><td><kbd>F9</kbd></td><td>Mixer</td><td>Volume, pan e efeitos</td></tr><tr><td><kbd>Espaço</kbd></td><td>Todas</td><td>Tocar e parar</td></tr></table><p class="dica">Nas versões recentes, o Browser abre e fecha com <kbd>Alt</kbd>+<kbd>F8</kbd>. Se algo não bater com o seu FL, confira em Ajuda → Atalhos.</p>` },
    { t: "Pattern × Song", html: `<p>Um <b>pattern</b> é um bloco (por exemplo, 1 compasso de bateria). No modo <b>Pattern</b>, o FL toca só o pattern selecionado, ótimo para criar. No modo <b>Song</b>, ele toca a <b>Playlist</b> inteira, para ouvir a música montada. Errar esse modo é a confusão número 1 de iniciante ("por que não toca o que eu montei?").</p>` },
    { t: "Missão prática (15 min)", html: `<ol class="pratica"><li>Abra o FL e aperte F6, F7, F5 e F9 em sequência, sem olhar.</li><li>No Channel Rack, clique em 4 passos do Kick (1, 5, 9 e 13).</li><li>Aperte Espaço. Parabéns: é um "four on the floor".</li><li>Salve como <i>aula01.flp</i>.</li></ol>` }
  ],
  widget: "parear", parear: [["F5", "Playlist"], ["F6", "Channel Rack"], ["F7", "Piano Roll"], ["F9", "Mixer"], ["Espaço", "Tocar/parar"]],
  quiz: [
    { q: "Onde você escreve uma melodia nota por nota?", o: ["Mixer", "Piano Roll", "Playlist", "Browser"], a: 1, e: "Piano Roll (F7)." },
    { q: "Seu arranjo não toca, só um pattern se repete. Provável causa:", o: ["Mixer mudo", "Está no modo Pattern, não no Song", "Falta um plugin", "BPM errado"], a: 1, e: "Mude para o modo Song para tocar a Playlist." },
    { q: "Onde se aplicam efeitos como reverb e EQ?", o: ["Mixer", "Browser", "Piano Roll", "Channel Rack"], a: 0, e: "No Mixer, nos slots de efeito de cada canal." }
  ],
  feynman: { pergunta: "Explique o caminho de um som desde o Browser até a música exportada.", chaves: ["browser", "channel", "piano roll", "playlist", "mixer", "exportar"] },
  fontes: ["Manual oficial do FL Studio (Image-Line)", "Canal oficial do FL Studio no YouTube"]
};

AULAS.fl04 = {
  titulo: "Sua primeira batida 4/4",
  ideia: "Um compasso tem 16 passos. O kick marca o chão, a caixa (snare ou clap) responde nos tempos 2 e 4 e o chimbal (hi-hat) dá movimento.",
  mapa: { raiz: "Beat 4/4", ramos: [
    ["Grade", ["1 compasso = 16 passos", "4 tempos × 4 semicolcheias"]],
    ["Kick", ["Passos 1, 5, 9, 13 (four on the floor)", "ou 1 e 9 (mais vazio)"]],
    ["Snare/Clap", ["Tempos 2 e 4", "Passos 5 e 13"]],
    ["Hi-hat", ["Colcheias: 1, 3, 5, 7…", "Movimento"]],
    ["Groove", ["Velocity", "Swing"]] ] },
  recupere: ["Em quais tempos a caixa costuma bater no pop?", "Quantos passos tem um compasso no step sequencer?"],
  blocos: [
    { t: "A grade de 16 passos", html: `<p>Num compasso 4/4 há 4 tempos e cada um se divide em 4: são <b>16 passos</b>. Os passos 1, 5, 9 e 13 são os tempos fortes ("1, 2, 3, 4").</p>` },
    { t: "Receita básica", html: `<ul><li><b>Kick</b>: 1, 5, 9, 13 (house, pop dançante) ou 1 e 9 (hip-hop, mais espaço).</li><li><b>Snare/Clap</b>: 5 e 13 (tempos 2 e 4). É o "pá" que faz a cabeça balançar.</li><li><b>Hi-hat</b>: passos ímpares (colcheias) ou todos (semicolcheias, mais energia).</li></ul><p>Toque o sequenciador abaixo e mude os passos.</p>` },
    { t: "Do robótico ao humano", html: `<p><b>Velocity</b> (força de cada nota): alterne hi-hats fortes e fracos. <b>Swing</b>: atrasa levemente os contratempos, o que dá um "balanço". No FL, o swing fica no Channel Rack.</p>` }
  ],
  widget: "sequenciador",
  quiz: [
    { q: "Num beat 4/4 de 16 passos, a caixa nos tempos 2 e 4 fica nos passos:", o: ["1 e 9", "5 e 13", "3 e 11", "4 e 12"], a: 1, e: "Tempo 2 = passo 5; tempo 4 = passo 13." },
    { q: "\"Four on the floor\" significa:", o: ["Kick nos 4 tempos", "Snare nos 4 tempos", "4 compassos", "4 instrumentos"], a: 0, e: "Kick em 1, 5, 9 e 13." },
    { q: "Para deixar o hi-hat menos robótico, você ajusta:", o: ["Pitch", "Velocity e swing", "Reverb", "Pan"], a: 1, e: "Variar a força e aplicar swing humaniza." }
  ],
  feynman: { pergunta: "Explique como montar uma batida básica para alguém que nunca abriu o FL.", chaves: ["16", "kick", "snare", "hi-hat", "tempos", "swing"] },
  fontes: ["Canal oficial do FL Studio: Channel Rack e Step Sequencer"]
};

AULAS.fl08 = {
  titulo: "Escala e acordes no Piano Roll",
  ideia: "Escolha uma escala e use só as notas dela. Assim nada soa errado, e os acordes saem empilhando notas de 2 em 2.",
  mapa: { raiz: "Piano Roll musical", ramos: [
    ["Escala", ["Dó maior = só teclas brancas", "Destaque de escala no Piano Roll"]],
    ["Acordes", ["Empilhar 1ª, 3ª e 5ª", "Ferramenta Stamp"]],
    ["Progressão", ["I–V–vi–IV", "Um acorde por compasso"]],
    ["Melodia", ["Notas do acorde nos tempos fortes"]] ] },
  recupere: ["Por que algumas notas soam \"erradas\" numa melodia?", "O que é um acorde?"],
  blocos: [
    { t: "Use uma escala como trilho", html: `<p>Comece em <b>Dó maior</b>: só teclas brancas. As versões recentes do FL destacam as notas da escala no Piano Roll (procure as opções de escala no menu do Piano Roll). Assim você desenha notas sem medo.</p>` },
    { t: "Acorde = pular uma nota", html: `<p>Na escala, pegue uma nota, pule uma e pegue a seguinte, duas vezes: <b>Dó–Mi–Sol</b> = Dó maior. <b>Lá–Dó–Mi</b> = Lá menor. A ferramenta <b>Stamp</b> do Piano Roll carimba acordes prontos.</p><p>Toque no piano abaixo para ver e ouvir.</p>` },
    { t: "Missão prática", html: `<ol class="pratica"><li>Escolha um piano no Browser e abra o Piano Roll.</li><li>Faça C – G – Am – F, um acorde por compasso.</li><li>Por cima, escreva uma melodia usando notas do acorde de cada compasso nos tempos 1 e 3.</li><li>Exporte 15 s em MP3.</li></ol>` }
  ],
  widget: "piano", pianoModo: "acordes",
  quiz: [
    { q: "Em Dó maior, quais teclas você usa?", o: ["Só pretas", "Só brancas", "Todas", "Só Dó e Sol"], a: 1, e: "Dó maior não tem sustenidos nem bemóis." },
    { q: "Notas do acorde de Lá menor:", o: ["Lá–Dó♯–Mi", "Lá–Dó–Mi", "Lá–Ré–Fá", "Lá–Si–Dó"], a: 1, e: "Lá, 3ª menor (Dó) e 5ª justa (Mi)." },
    { q: "Ferramenta do Piano Roll que insere acordes prontos:", o: ["Slice", "Stamp", "Glue", "Mute"], a: 1, e: "Stamp." }
  ],
  feynman: { pergunta: "Explique como criar uma progressão de acordes no Piano Roll sem saber tocar piano.", chaves: ["escala", "pular", "acorde", "stamp", "compasso"] },
  fontes: ["Manual do FL Studio: Piano Roll"]
};

/* ───────────── TEORIA MUSICAL ───────────── */
AULAS.tm03 = {
  titulo: "A escala maior",
  ideia: "Toda escala maior segue a mesma receita de distâncias: T T S T T T S. Mude a nota de partida e a receita gera outra escala.",
  mapa: { raiz: "Escala maior", ramos: [
    ["Distâncias", ["Semitom = vizinha", "Tom = 2 semitons"]],
    ["Receita", ["T T S T T T S"]],
    ["Dó maior", ["C D E F G A B C", "Só teclas brancas"]],
    ["Outras", ["Sol maior: F♯", "Ré maior: F♯ e C♯"]] ] },
  recupere: ["O que é um semitom no teclado?", "Por que Dó maior não tem teclas pretas?"],
  blocos: [
    { t: "Semitom e tom", html: `<p><b>Semitom</b> é a menor distância: uma tecla para a vizinha (branca ou preta). <b>Tom</b> são 2 semitons. Entre Mi–Fá e Si–Dó não há tecla preta, então já é semitom.</p>` },
    { t: "A receita", html: `<p class="grande">T – T – S – T – T – T – S</p><p>Saindo de Dó: Dó (T) Ré (T) Mi (S) Fá (T) Sol (T) Lá (T) Si (S) Dó. Saindo de Sol, a receita obriga a trocar Fá por <b>Fá♯</b>. Use o piano abaixo e escolha a tônica.</p>` },
    { t: "Graus", html: `<p>Cada nota da escala é um <b>grau</b> (I a VII). Isso vale para qualquer tom: o I é a casa, o V é a tensão. Na próxima aula, os graus viram acordes.</p>` }
  ],
  widget: "piano", pianoModo: "escala",
  quiz: [
    { q: "Fórmula da escala maior:", o: ["T S T T S T T", "T T S T T T S", "S T T S T T T", "T T T S T T S"], a: 1, e: "T T S T T T S." },
    { q: "Qual nota é alterada na escala de Sol maior?", o: ["Si♭", "Fá♯", "Dó♯", "Mi♭"], a: 1, e: "Sol maior tem um sustenido: Fá♯." },
    { q: "Entre Mi e Fá a distância é:", o: ["Tom", "Semitom", "Tom e meio", "Oitava"], a: 1, e: "Não há tecla preta entre elas." }
  ],
  feynman: { pergunta: "Explique como montar a escala maior de qualquer nota.", chaves: ["tom", "semitom", "receita", "tônica", "sustenido"] },
  fontes: ["musictheory.net (lições Steps and Accidentals e Major Scale)"]
};

AULAS.tm06 = {
  titulo: "Tríades: maior, menor, diminuta, aumentada",
  ideia: "Um acorde básico são 3 notas empilhadas de 3ª em 3ª. O tipo de 3ª (maior ou menor) muda o clima: alegre, triste, tenso.",
  mapa: { raiz: "Tríades", ramos: [
    ["Maior", ["3M + 3m", "Dó–Mi–Sol", "Clima alegre/claro"]],
    ["Menor", ["3m + 3M", "Lá–Dó–Mi", "Clima triste/introspectivo"]],
    ["Diminuta", ["3m + 3m", "Si–Ré–Fá", "Tensa"]],
    ["Aumentada", ["3M + 3M", "Dó–Mi–Sol♯", "Suspensa"]] ] },
  recupere: ["Quantas notas tem uma tríade?", "Qual a diferença de som entre um acorde maior e um menor?"],
  blocos: [
    { t: "3ª maior e 3ª menor", html: `<p><b>3ª maior</b> = 4 semitons (Dó→Mi). <b>3ª menor</b> = 3 semitons (Dó→Mi♭). Empilhando duas 3ªs, você forma uma tríade.</p>` },
    { t: "Os 4 tipos", html: `<table class="tab"><tr><th>Tipo</th><th>Empilhamento</th><th>Ex. em Dó</th></tr><tr><td>Maior</td><td>3M + 3m</td><td>C–E–G</td></tr><tr><td>Menor</td><td>3m + 3M</td><td>C–E♭–G</td></tr><tr><td>Diminuta</td><td>3m + 3m</td><td>C–E♭–G♭</td></tr><tr><td>Aumentada</td><td>3M + 3M</td><td>C–E–G♯</td></tr></table><p>Toque cada uma no piano e compare. Treine o ouvido: maior "abre", menor "fecha".</p>` }
  ],
  widget: "piano", pianoModo: "triades",
  quiz: [
    { q: "Tríade maior é formada por:", o: ["3m + 3M", "3M + 3m", "3m + 3m", "3M + 3M"], a: 1, e: "3ª maior embaixo, 3ª menor em cima." },
    { q: "Dó–Mi♭–Sol é:", o: ["Dó maior", "Dó menor", "Dó diminuto", "Dó aumentado"], a: 1, e: "3ª menor (Mi♭) + 5ª justa." },
    { q: "3ª maior tem quantos semitons?", o: ["2", "3", "4", "5"], a: 2, e: "4 semitons." }
  ],
  feynman: { pergunta: "Explique por que trocar uma única nota transforma um acorde alegre em triste.", chaves: ["terça", "maior", "menor", "semitom", "clima"] },
  fontes: ["musictheory.net: Triads"]
};

AULAS.tm09 = {
  titulo: "Progressões que estão em todo lugar",
  ideia: "Poucas sequências de acordes sustentam milhares de músicas. Aprenda os graus e toque em qualquer tom.",
  mapa: { raiz: "Progressões", ramos: [
    ["Campo harmônico", ["I ii iii IV V vi vii°"]],
    ["Funções", ["Tônica: I, iii, vi", "Subdominante: IV, ii", "Dominante: V, vii°"]],
    ["Pop", ["I–V–vi–IV"]],
    ["Jazz/MPB", ["ii–V–I"]],
    ["Anos 50", ["I–vi–IV–V"]] ] },
  recupere: ["O que é o \"V\" num tom?", "Por que um acorde parece pedir para voltar ao início?"],
  blocos: [
    { t: "Campo harmônico maior", html: `<p>Faça uma tríade em cada nota da escala: <b>I ii iii IV V vi vii°</b>. Maiúscula = maior, minúscula = menor, ° = diminuta. Em Dó: C Dm Em F G Am B°.</p>` },
    { t: "Funções: casa, passeio e tensão", html: `<ul><li><b>Tônica</b> (I, vi, iii): casa, repouso.</li><li><b>Subdominante</b> (IV, ii): sai de casa.</li><li><b>Dominante</b> (V, vii°): tensão que "pede" a volta ao I.</li></ul>` },
    { t: "Toque as progressões", html: `<p>Use os botões do piano abaixo para tocar <b>I–V–vi–IV</b>, <b>ii–V–I</b> e <b>I–vi–IV–V</b> em Dó. Depois tente reconhecer em músicas que você ouve.</p>` }
  ],
  widget: "piano", pianoModo: "progressoes",
  quiz: [
    { q: "Em Dó maior, o acorde vi é:", o: ["Em", "Am", "F", "Dm"], a: 1, e: "6º grau = Lá menor." },
    { q: "Função do V:", o: ["Tônica", "Subdominante", "Dominante", "Nenhuma"], a: 2, e: "Dominante: tensão que resolve no I." },
    { q: "I–V–vi–IV em Dó é:", o: ["C–G–Am–F", "C–F–G–Am", "C–Am–F–G", "C–Dm–G–C"], a: 0, e: "C, G, Am, F." }
  ],
  feynman: { pergunta: "Explique o que são tônica, subdominante e dominante usando a ideia de casa e passeio.", chaves: ["casa", "tensão", "volta", "dominante", "tônica"] },
  fontes: ["musictheory.net: Diatonic Triads"]
};

/* ───────────── VIOLÃO ───────────── */
AULAS.tec02 = {
  titulo: "Os 8 acordes abertos essenciais",
  ideia: "Com C, G, D, A, E, Am, Em e Dm você toca centenas de músicas. Aprenda pelo desenho e pelo som.",
  mapa: { raiz: "Acordes abertos", ramos: [
    ["Maiores", ["C", "G", "D", "A", "E"]],
    ["Menores", ["Am", "Em", "Dm"]],
    ["Ler o diagrama", ["Linhas verticais = cordas", "X = não tocar", "O = corda solta"]],
    ["Pares fáceis", ["Em ↔ G", "Am ↔ C", "D ↔ A"]] ] },
  recupere: ["Qual acorde você já sabe? Desenhe de memória.", "No diagrama, o que significa um X?"],
  blocos: [
    { t: "Como ler o diagrama", html: `<p>As linhas verticais são as cordas: a da esquerda é a <b>6ª (Mi grave)</b> e a da direita é a <b>1ª (Mi aguda)</b>. As bolinhas mostram onde apertar. <b>X</b> = não tocar essa corda; <b>O</b> = tocar a corda solta. Clique nos acordes abaixo para ver e ouvir.</p>` },
    { t: "Dicas que poupam semanas", html: `<ul><li>Aperte <b>perto do traste</b>, não no meio da casa.</li><li>Dedos <b>em pé</b> (ponta), para não abafar a corda vizinha.</li><li>Teste corda por corda: o som que falha mostra o dedo encostando onde não deve.</li><li>Comece pelos pares que mudam pouco: <b>Em → G</b>, <b>Am → C</b>.</li></ul>` }
  ],
  widget: "acordes",
  quiz: [
    { q: "No diagrama, um X em cima da corda significa:", o: ["Apertar com força", "Não tocar a corda", "Corda solta", "Pestana"], a: 1, e: "X = não tocar." },
    { q: "Qual destes é um acorde menor?", o: ["G", "D", "Em", "A"], a: 2, e: "Em = Mi menor." },
    { q: "Para evitar som abafado, os dedos devem ficar:", o: ["Deitados", "Em pé, com a ponta", "Longe do traste", "Na madeira"], a: 1, e: "Ponta do dedo, perto do traste." }
  ],
  feynman: { pergunta: "Ensine alguém a ler um diagrama de acorde.", chaves: ["corda", "casa", "x", "solta", "traste"] },
  fontes: ["Justin Guitar (justinguitar.com): Beginner Course"]
};

AULAS.tec03 = {
  titulo: "Trocar acordes no tempo",
  ideia: "Tocar um acorde é fácil. A música acontece na TROCA. Treine trocas com metrônomo, começando devagar.",
  mapa: { raiz: "Trocas", ramos: [
    ["Método", ["Troca de 1 minuto", "Conte as trocas limpas"]],
    ["Metrônomo", ["Comece a 60 BPM", "Suba 5 quando acertar 8 de 10"]],
    ["Dedo âncora", ["Dedo que não sai do lugar"]],
    ["Ritmo", ["Mão direita nunca para"]] ] },
  recupere: ["Qual troca de acorde é mais difícil para você?", "Por que treinar com metrônomo?"],
  blocos: [
    { t: "Troca de 1 minuto", html: `<p>Escolha 2 acordes (ex.: Am e C). Cronometre 1 minuto e conte quantas trocas <b>limpas</b> você faz. Anote. Repita todo dia: o número sobe rápido e motiva. Registre no estudaai como "acertos".</p>` },
    { t: "Metrônomo e mão direita", html: `<p>Use o metrônomo abaixo em <b>60 BPM</b>, com uma batida por tempo. A <b>mão direita nunca para</b>: se a esquerda não chegou a tempo, toque assim mesmo. Isso treina o cérebro a antecipar a troca.</p><p class="dica">Dedo âncora: de Am para C, o dedo 1 (casa 1, corda 2) <b>não sai do lugar</b>.</p>` }
  ],
  widget: "metronomo",
  quiz: [
    { q: "Se a mão esquerda atrasar a troca, a direita deve:", o: ["Parar e esperar", "Continuar no tempo", "Acelerar", "Tocar mais forte"], a: 1, e: "Manter o pulso é o objetivo." },
    { q: "Quando subir o BPM?", o: ["Todo dia", "Quando acertar cerca de 8 de 10 trocas", "Nunca", "Quando cansar"], a: 1, e: "Progressão gradual." }
  ],
  feynman: { pergunta: "Explique o método da troca de 1 minuto.", chaves: ["minuto", "limpas", "metrônomo", "bpm", "âncora"] },
  fontes: ["Justin Guitar: One Minute Changes"]
};

/* ───────────── LIBRAS ───────────── */
AULAS.lb09 = {
  titulo: "Os 5 parâmetros da Libras",
  ideia: "Todo sinal é feito de 5 peças. Mude UMA e o sinal vira outro, como trocar uma letra numa palavra.",
  mapa: { raiz: "Parâmetros", ramos: [
    ["CM", ["Configuração de mão", "O formato da mão"]],
    ["PA", ["Ponto de articulação", "Onde: testa, peito, espaço neutro"]],
    ["M", ["Movimento", "Reto, circular, repetido, sem movimento"]],
    ["O", ["Orientação da palma", "Para cima, baixo, frente"]],
    ["ENM", ["Expressões não manuais", "Rosto e corpo são gramática"]] ] },
  recupere: ["O que você acha que muda entre dois sinais parecidos?", "A expressão do rosto faz parte da língua?"],
  blocos: [
    { t: "A Libras é uma língua completa", html: `<p>Ela tem gramática própria, <b>não é</b> português sinalizado e <b>não é universal</b> (cada país tem a sua). É reconhecida pela <b>Lei 10.436/2002</b> e regulamentada pelo <b>Decreto 5.626/2005</b>.</p>` },
    { t: "As 5 peças de cada sinal", html: `<table class="tab"><tr><th>Parâmetro</th><th>O que é</th></tr><tr><td><b>CM</b>: configuração de mão</td><td>O formato da mão (muitas configurações vêm do alfabeto manual)</td></tr><tr><td><b>PA</b>: ponto de articulação</td><td>Onde o sinal é feito: no corpo ou no espaço à frente</td></tr><tr><td><b>M</b>: movimento</td><td>Como a mão se move</td></tr><tr><td><b>O</b>: orientação</td><td>Para onde a palma aponta</td></tr><tr><td><b>ENM</b>: expressões não manuais</td><td>Rosto, olhos, boca, cabeça e tronco</td></tr></table>` },
    { t: "Pares mínimos", html: `<p>Dois sinais que diferem em <b>um</b> parâmetro só. Um exemplo clássico citado por Quadros &amp; Karnopp: <b>APRENDER</b> e <b>SÁBADO</b> têm a mesma configuração de mão e o mesmo movimento, mas pontos de articulação diferentes (testa × boca). Confira os dois sinais no dicionário do INES.</p><p class="dica">Expressão facial é gramática: a mesma mão com sobrancelhas franzidas pode virar pergunta.</p>` }
  ],
  widget: "parear", parear: [["CM", "Formato da mão"], ["PA", "Lugar onde o sinal é feito"], ["M", "Como a mão se move"], ["O", "Para onde a palma aponta"], ["ENM", "Rosto e corpo"]],
  quiz: [
    { q: "A Libras é universal?", o: ["Sim", "Não: cada país tem sua língua de sinais", "Só na América", "Só nos países de língua portuguesa"], a: 1, e: "Cada país tem a sua (ASL, LSF...)." },
    { q: "Lei que reconhece a Libras:", o: ["8.112/90", "10.436/2002", "13.709/2018", "9.784/99"], a: 1, e: "Lei 10.436/2002." },
    { q: "Sobrancelhas, olhos e boca fazem parte de qual parâmetro?", o: ["CM", "PA", "M", "ENM"], a: 3, e: "Expressões não manuais." }
  ],
  feynman: { pergunta: "Explique a alguém por que a Libras é uma língua e não mímica.", chaves: ["gramática", "parâmetros", "expressão", "lei", "universal"] },
  fontes: ["Dicionário de Libras do INES", "Quadros & Karnopp: Língua de sinais brasileira, estudos linguísticos"]
};

AULAS.lb01 = {
  titulo: "Alfabeto manual e seu nome",
  ideia: "A datilologia é para soletrar nomes e palavras sem sinal. Não é o jeito principal de conversar, mas é o seu primeiro passo.",
  mapa: { raiz: "Datilologia", ramos: [
    ["Para quê", ["Nomes próprios", "Palavras sem sinal", "Soletrar termos novos"]],
    ["Como", ["Mão dominante", "Altura do ombro", "Ritmo constante"]],
    ["Atenção", ["Algumas letras têm movimento (ex.: J e Z)"]],
    ["Sinal-nome", ["Dado pela comunidade surda"]] ] },
  recupere: ["Para que serve a datilologia?", "Quem dá o sinal-nome de uma pessoa?"],
  blocos: [
    { t: "Quando soletrar", html: `<p>Use a datilologia para <b>nomes próprios</b>, palavras que ainda não têm sinal ou para confirmar um termo. Para conversar, use os <b>sinais</b>: soletrar tudo é lento e cansativo.</p>` },
    { t: "Como praticar (sem professor)", html: `<ol class="pratica"><li>Assista ao alfabeto manual em vídeo, feito por uma pessoa surda (INES ou Hand Talk).</li><li>Use o treinador abaixo: digite seu nome e sinalize letra por letra no ritmo.</li><li>Grave-se no celular e compare com o vídeo.</li><li>Conte como "acerto" cada palavra soletrada sem travar.</li></ol>` },
    { t: "Sinal-nome", html: `<p>Na comunidade surda, cada pessoa recebe um <b>sinal-nome</b>, geralmente ligado a uma característica sua. Ele é <b>dado</b> por pessoas surdas, não escolhido por você.</p>` }
  ],
  widget: "soletrar",
  quiz: [
    { q: "A datilologia é usada principalmente para:", o: ["Toda a conversa", "Nomes próprios e palavras sem sinal", "Números", "Expressões faciais"], a: 1, e: "É um recurso, não a base da conversa." },
    { q: "O sinal-nome é:", o: ["Escolhido por você", "Dado pela comunidade surda", "A primeira letra do nome", "Igual em todos os estados"], a: 1, e: "É dado pela comunidade surda." }
  ],
  feynman: { pergunta: "Explique quando usar a datilologia e quando usar sinais.", chaves: ["nome", "sinal", "soletrar", "comunidade"] },
  fontes: ["Dicionário de Libras do INES", "App Hand Talk"]
};
