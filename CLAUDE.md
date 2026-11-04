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
- `servidor.py`: http.server da biblioteca padrão. API em `/api/*`. Grava em `dados/` (fora do git).
- `nucleo/organizar.py`: PDF → seções → termos (TF-IDF + bigramas), definições, lacunas, aula automática. Sem IA.
- `nucleo/ia.py`: aula com IA via API da Anthropic (urllib, sem SDK). Modelo em `dados/config.json`.
- `fonte/app.html`: o app inteiro (HTML + CSS + JS, sem framework). `fonte/aulas-*.js`: aulas prontas. `conteudo/`: temas e cartões.
- `python fonte/build.py` gera `web/index.html`. **Sempre rode depois de editar fonte/ ou conteudo/.**

## Três modos (o mesmo web/index.html)
- **nuvem:** publicado como artefato do Claude (slug 11cb6c08-b22d-455d-b70a-06acd9cac98b), com as capacidades db, user, assets, sample e downloads. Estado em `data/users/<id>/estado`; índice da biblioteca em `data/users/<id>/biblioteca`; PDFs e pacotes JSON em assets. PDF lido com pdf.js 3.11.174 (cdnjs) + `fonte/organizar.js`.
- **local:** `python servidor.py` (API em /api/*, dados em `dados/`).
- **arquivo:** abrir `web/index.html`, com localStorage.

## Regras
- Não quebre o modo arquivo (abrir `web/index.html` sem servidor). Chamadas à API ficam dentro de `MODO === "local"`.
- Aulas novas seguem o formato de `docs/REFERENCIAS.md`. Conteúdo factual correto; se for debatido, diga. Legislação: sempre conferir o texto da lei.
- Testes: `python -m unittest discover testes`.
- Dados pessoais (PDFs dela, progresso, chave de API) nunca vão para o git.
