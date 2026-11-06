# estudaai: contexto para o Claude Code

## O que é
App pessoal de estudo da Vitória (Campo Grande/MS, área de TI/QA). Roda local: `python servidor.py` → http://127.0.0.1:8765.
Ela importa PDFs, e o app organiza em temas, tópicos, aulas interativas e cartões com revisão espaçada (FSRS-4.5).
Foco atual: **concurso UFMS 2026, Analista de TI (cargo 506, Desenvolvimento de Software), banca FAPEC, prova em 17/01/2027**.
Outros temas: fisioterapia (começando o curso), neurociência, FL Studio, teoria musical, violão, Libras.

## Perfil (como escrever aulas e textos para ela)
- Muito visual; se identifica com TDAH, autismo e altas habilidades (sem diagnóstico). Blocos curtos, uma ideia por vez, exemplos concretos, mapa antes do detalhe.
- Quer autonomia: decida e mostre o que decidiu; pergunte só o que for essencial.
- Português do Brasil, direto e objetivo.
- Ciência honesta: "estilos de aprendizagem" não têm evidência. Use codificação dupla e recuperação ativa.

## Arquitetura
- `servidor.py`: http.server da biblioteca padrão, sem dependências. Só guarda arquivos: `/api/estado`, `/api/biblioteca` (índice), `/api/arquivos` (PDFs e pacotes JSON), `/api/config`, `/api/ia/aula`, `/api/ia/texto` (revisão/pesquisa em Markdown). Grava em `dados/` (fora do git). `migrar_v1` converte o formato antigo na partida.
- `nucleo/ia.py`: repassa o pedido montado pelo app (urllib, sem SDK). Primeiro a **assinatura do Claude** (`_assinatura`: roda o Claude Code instalado, `claude -p`, numa pasta vazia, só com WebSearch/WebFetch; `claude_code()` acha o exe no PATH ou na extensão do VS Code; desliga com `usar_assinatura_claude: "nao"`). Depois `CADEIA` por atividade (aula, revisao, duvidas): APIs pagas com o melhor modelo → Gemini grátis (`gemini_plano`) → no app, "copiar e abrir no chat". Se uma falha, tenta a próxima (`gerar_texto`). O app nunca pede para ela escolher a IA. Chaves em `dados/config.json`, preenchidas por `configurar_ia.py` / `CONFIGURAR-IA.bat` (detecta a chave copiada; o ESTUDAAI.bat oferece na primeira vez).
- `fonte/organizar.js`: PDF → seções → termos (TF-IDF + bigramas), definições, lacunas, aula automática. Sem IA. `ORG.escolherTema` decide o tema do PDF: entra como seção do tema que já trata do assunto e só cria tema novo se nada combinar (`vincularAntigos` em 30-biblioteca migrou os temas "pdf-…" antigos). Roda no navegador nos dois modos; é a ÚNICA implementação.
- `fonte/app.html` (casca) + `fonte/estilo.css` + `fonte/js/NN-*.js` (o app, sem framework, escopo global compartilhado, juntados em ordem numérica). 10 util · 20 estado · 25 nuvem · 30 biblioteca (armazém: mesma interface local/nuvem) · 40 dados · 41 cartões/FSRS · 50 IA (aulas) · 52 revisão com IA e dúvidas · 60 roteador · 7x telas · 8x widgets · 99 iniciar. Tela nova = arquivo `7x-tela-*.js` + entrada em `ROTAS` (ou rota só no `rotear`, como `#ia`).
- Fluxo da aula: Teste guarda a alternativa (`sessao.resp`) → Feito "Registrar respostas" grava em `st.tentativas` (sem mensagem de agendamento; `registrarAula` ainda roda por baixo para o progresso) → tela `#ia` junta as tentativas e manda à IA ou gera `.md`. Dúvidas do fim da aula: `st.duvidas` → `#ia-duvidas` → `.md` semanal. Respostas da IA: `st.respostasIA`.
- Visual: tokens no topo de `fonte/estilo.css`. `--c` é a cor do tema e pinta botão principal, progresso, passos e ícone de tudo dentro do elemento que a define. Ícones SVG em `ICONES` (10-util), sem emoji na interface. Cor do tema: `st.coresTema` (escolha dela) → cor salva → primeira livre de `CORES` (nunca repete).
- **prepara.ai** (aba Prepara, `#prepara` e `#prepara-<id>`): imersões para montar o plano de estar no avião ou pousando lá fora em 08/02/2027, com custo baixíssimo, trabalho previsto e carreira. Estratégia em `PREPARA.estrategia` ("Ponte barata + carreira": pousar no Mercosul → levar o trabalho na mala → trampolim), mostrada no topo da aba. Trabalho previsto é critério crítico do Go/No-Go e tem imersão própria (`carreira`). Conteúdo em `fonte/prepara-mudanca.js` (const `PREPARA`: imersões Entenda → Faça → Saída, rotas, critérios, marcos, Go/No-Go, fontes; conferido em 06/11/2026). Contas sem DOM em `fonte/js/46-prepara.js` (`PREP`, testado em `testes/prepara.test.js`). Tela em `79-tela-prepara.js`. Respostas em `st.prepara` (`r`, `bens`, `notas`, `pesos`, `concluidas`, `marcosEd` = trocas nos marcos padrão, `marcosExtra` = marcos dela, `revisado` = última revisão semanal, `ia` = última revisão da IA). Rota A/B guardam o id da rota (`PREP.rotaNome`); `rotas[].comprova` + cotação (`cot_eur`, `cot_usd`) sugerem a meta (`PREP.metaRota`, nunca chuta câmbio). Exporta o plano em `.md` e manda à IA pela mesma cadeia da revisão (`PREP.promptIA` → `iaTexto`, senão copiar e abrir no chat). Fora da aba: chip dos dias até o embarque (só depois que ela começa; some com o foco ligado até 1400 px), lembrete semanal na Início (`PREP.revisaoVencida`), bloco no Progresso e imersões contam no acrescentou.ai (tipo `prepara`). Regra de imigração muda: ao atualizar, confira na fonte oficial e troque `meta.verificado`.
- **Padrão de apresentação de features novas** (origem: perfil do Obsidian, `../perfil/perfil-aprendizagem.md`; o perfil vence este arquivo): (1) **mapa antes do detalhe**: 3 a 7 ramos no topo; (2) **recuperação no meio**, não só no fim: uma pergunta "Recupere" entre explicar e fazer; errou → dica e mais uma tentativa, só depois a resposta e o porquê; (3) **versão de dia ruim** (~10 min, regra dos 2 mínimos) em toda atividade longa; (4) **decida por ela**: sugira o valor ou a próxima ação e deixe um clique para aceitar; (5) progresso e recompensa **visíveis** (barras, contadores, marca no dia); (6) visual serve para reconstruir de memória, não para enfeitar (codificação dupla, nada de "estilos de aprendizagem"). Dados pessoais da nota de perfil (saúde, dinheiro, endereço) nunca vão para o git.
- `fonte/aulas-*.js`: aulas prontas. `conteudo/`: temas e cartões.
- `python fonte/build.py` gera `web/index.html`. **Sempre rode depois de editar fonte/ ou conteudo/.**

## Três modos (o mesmo web/index.html)
- **nuvem:** publicado como artefato do Claude (slug 11cb6c08-b22d-455d-b70a-06acd9cac98b), com as capacidades db, user, assets, sample e downloads. Estado em `data/users/<id>/estado`; índice da biblioteca em `data/users/<id>/biblioteca`; PDFs e pacotes JSON em assets. PDF lido com pdf.js 3.11.174 (cdnjs) + `fonte/organizar.js`.
- **local:** `python servidor.py` (API em /api/*, dados em `dados/`).
- **arquivo:** abrir `web/index.html`, com localStorage.

## Regras
- Não quebre o modo arquivo (abrir `web/index.html` sem servidor). Chamadas à API ficam dentro de `MODO === "local"`.
- Aulas novas seguem o formato de `docs/REFERENCIAS.md`. Conteúdo factual correto; se for debatido, diga. Legislação: sempre conferir o texto da lei.
- Testes: `python -m unittest discover testes` (servidor) e `node --test testes/` (organizador).
- Dados pessoais (PDFs dela, progresso, chave de API) nunca vão para o git.
