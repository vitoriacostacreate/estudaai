// Aulas: concurso + fisioterapia + neurociência
const AULAS = {};

/* ───────────── CONCURSO ───────────── */
AULAS.rlm01 = {
  titulo: "Conectivos e tabela-verdade",
  ideia: "Cada conectivo tem UMA situação especial. Decore só ela e você resolve qualquer tabela.",
  mapa: { raiz: "Conectivos", ramos: [
    ["∧ (e)", ["V só se as duas forem V"]],
    ["∨ (ou)", ["F só se as duas forem F"]],
    ["→ (se…então)", ["F só em V → F", "\"Vera Fischer é falsa\""]],
    ["↔ (se e somente se)", ["V quando iguais"]],
    ["⊻ (ou…ou)", ["V quando diferentes"]],
    ["Tabela", ["2ⁿ linhas", "Tautologia, contradição, contingência"]] ] },
  recupere: ["O que torna uma condicional (p → q) falsa?", "Quantas linhas tem a tabela-verdade de 3 proposições?", "Qual a diferença entre ∨ e ⊻?"],
  blocos: [
    { t: "Proposição", html: `<p>É uma frase declarativa que pode ser <b>V ou F</b>, nunca as duas coisas. <i>"Campo Grande fica em MS"</i> é proposição. Já <i>"Que horas são?"</i> e <i>"Estude!"</i> não são.</p><p class="dica">Sentença aberta (<i>"x &gt; 5"</i>) não é proposição até você dar um valor para x.</p>` },
    { t: "As 5 regras de ouro", html: `<table class="tab"><tr><th>Conectivo</th><th>Lê-se</th><th>Situação especial</th></tr>
      <tr><td>p ∧ q</td><td>p e q</td><td><b>V</b> só quando p=V e q=V</td></tr>
      <tr><td>p ∨ q</td><td>p ou q</td><td><b>F</b> só quando p=F e q=F</td></tr>
      <tr><td>p → q</td><td>se p, então q</td><td><b>F</b> só no caso V → F</td></tr>
      <tr><td>p ↔ q</td><td>p se e somente se q</td><td><b>V</b> quando têm o mesmo valor</td></tr>
      <tr><td>p ⊻ q</td><td>ou p ou q</td><td><b>V</b> quando têm valores diferentes</td></tr></table>` },
    { t: "Por que a condicional é estranha", html: `<p>Pense numa promessa: <i>"Se chover, eu levo guarda-chuva"</i>. A única forma de <b>quebrar a promessa</b> é chover (V) e você não levar (F). Se não chover, você não mentiu, leve ou não o guarda-chuva.</p>` },
    { t: "Classificação", html: `<p><b>Tautologia</b>: sempre V (ex.: p ∨ ¬p). <b>Contradição</b>: sempre F (ex.: p ∧ ¬p). <b>Contingência</b>: depende dos valores.</p><p>Número de linhas da tabela: <b>2ⁿ</b>, em que n é o número de proposições simples. Com 3 proposições, são 8 linhas.</p>` }
  ],
  widget: "tabelaVerdade",
  quiz: [
    { q: "Se p é V e q é F, qual é o valor de p → q?", o: ["V", "F", "Depende", "Não dá para saber"], a: 1, e: "V → F é o único caso falso da condicional." },
    { q: "Quantas linhas tem a tabela-verdade de (p ∧ q) → (r ∨ s)?", o: ["4", "8", "16", "32"], a: 2, e: "4 proposições simples: 2⁴ = 16." },
    { q: "\"Ou João estuda, ou João trabalha\" (exclusivo) é verdadeira quando:", o: ["Ele faz as duas coisas", "Ele não faz nenhuma", "Ele faz exatamente uma", "Sempre"], a: 2, e: "A disjunção exclusiva é V quando os valores são diferentes." },
    { q: "p ∨ ¬p é uma:", o: ["Contradição", "Contingência", "Tautologia", "Equivalência"], a: 2, e: "Sempre uma das duas é V, então o resultado é sempre V." },
    { q: "Se p ∧ q é verdadeira, então:", o: ["p é V e q é F", "p e q são V", "Pelo menos uma é V", "p ou q é F"], a: 1, e: "A conjunção só é V com V e V." }
  ],
  feynman: { pergunta: "Explique em 3 frases quando a condicional é falsa e por quê.", chaves: ["promessa", "verdadeiro", "falso", "única", "antecedente", "consequente"] },
  fontes: ["Questões de RLM da FAPEC (QConcursos, filtro banca FAPEC)"]
};

AULAS.leg02 = {
  titulo: "Lei 8.112: provimento, posse e exercício",
  ideia: "Provimento é como alguém ENTRA num cargo. São 7 formas, e só a nomeação é originária.",
  mapa: { raiz: "Provimento (art. 8º)", ramos: [
    ["Originária", ["Nomeação (concurso)"]],
    ["Derivadas", ["Promoção", "Readaptação", "Reversão", "Aproveitamento", "Reintegração", "Recondução"]],
    ["Prazos", ["Posse: 30 dias", "Exercício: 15 dias"]],
    ["Estágio", ["Lei: 24 meses", "CF: estabilidade em 3 anos"]] ] },
  recupere: ["Cite as 7 formas de provimento.", "Qual o prazo para tomar posse? E para entrar em exercício?", "Qual a diferença entre reintegração e recondução?"],
  blocos: [
    { t: "As 7 formas, cada uma numa situação", html: `<table class="tab"><tr><th>Forma</th><th>Quem volta ou entra</th><th>Situação</th></tr>
      <tr><td><b>Nomeação</b></td><td>Aprovado no concurso</td><td>Primeira investidura (é a única forma originária)</td></tr>
      <tr><td><b>Promoção</b></td><td>Servidor</td><td>Sobe na carreira</td></tr>
      <tr><td><b>Readaptação</b></td><td>Servidor com limitação física ou mental</td><td>Vai para um cargo compatível, após inspeção médica</td></tr>
      <tr><td><b>Reversão</b></td><td><b>Aposentado</b></td><td>Volta à ativa</td></tr>
      <tr><td><b>Aproveitamento</b></td><td>Servidor em <b>disponibilidade</b></td><td>Volta a um cargo compatível</td></tr>
      <tr><td><b>Reintegração</b></td><td><b>Estável demitido</b></td><td>A demissão foi anulada. Volta e recebe o que perdeu.</td></tr>
      <tr><td><b>Recondução</b></td><td><b>Estável</b></td><td>Volta ao cargo anterior: foi inabilitado no estágio de outro cargo, ou o antigo ocupante foi reintegrado</td></tr></table>` },
    { t: "Truque de memória", html: `<p><b>RE-</b>palavras = alguém <b>voltando</b>. Para não confundir, associe cada uma ao "de onde veio":</p><ul><li><b>Reversão</b> → da <b>aposentadoria</b></li><li><b>Reintegração</b> → da <b>demissão anulada</b></li><li><b>Recondução</b> → do <b>outro cargo</b> (não deu certo lá)</li><li><b>Aproveitamento</b> → da <b>disponibilidade</b></li></ul>` },
    { t: "Linha do tempo de quem passou", html: `<div class="linha"><span>Nomeação publicada</span><span>até 30 dias → <b>Posse</b> (assina o termo; pode ser por procuração específica)</span><span>até 15 dias → <b>Exercício</b> (começa a trabalhar)</span><span>Estágio probatório → <b>estabilidade</b></span></div><p class="dica">Pegadinha clássica: o texto da Lei 8.112 diz <b>24 meses</b> de estágio, mas a Constituição (EC 19/98) dá estabilidade após <b>3 anos</b>. Leia se a questão pede "segundo a Lei" ou "segundo a CF".</p>` }
  ],
  widget: "parear", parear: [["Reversão", "Aposentado volta à ativa"], ["Reintegração", "Estável volta após a demissão ser anulada"], ["Recondução", "Estável volta ao cargo anterior"], ["Aproveitamento", "Servidor em disponibilidade volta"], ["Readaptação", "Cargo compatível com uma limitação"], ["Nomeação", "Forma originária de provimento"]],
  quiz: [
    { q: "O servidor aposentado por invalidez que recupera a capacidade volta por:", o: ["Readaptação", "Reversão", "Reintegração", "Recondução", "Aproveitamento"], a: 1, e: "Aposentado voltando = reversão." },
    { q: "Prazo para entrar em exercício, contado da posse:", o: ["5 dias", "10 dias", "15 dias", "30 dias", "60 dias"], a: 2, e: "Art. 15, §1º: 15 dias." },
    { q: "Servidor estável inabilitado no estágio probatório de OUTRO cargo:", o: ["É exonerado", "É reconduzido ao cargo anterior", "É readaptado", "É reintegrado", "Fica em disponibilidade"], a: 1, e: "Recondução (art. 29, I)." },
    { q: "Qual é a única forma ORIGINÁRIA de provimento?", o: ["Promoção", "Nomeação", "Reversão", "Readaptação", "Aproveitamento"], a: 1, e: "As demais pressupõem um vínculo anterior." },
    { q: "Prazo para a posse, contado da publicação do ato de provimento:", o: ["15 dias", "20 dias", "30 dias", "45 dias", "60 dias"], a: 2, e: "Art. 13, §1º: 30 dias." }
  ],
  feynman: { pergunta: "Explique a diferença entre reversão, reintegração e recondução como se fosse para um amigo.", chaves: ["aposentado", "demissão", "anulada", "estável", "anterior", "volta"] },
  fontes: ["Lei 8.112/90, arts. 8º a 32: planalto.gov.br/ccivil_03/leis/l8112cons.htm"]
};

AULAS.esp03 = {
  titulo: "Scrum, Kanban e XP",
  ideia: "Scrum organiza o trabalho em ciclos curtos (Sprints). Kanban organiza pelo fluxo. XP cuida da qualidade do código.",
  mapa: { raiz: "Ágil", ramos: [
    ["Scrum: 3 responsabilidades", ["Product Owner", "Scrum Master", "Developers"]],
    ["Scrum: 5 eventos", ["Sprint (até 1 mês)", "Planning", "Daily (15 min)", "Review", "Retrospective"]],
    ["Scrum: 3 artefatos", ["Product Backlog → Meta do Produto", "Sprint Backlog → Meta da Sprint", "Incremento → Definição de Pronto"]],
    ["Kanban", ["Quadro visual", "Limite de WIP", "Fluxo puxado"]],
    ["XP", ["Par", "TDD", "CI", "Refatoração"]] ] },
  recupere: ["Quais são os 3 papéis (responsabilidades) do Scrum?", "Qual evento contém todos os outros?", "O que significa limitar o WIP?"],
  blocos: [
    { t: "Scrum em 1 imagem", html: `<div class="fluxo"><span>Product Backlog</span><span>Sprint Planning</span><span>Sprint Backlog</span><span>Daily (todo dia)</span><span>Incremento</span><span>Review</span><span>Retrospectiva</span></div><p>Tudo acontece dentro da <b>Sprint</b>, que dura no máximo 1 mês. Os 3 pilares são <b>transparência, inspeção e adaptação</b>.</p>` },
    { t: "Quem faz o quê (Guia 2020)", html: `<ul><li><b>Product Owner</b>: maximiza o valor e ordena o Product Backlog. É <b>uma pessoa</b>, não um comitê.</li><li><b>Scrum Master</b>: garante que o Scrum seja entendido e aplicado. É um líder que serve, não um gerente.</li><li><b>Developers</b>: criam o incremento. O guia de 2020 trocou "Time de Desenvolvimento" por Developers e fala em um único <b>Scrum Team</b>.</li></ul><p class="dica">Pegadinha: o guia não usa mais "papéis", e sim <b>responsabilidades</b> (accountabilities).</p>` },
    { t: "Tempos máximos (para Sprint de 1 mês)", html: `<table class="tab"><tr><th>Evento</th><th>Máximo</th></tr><tr><td>Sprint Planning</td><td>8 h</td></tr><tr><td>Daily Scrum</td><td>15 min</td></tr><tr><td>Sprint Review</td><td>4 h</td></tr><tr><td>Retrospectiva</td><td>3 h</td></tr></table>` },
    { t: "Kanban e XP", html: `<p><b>Kanban</b>: visualize o fluxo (A fazer → Fazendo → Feito), <b>limite o WIP</b> (trabalho em andamento) e puxe uma nova tarefa só quando houver espaço. Não tem Sprint obrigatória.</p><p><b>XP</b>: valores de comunicação, simplicidade, feedback, coragem e respeito. Práticas: programação em par, TDD, integração contínua, refatoração, pequenos releases.</p>` }
  ],
  widget: "ordenar", ordenar: ["Sprint Planning", "Daily Scrum", "Sprint Review", "Sprint Retrospective"], ordenarTitulo: "Coloque os eventos na ordem em que acontecem na Sprint",
  quiz: [
    { q: "Quem é responsável por ordenar o Product Backlog?", o: ["Scrum Master", "Developers", "Product Owner", "Stakeholders", "Gerente"], a: 2, e: "O PO maximiza valor e ordena o backlog." },
    { q: "O compromisso do Incremento é:", o: ["Meta do Produto", "Meta da Sprint", "Definição de Pronto", "Velocidade", "Burndown"], a: 2, e: "Incremento → Definição de Pronto (Definition of Done)." },
    { q: "A Daily Scrum tem duração máxima de:", o: ["5 min", "15 min", "30 min", "1 h", "Não tem limite"], a: 1, e: "15 minutos, todo dia da Sprint." },
    { q: "Prática central do Kanban:", o: ["Sprints de 2 semanas", "Limitar o trabalho em andamento (WIP)", "Programação em par", "Story points", "Scrum Master"], a: 1, e: "Kanban = fluxo visual + limite de WIP." },
    { q: "No XP, escrever o teste antes do código é:", o: ["BDD", "TDD", "CI", "Pair programming", "Refactoring"], a: 1, e: "Test-Driven Development: red → green → refactor." }
  ],
  feynman: { pergunta: "Explique como funciona uma Sprint do começo ao fim.", chaves: ["planning", "daily", "review", "retrospectiva", "incremento", "backlog"] },
  fontes: ["Guia do Scrum 2020 em português: scrumguides.org"]
};

/* ───────────── FISIOTERAPIA ───────────── */
AULAS.ana01 = {
  titulo: "Costas: camadas, conexões e por que ficam tensas",
  ideia: "As costas são camadas empilhadas e costuradas pela fáscia. A tensão quase sempre é o sistema nervoso mantendo os músculos ligados, e não um músculo travado sozinho.",
  mapa: { raiz: "Costas", ramos: [
    ["Tecidos", ["Pele e subcutâneo", "Fáscia toracolombar", "Músculos", "Vértebras, discos, facetas", "Ligamentos e nervos"]],
    ["Superficial", ["Trapézio", "Latíssimo do dorso", "Romboides", "Levantador da escápula"]],
    ["Intermediária", ["Serráteis posteriores"]],
    ["Profunda", ["Eretores (iliocostal, longuíssimo, espinal)", "Multífidos"]],
    ["Por que tensiona", ["Ficar parado", "Proteção contra dor", "Estresse", "Respiração no peito", "Fadiga"]] ] },
  recupere: ["De fora para dentro, quais tecidos existem nas costas?", "Por que você acha que o pescoço e os ombros endurecem no computador?", "Que músculo você sente quando inclina o tronco à frente?"],
  blocos: [
    { t: "As camadas de tecido", html: `<table class="tab"><tr><th>Camada</th><th>O que é</th><th>Por que importa</th></tr>
      <tr><td>Pele e subcutâneo</td><td>Proteção, gordura, muitos receptores</td><td>O toque já acalma o sistema nervoso</td></tr>
      <tr><td><b>Fáscia</b></td><td>Lâminas de colágeno que envolvem e ligam os músculos</td><td>Transmite força entre os músculos e é muito inervada</td></tr>
      <tr><td>Músculos</td><td>3 camadas</td><td>É o que contrai e cansa</td></tr>
      <tr><td>Ligamentos</td><td>Ligam osso a osso (longitudinais, amarelo, interespinal)</td><td>Dão estabilidade passiva</td></tr>
      <tr><td>Disco</td><td>Anel fibroso por fora + núcleo pulposo por dentro</td><td>Amortece</td></tr>
      <tr><td>Facetas</td><td>Pequenas articulações atrás das vértebras</td><td>Guiam o movimento</td></tr></table>` },
    { t: "As 3 camadas de músculo", html: `<ul><li><b>Superficial</b> (trapézio, latíssimo do dorso, romboides, levantador da escápula): liga a coluna à escápula e ao braço. É a que mais tensiona no computador.</li><li><b>Intermediária</b> (serráteis posteriores): ligada à respiração.</li><li><b>Profunda</b>: os <b>eretores</b> estendem a coluna e os <b>multífidos</b> estabilizam cada vértebra.</li></ul><p class="dica">Pegadinha: o trapézio é inervado pelo <b>nervo acessório (XI par craniano)</b>, e não pelos nervos espinais.</p><p class="pratica">Palpe agora: mão ao lado da coluna lombar, incline o tronco à frente e volte. O "cordão" que endurece são os eretores.</p>` },
    { t: "Como tudo se interliga", html: `<p>A <b>fáscia toracolombar</b> é um "cinto" em losango na lombar. O <b>latíssimo do dorso</b> de um lado se liga por ela ao <b>glúteo máximo do lado oposto</b>, formando uma diagonal de força que você usa para andar, correr e arremessar. O <b>transverso do abdome</b> puxa essa fáscia pela frente e "aperta o cinto".</p><p>Por isso, uma dor na lombar pode ter relação com o glúteo, com o abdome ou com o ombro do outro lado. O corpo trabalha em <b>cadeias</b>.</p>` },
    { t: "Por que ficam tensas", html: `<div class="ciclo"><span>Postura parada ou estresse</span><span>Tônus ↑</span><span>Menos circulação + fadiga</span><span>Desconforto</span><span>O sistema nervoso protege</span></div>
      <ul><li><b>Ficar parado</b>: contração leve e contínua, o sangue circula menos. O problema é <b>ficar parado</b>, mais do que a "postura errada".</li><li><b>Proteção</b>: diante da dor, o corpo aumenta o tônus ao redor para imobilizar a região.</li><li><b>Estresse</b>: o sistema simpático deixa os músculos em prontidão, principalmente o trapézio superior.</li><li><b>Respiração no peito</b>: escalenos, trapézio superior e ECM trabalham o dia todo.</li><li><b>Fadiga e sono ruim</b>: o vizinho compensa e a dor fica mais sensível.</li></ul>
      <p><b>O que quebra o ciclo:</b> mover-se a cada 30–45 min, respiração diafragmática, calor, fortalecimento progressivo e sono.</p>
      <p class="dica">Honestidade científica: os "nós" ou pontos-gatilho são muito usados na clínica, mas o mecanismo ainda é debatido. Procure um médico se houver febre, perda de força, formigamento que piora ou alteração para urinar ou evacuar.</p>` }
  ],
  widget: "costas",
  quiz: [
    { q: "Qual destes músculos é da camada SUPERFICIAL das costas?", o: ["Multífido", "Longuíssimo", "Romboide", "Rotadores", "Iliocostal"], a: 2, e: "Os romboides ligam a coluna à escápula." },
    { q: "O trapézio é inervado pelo:", o: ["Nervo torácico longo", "Nervo acessório (XI)", "Ramos dorsais", "Nervo frênico", "Nervo radial"], a: 1, e: "Nervo acessório, o XI par craniano." },
    { q: "Pela fáscia toracolombar, o latíssimo do dorso se liga ao:", o: ["Glúteo máximo do mesmo lado", "Glúteo máximo do lado oposto", "Psoas", "Quadríceps", "Diafragma"], a: 1, e: "É uma diagonal posterior: latíssimo de um lado e glúteo do outro." },
    { q: "A principal função dos multífidos é:", o: ["Elevar a escápula", "Estabilizar cada segmento da coluna", "Respirar", "Rodar o braço", "Flexionar o quadril"], a: 1, e: "São estabilizadores segmentares." },
    { q: "Qual fator AUMENTA a tensão no trapézio superior?", o: ["Respiração diafragmática", "Calor local", "Estresse (simpático)", "Pausas frequentes", "Sono bom"], a: 2, e: "O estresse ativa o sistema simpático e o trapézio superior é muito sensível a isso." }
  ],
  feynman: { pergunta: "Explique para alguém de casa por que as costas ficam duras no computador e o que fazer.", chaves: ["parado", "circulação", "estresse", "proteção", "mover", "respiração", "fáscia"] },
  fontes: ["Moore: Anatomia orientada para a clínica (capítulo do dorso)", "Kenhub: Back muscles (kenhub.com)"]
};

AULAS.cin01 = {
  titulo: "Tipos de contração muscular",
  ideia: "O músculo pode encurtar (concêntrica), alongar freando (excêntrica) ou segurar parado (isométrica).",
  mapa: { raiz: "Contração", ramos: [
    ["Concêntrica", ["Encurta", "Vence a carga", "Subir escada"]],
    ["Excêntrica", ["Alonga sob tensão", "Freia", "Descer escada"]],
    ["Isométrica", ["Comprimento igual", "Segura", "Prancha"]],
    ["Clínica", ["Excêntrica gera mais força", "Mais dor tardia", "Usada em tendinopatias"]] ] },
  recupere: ["Ao descer uma escada, o quadríceps encurta ou alonga?", "Dê um exemplo de contração isométrica do dia a dia.", "Qual tipo de contração costuma dar mais dor no dia seguinte?"],
  blocos: [
    { t: "Os três tipos", html: `<table class="tab"><tr><th>Tipo</th><th>Comprimento</th><th>Força × carga</th><th>Exemplo</th></tr><tr><td><b>Concêntrica</b></td><td>Encurta</td><td>Força > carga</td><td>Subir o copo até a boca (bíceps)</td></tr><tr><td><b>Excêntrica</b></td><td>Alonga</td><td>Força &lt; carga (freando)</td><td>Baixar o copo devagar (bíceps)</td></tr><tr><td><b>Isométrica</b></td><td>Não muda</td><td>Força = carga</td><td>Segurar o copo parado; prancha</td></tr></table><p>Concêntrica e excêntrica são chamadas de <b>isotônicas</b> (há movimento).</p>` },
    { t: "Por que isso importa na fisioterapia", html: `<ul><li>A <b>excêntrica</b> produz <b>mais força</b> com menos gasto de energia, mas causa mais <b>dor muscular tardia</b> (a que aparece 24–72 h depois).</li><li>Exercícios excêntricos são muito usados na reabilitação de <b>tendinopatias</b> (ex.: tendão de Aquiles e patelar).</li><li>A <b>isométrica</b> é útil quando o movimento dói, para ganhar força sem mexer a articulação.</li></ul>` },
    { t: "Agonista, antagonista e sinergista", html: `<p>Ao dobrar o cotovelo: o <b>bíceps</b> é o agonista (faz o movimento), o <b>tríceps</b> é o antagonista (faz o oposto e controla) e o <b>braquial</b> é um sinergista (ajuda).</p>` }
  ],
  widget: "parear", parear: [["Subir escada (quadríceps)", "Concêntrica"], ["Descer escada (quadríceps)", "Excêntrica"], ["Prancha abdominal", "Isométrica"], ["Sentar devagar na cadeira", "Excêntrica"], ["Levantar da cadeira", "Concêntrica"], ["Segurar uma sacola parada", "Isométrica"]],
  quiz: [
    { q: "Ao sentar devagar numa cadeira, o quadríceps faz contração:", o: ["Concêntrica", "Excêntrica", "Isométrica", "Nenhuma", "Reflexa"], a: 1, e: "Ele alonga enquanto freia a descida." },
    { q: "Contração sem mudança de comprimento:", o: ["Isotônica", "Isocinética", "Isométrica", "Concêntrica", "Excêntrica"], a: 2, e: "Iso = igual; métrica = comprimento." },
    { q: "Qual tipo costuma gerar mais dor muscular tardia?", o: ["Concêntrica", "Excêntrica", "Isométrica", "Todas igualmente", "Nenhuma"], a: 1, e: "A excêntrica, por causa das microlesões ao frear a carga." },
    { q: "Na flexão do cotovelo, o tríceps é o:", o: ["Agonista", "Antagonista", "Sinergista", "Fixador", "Estabilizador primário"], a: 1, e: "Ele faz o movimento oposto (a extensão)." }
  ],
  feynman: { pergunta: "Explique os 3 tipos de contração usando só exemplos de casa.", chaves: ["encurta", "alonga", "freia", "parado", "escada", "força"] },
  fontes: ["Kisner & Colby: Exercícios terapêuticos", "Hall: Biomecânica básica"]
};

AULAS.fis01 = {
  titulo: "Como o músculo contrai",
  ideia: "Um sinal elétrico libera cálcio dentro da fibra, o cálcio destrava a actina e a miosina puxa a actina usando ATP.",
  mapa: { raiz: "Contração", ramos: [
    ["Estrutura", ["Fibra → miofibrila → sarcômero", "Actina (fina)", "Miosina (grossa)"]],
    ["Gatilho", ["Acetilcolina na placa motora", "Potencial no sarcolema", "Túbulos T"]],
    ["Cálcio", ["Sai do retículo sarcoplasmático", "Liga na troponina", "A tropomiosina sai da frente"]],
    ["Ciclo", ["Ponte cruzada", "Golpe de força", "ATP solta a miosina"]],
    ["Relaxar", ["Cálcio recaptado", "Gasta ATP também"]] ] },
  recupere: ["Que íon dispara a contração dentro da fibra?", "Qual proteína \"puxa\" a outra?", "Por que um músculo sem ATP fica rígido?"],
  blocos: [
    { t: "Da fibra ao sarcômero", html: `<p>Músculo → feixes → <b>fibras</b> (células) → <b>miofibrilas</b> → <b>sarcômeros</b>, a unidade que encurta. Dentro do sarcômero, filamentos finos de <b>actina</b> se entrelaçam com filamentos grossos de <b>miosina</b>.</p><p>Na contração, <b>nenhum filamento encurta</b>: eles <b>deslizam</b> um sobre o outro. É a teoria dos filamentos deslizantes.</p>` },
    { t: "Passo a passo (acoplamento excitação-contração)", html: `<ol><li>O neurônio motor libera <b>acetilcolina</b> na placa motora.</li><li>Surge um potencial de ação na membrana da fibra (sarcolema), que entra pelos <b>túbulos T</b>.</li><li>O <b>retículo sarcoplasmático</b> libera <b>Ca²⁺</b>.</li><li>O Ca²⁺ liga-se à <b>troponina</b>, que tira a <b>tropomiosina</b> de cima dos sítios da actina.</li><li>A <b>miosina</b> se liga à actina (ponte cruzada) e dá o "golpe de força".</li><li>Um novo <b>ATP</b> solta a miosina, e o ciclo se repete enquanto houver cálcio.</li></ol>` },
    { t: "Relaxamento e curiosidade", html: `<p>Para relaxar, o Ca²⁺ é <b>bombeado de volta</b> ao retículo, e essa bomba também gasta ATP. Sem ATP, a miosina não se solta: é a <b>rigidez cadavérica</b> (rigor mortis).</p><p class="dica">Ligação com a aula das costas: músculo sempre ligado = ciclo de pontes cruzadas contínuo, gasto de ATP e acúmulo de metabólitos, ou seja, fadiga e desconforto.</p>` }
  ],
  widget: "ordenar", ordenar: ["Acetilcolina na placa motora", "Potencial de ação no sarcolema", "Cálcio liberado do retículo", "Cálcio liga na troponina", "Miosina puxa a actina", "ATP solta a miosina"], ordenarTitulo: "Monte a sequência da contração",
  quiz: [
    { q: "O íon que inicia a interação actina-miosina é o:", o: ["Sódio", "Potássio", "Cálcio", "Cloro", "Magnésio"], a: 2, e: "O Ca²⁺ liga-se à troponina." },
    { q: "Na contração, os filamentos:", o: ["Encurtam", "Deslizam um sobre o outro", "Se dissolvem", "Se alongam", "Se multiplicam"], a: 1, e: "É a teoria dos filamentos deslizantes." },
    { q: "Função do ATP no ciclo:", o: ["Liberar acetilcolina", "Soltar a miosina da actina e energizá-la", "Ligar a troponina", "Formar túbulos T", "Nenhuma"], a: 1, e: "Sem ATP, a miosina fica presa (rigor)." },
    { q: "Neurotransmissor da placa motora:", o: ["Dopamina", "GABA", "Acetilcolina", "Serotonina", "Glutamato"], a: 2, e: "Acetilcolina." }
  ],
  feynman: { pergunta: "Conte a história da contração começando no neurônio e terminando no relaxamento.", chaves: ["acetilcolina", "cálcio", "troponina", "miosina", "actina", "atp"] },
  fontes: ["Guyton & Hall: Tratado de fisiologia médica (músculo esquelético)"]
};

/* ───────────── NEUROCIÊNCIA ───────────── */
AULAS.cel02 = {
  titulo: "Potencial de ação",
  ideia: "O neurônio é uma bateria: em repouso, o lado de dentro é negativo. Quando passa do limiar, o sódio entra, o sinal dispara e corre pelo axônio.",
  mapa: { raiz: "Potencial de ação", ramos: [
    ["Repouso", ["≈ −70 mV", "Bomba Na⁺/K⁺: 3 sódios saem, 2 potássios entram"]],
    ["Limiar", ["≈ −55 mV", "Tudo ou nada"]],
    ["Despolarização", ["Canais de Na⁺ abrem", "Pico ≈ +30 a +40 mV"]],
    ["Repolarização", ["K⁺ sai"]],
    ["Hiperpolarização", ["Passa um pouco do repouso", "Período refratário"]],
    ["Velocidade", ["Mielina", "Nós de Ranvier", "Condução saltatória"]] ] },
  recupere: ["Por que o interior do neurônio é negativo em repouso?", "O que significa \"tudo ou nada\"?", "Para que serve a mielina?"],
  blocos: [
    { t: "A bateria do neurônio", html: `<p>Em repouso, a membrana fica em cerca de <b>−70 mV</b>: há mais Na⁺ fora e mais K⁺ dentro. A <b>bomba sódio-potássio</b> mantém essa diferença trocando 3 Na⁺ para fora por 2 K⁺ para dentro, gastando ATP.</p>` },
    { t: "As 4 fases", html: `<ol><li><b>Estímulo</b>: a membrana sobe até o <b>limiar</b> (≈ −55 mV).</li><li><b>Despolarização</b>: canais de Na⁺ se abrem, o sódio entra e o potencial vai a cerca de <b>+30/+40 mV</b>.</li><li><b>Repolarização</b>: os canais de Na⁺ fecham, os de K⁺ abrem e o potássio sai.</li><li><b>Hiperpolarização</b>: passa um pouco abaixo do repouso. Nesse <b>período refratário</b>, é difícil ou impossível disparar de novo.</li></ol><p class="dica">Tudo ou nada: abaixo do limiar, nada acontece. Acima dele, o disparo tem sempre o mesmo tamanho. A intensidade do estímulo muda a <b>frequência</b> dos disparos, não a altura.</p>` },
    { t: "Mielina = velocidade", html: `<p>A mielina isola o axônio, e o sinal "pula" entre os <b>nós de Ranvier</b> (condução saltatória), o que é muito mais rápido. Doenças que destroem a mielina, como a esclerose múltipla, deixam o sinal lento ou falho.</p>` }
  ],
  widget: "potencial",
  quiz: [
    { q: "Potencial de repouso típico de um neurônio:", o: ["0 mV", "+40 mV", "≈ −70 mV", "−150 mV", "+70 mV"], a: 2, e: "Cerca de −70 mV." },
    { q: "A despolarização acontece principalmente pela:", o: ["Saída de K⁺", "Entrada de Na⁺", "Entrada de Cl⁻", "Saída de Ca²⁺", "Bomba Na⁺/K⁺"], a: 1, e: "Os canais de sódio abrem e o Na⁺ entra." },
    { q: "Um estímulo mais forte que o limiar faz o potencial de ação:", o: ["Ficar mais alto", "Ficar mais baixo", "Disparar com mais frequência", "Durar mais tempo", "Mudar de sinal"], a: 2, e: "Tudo ou nada: a altura é a mesma, muda a frequência." },
    { q: "A condução saltatória acontece entre:", o: ["Dendritos", "Nós de Ranvier", "Sinapses", "Corpos celulares", "Células da glia"], a: 1, e: "O sinal salta de nó em nó." }
  ],
  feynman: { pergunta: "Explique o potencial de ação usando a ideia de uma bateria e de uma porta que abre.", chaves: ["repouso", "limiar", "sódio", "potássio", "tudo ou nada", "mielina"] },
  fontes: ["Bear, Connors & Paradiso: Neurociências", "Roberto Lent: Cem bilhões de neurônios"]
};

AULAS.fun01 = {
  titulo: "Memória: como o cérebro guarda o que você estuda",
  ideia: "Lembrar é reconstruir. Cada vez que você puxa uma informação da memória, ela fica mais forte e dura mais.",
  mapa: { raiz: "Memória", ramos: [
    ["Etapas", ["Codificar (atenção)", "Consolidar (sono)", "Recuperar (lembrar)"]],
    ["Estruturas", ["Hipocampo: memórias novas", "Córtex: armazenamento", "Amígdala: emoção"]],
    ["Célula", ["LTP: a sinapse se fortalece com o uso"]],
    ["Esquecimento", ["Curva de Ebbinghaus", "Revisar interrompe a queda"]] ] },
  recupere: ["Por que você esquece algo que leu ontem?", "Que parte do cérebro forma memórias novas?", "Por que dormir ajuda a estudar?"],
  blocos: [
    { t: "As 3 etapas", html: `<ol><li><b>Codificação</b>: depende de <b>atenção</b>. Sem atenção, não entra.</li><li><b>Consolidação</b>: o hipocampo "reproduz" o dia durante o <b>sono</b> e transfere a memória para o córtex.</li><li><b>Recuperação</b>: lembrar. E cada recuperação <b>fortalece</b> a memória.</li></ol>` },
    { t: "LTP: a base celular", html: `<p>Quando dois neurônios disparam juntos repetidamente, a sinapse entre eles fica mais forte. É a <b>potenciação de longo prazo</b> (LTP): "neurônios que disparam juntos se conectam". O receptor <b>NMDA</b> (de glutamato) é uma peça-chave desse processo no hipocampo.</p>` },
    { t: "A curva do esquecimento", html: `<p>Ebbinghaus mostrou que esquecemos rápido nos primeiros dias. Cada <b>revisão espaçada</b> reinicia a curva e deixa a queda mais lenta. É exatamente o que o Anki e as revisões do estudaai fazem. Mexa no gráfico abaixo.</p>` },
    { t: "Emoção e memória", html: `<p>A <b>amígdala</b> marca o que é emocionalmente relevante, e isso é lembrado melhor. Por isso exemplos pessoais, histórias e curiosidade ajudam a fixar. O estresse crônico, ao contrário, prejudica o hipocampo.</p>` }
  ],
  widget: "esquecimento",
  quiz: [
    { q: "Estrutura essencial para formar memórias declarativas novas:", o: ["Cerebelo", "Hipocampo", "Bulbo", "Amígdala", "Medula"], a: 1, e: "Hipocampo." },
    { q: "A consolidação da memória é muito favorecida pelo:", o: ["Café", "Sono", "Jejum", "Releitura", "Grifar"], a: 1, e: "Durante o sono o hipocampo reativa e consolida." },
    { q: "LTP significa:", o: ["Perda de neurônios", "Fortalecimento duradouro de sinapses", "Bloqueio de dopamina", "Esquecimento ativo", "Morte da mielina"], a: 1, e: "Potenciação de longo prazo." },
    { q: "O que mais retarda a curva do esquecimento?", o: ["Reler várias vezes no mesmo dia", "Revisões espaçadas com recuperação ativa", "Grifar", "Copiar o resumo", "Estudar com música alta"], a: 1, e: "Espaçamento + recuperação." }
  ],
  feynman: { pergunta: "Explique por que revisar em dias diferentes funciona melhor que estudar tudo de uma vez.", chaves: ["recuperar", "espaçada", "sono", "hipocampo", "curva", "fortalece"] },
  fontes: ["Ebbinghaus (1885)", "Dunlosky et al. (2013): técnicas de estudo eficazes"]
};

AULAS.apl02 = {
  titulo: "Aprender a aprender (com ciência)",
  ideia: "O que parece produtivo (reler, grifar) rende pouco. O que parece difícil (testar-se, espaçar, misturar) é o que fixa.",
  mapa: { raiz: "Estudar bem", ramos: [
    ["Funciona muito", ["Testar-se (recuperação)", "Espaçar"]],
    ["Funciona bem", ["Intercalar assuntos", "Explicar o porquê", "Palavra + imagem"]],
    ["Pouco efeito", ["Reler", "Grifar", "Resumo copiado"]],
    ["Mitos", ["Estilos de aprendizagem", "Usamos só 10% do cérebro", "Cérebro esquerdo × direito"]],
    ["Base", ["Sono", "Exercício", "Pausas"]] ] },
  recupere: ["Qual técnica de estudo você mais usa? Ela está na lista de alta eficácia?", "O que é uma \"dificuldade desejável\"?"],
  blocos: [
    { t: "O ranking (Dunlosky et al., 2013)", html: `<table class="tab"><tr><th>Técnica</th><th>Eficácia</th></tr><tr><td>Testar-se (flashcards, questões)</td><td><span class="pill ok">alta</span></td></tr><tr><td>Prática espaçada</td><td><span class="pill ok">alta</span></td></tr><tr><td>Intercalar tipos de problema</td><td><span class="pill med">moderada (com evidência crescente)</span></td></tr><tr><td>Perguntar "por quê?" e autoexplicação</td><td><span class="pill med">moderada</span></td></tr><tr><td>Resumir, grifar, reler</td><td><span class="pill bad">baixa</span></td></tr></table>` },
    { t: "Dificuldade desejável", html: `<p>Robert Bjork chama de <b>dificuldades desejáveis</b> os esforços que deixam o estudo mais lento na hora, mas fixam muito mais: lembrar sem olhar, espaçar, misturar matérias. A sensação de "estou entendendo tudo" ao reler é <b>familiaridade</b>, não aprendizado.</p>` },
    { t: "Mitos que atrapalham", html: `<ul><li><b>"Sou visual, então só aprendo vendo"</b>: adaptar ao "estilo" não melhora o aprendizado. O que ajuda <b>todo mundo</b> é juntar palavra e imagem (codificação dupla), de preferência <b>desenhando de memória</b>.</li><li><b>10% do cérebro</b>: falso. Usamos praticamente todo o cérebro, em momentos diferentes.</li><li><b>Pessoas de "cérebro esquerdo" e "direito"</b>: os hemisférios têm especializações, mas não existem tipos de pessoa assim.</li></ul>` },
    { t: "Para quem tem TDAH", html: `<p>Na prática: <b>blocos curtos com começo e fim</b>, uma tarefa visível por vez, recompensa logo depois, movimento entre os blocos e alguém estudando junto (body doubling). O estudaai já decide o próximo passo para tirar o peso da escolha.</p>` }
  ],
  widget: "parear", parear: [["Fazer flashcards sem olhar a resposta", "Recuperação ativa"], ["Revisar em 1, 3 e 7 dias", "Espaçamento"], ["Misturar RLM e Português no mesmo bloco", "Intercalação"], ["Desenhar o mapa de memória", "Codificação dupla"], ["Explicar para alguém", "Autoexplicação (Feynman)"]],
  quiz: [
    { q: "Qual técnica tem eficácia ALTA segundo Dunlosky?", o: ["Grifar", "Reler", "Testar-se", "Resumir", "Palavras-chave"], a: 2, e: "Testar-se e espaçar são as duas de alta utilidade." },
    { q: "A sensação de entender tudo ao reler é, geralmente:", o: ["Aprendizado profundo", "Familiaridade", "Consolidação", "LTP", "Memória de trabalho"], a: 1, e: "Familiaridade engana: parece aprendizado, mas não dura." },
    { q: "Sobre estilos de aprendizagem (visual, auditivo...):", o: ["Ensinar no estilo melhora muito", "Não há evidência de que adaptar ao estilo melhore", "Só vale para crianças", "É a base da neurociência", "Só vale para TDAH"], a: 1, e: "As revisões científicas não encontram esse efeito." }
  ],
  feynman: { pergunta: "Monte seu próprio método de estudo usando 3 técnicas desta aula e diga por que escolheu cada uma.", chaves: ["testar", "espaçar", "intercalar", "imagem", "sono"] },
  fontes: ["Dunlosky et al. (2013), Psychological Science in the Public Interest", "Brown, Roediger & McDaniel: Fixe o conhecimento (Make it Stick)"]
};
