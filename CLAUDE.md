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
- `nucleo/ia.py`: repassa o pedido montado pelo app (urllib, sem SDK). Gerar aula: só Anthropic. Revisão com IA e dúvidas: Claude → ChatGPT (Responses API) → Gemini, o primeiro com chave, sempre com busca na web. Chaves e modelos em `dados/config.json`.
- `fonte/organizar.js`: PDF → seções → termos (TF-IDF + bigramas), definições, lacunas, aula automática. Sem IA. `ORG.escolherTema` decide o tema do PDF: entra como seção do tema que já trata do assunto e só cria tema novo se nada combinar (`vincularAntigos` em 30-biblioteca migrou os temas "pdf-…" antigos). Roda no navegador nos dois modos; é a ÚNICA implementação.
- `fonte/app.html` (casca) + `fonte/estilo.css` + `fonte/js/NN-*.js` (o app, sem framework, escopo global compartilhado, juntados em ordem numérica). 10 util · 20 estado · 25 nuvem · 30 biblioteca (armazém: mesma interface local/nuvem) · 40 dados · 41 cartões/FSRS · 50 IA (aulas) · 52 revisão com IA e dúvidas · 60 roteador · 7x telas · 8x widgets · 99 iniciar. Tela nova = arquivo `7x-tela-*.js` + entrada em `ROTAS` (ou rota só no `rotear`, como `#ia`).
- Fluxo da aula: Teste guarda a alternativa (`sessao.resp`) → Feito "Registrar respostas" grava em `st.tentativas` (sem mensagem de agendamento; `registrarAula` ainda roda por baixo para o progresso) → tela `#ia` junta as tentativas e manda à IA ou gera `.md`. Dúvidas do fim da aula: `st.duvidas` → `#ia-duvidas` → `.md` semanal. Respostas da IA: `st.respostasIA`.
- Visual: tokens no topo de `fonte/estilo.css`. `--c` é a cor do tema e pinta botão principal, progresso, passos e ícone de tudo dentro do elemento que a define. Ícones SVG em `ICONES` (10-util), sem emoji na interface. Cor do tema: `st.coresTema` (escolha dela) → cor salva → primeira livre de `CORES` (nunca repete).
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
