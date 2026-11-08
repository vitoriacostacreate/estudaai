<div align="center">

# 🧠 estudaai

**Seu estudo organizado a partir dos seus PDFs, no seu computador.**

Você joga uma apostila, uma lei ou um capítulo de livro. O estudaai separa as seções, monta uma aula interativa para cada uma e cria cartões de revisão. Depois ele decide o seu próximo passo todos os dias.

![Python](https://img.shields.io/badge/python-3.10%2B-7f9cff?style=flat-square) ![Local](https://img.shields.io/badge/roda-100%25%20local-35c9bd?style=flat-square) ![FSRS](https://img.shields.io/badge/revis%C3%A3o-FSRS--4.5-a98bf0?style=flat-square) ![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-f2a35b?style=flat-square)

<img src="docs/img/inicio.png" width="860" alt="Tela inicial: seu próximo passo, plano de hoje e temas">

</div>

## ✨ O que ele faz

| | |
|---|---|
| 📄 **PDF vira trilha** | Lê o sumário do PDF ou detecta os títulos ("1.2 Contração muscular", "CAPÍTULO 3"). Cada seção vira um tópico, com as páginas de origem. |
| 🧩 **Aula em 7 passos** | Mapa mental → lembrar antes → conteúdo → prática interativa → teste → explicar com suas palavras (Feynman) → registrar. |
| 🃏 **Cartões automáticos** | Definições ("X é…"), lacunas com os termos-chave e lacunas com números e prazos ("30 dias", "40 %"). Cada cartão aponta para a página do PDF. |
| 🔁 **Revisão espaçada de verdade** | Algoritmo **FSRS-4.5**, o mesmo modelo de memória que o Anki usa hoje. As aulas também voltam para revisão. |
| ✨ **IA opcional** | Na versão na nuvem, usa o Claude da sua conta. No PC, sem chave, monta o pedido com o texto do PDF para colar no Claude; com chave da API, gera a aula sozinho. |
| 🎯 **Próximo passo** | Toda manhã: cartões → aula principal → aula de "recompensa" de outro tema. Você não precisa decidir nada. |
| 🔎 **Busca** | Procura uma palavra em todos os seus PDFs e abre a aula daquele trecho. |
| 📤 **Anki** | Exporta os cartões em `.csv`, pronto para importar no Anki. |

Já vem com **7 temas** e **19 aulas** interativas: concurso UFMS (TI), fisioterapia, neurociência, FL Studio, teoria musical, violão e Libras. As práticas incluem piano com som, sequenciador de batida, acordes de violão, disparo de neurônio, curva do esquecimento e tabela-verdade.

<p align="center">
<img src="docs/img/biblioteca.png" width="420" alt="Biblioteca de PDFs"> <img src="docs/img/aula-pdf.png" width="420" alt="Aula gerada a partir de um PDF">
<img src="docs/img/costas.png" width="420" alt="Prática: camadas das costas"> <img src="docs/img/sequenciador.png" width="420" alt="Prática: sequenciador de 16 passos">
</p>

## ☁️ Versão na nuvem (PC, notebook e celular)

O mesmo app roda como uma página do Claude, sem instalar nada:
- **Progresso sincronizado:** fica salvo na sua conta e aparece igual em qualquer aparelho. Também há o botão **Progresso → Sincronizar agora**.
- **PDFs:** são lidos no próprio navegador (pdf.js) e guardados na sua conta.
- **IA:** usa o próprio Claude, sem chave de API.

O código é o mesmo `web/index.html`: ele detecta onde está rodando (nuvem, servidor local ou arquivo) e se adapta.

## 🚀 Como rodar

Você precisa só do **Python 3.10+** ([python.org](https://www.python.org/downloads/)). Nada para instalar além dele.

**Windows:** dois cliques em **`ESTUDAAI.bat`**.

**Mac/Linux:**
```bash
./estudaai.sh
# ou, manualmente:
python servidor.py
```

O navegador abre em **http://127.0.0.1:8765**. Vá em **Biblioteca** e arraste um PDF. Para testar, use `exemplos/apostila-exemplo.pdf`.

> Sem servidor também funciona: abra `web/index.html` direto no navegador. As aulas e os cartões prontos funcionam; só a importação de PDF precisa do servidor.

> O PDF é lido no próprio navegador (pdf.js), então **importar** precisa de internet. Estudar funciona offline.

### 💻 Em outro PC (pelo Git)

1. Instale o **Git** ([git-scm.com](https://git-scm.com/downloads)) e o **Python 3.10+** (no Windows, marque *Add Python to PATH*).
2. Abra um terminal na pasta onde quer o app e clone:
   ```bash
   git clone https://github.com/vitoriacostacreate/estudaai.git
   cd estudaai
   ```
3. **Windows:** dois cliques em `ESTUDAAI.bat`. **Mac/Linux:** `./estudaai.sh`.
4. Para pegar as novidades depois: `git pull` dentro da pasta.

> **O que não vem no clone:** a pasta `dados/` (seus PDFs, progresso e chaves de IA) fica fora do Git de propósito. O progresso e os PDFs chegam pelo **Obsidian** (abaixo). As chaves de IA: rode `CONFIGURAR-IA.bat` de novo. Sem Obsidian: **Progresso → Copiar backup** num aparelho e **Restaurar** no outro, ou use a **versão na nuvem**.

### 🔄 Progresso entre aparelhos pelo Obsidian (automático)

Se o estudaai estiver **dentro de um cofre do Obsidian** (uma pasta com `.obsidian` acima dele) com o **Obsidian Sync** ligado:

- **Salva sozinho.** Uns 2 segundos depois de cada mudança (estudar, revisar, importar PDF, prepara.ai, foco), o servidor grava `<cofre>/estudaai-sync/<aparelho>.md`: totais, **histórico do que mudou** e os dados. Os PDFs vão em `estudaai-sync/arquivos/`. Ao fechar a aba, ele grava de novo na hora. O selo **Obsidian ✓ 14:32** no topo mostra a última vez; clique nele para forçar.
- **Pergunta ao abrir.** No outro aparelho, se a nota de lá for mais nova, aparece **"Sincronizar com o Obsidian?"** com o que mudou. Um clique junta os dois. **Nada se perde:** cartões e tópicos ficam com a revisão mais recente, e listas e dias de estudo são somados.
- Cada aparelho escreve só a sua nota, então o Sync nunca mistura duas versões do mesmo arquivo.
- Ajustes em `dados/config.json`: `"nome_aparelho": "notebook"` (como ele aparece no aviso), `"cofre_obsidian": "C:\\caminho\\do\\cofre"` (se o app estiver fora do cofre) ou `"cofre_obsidian": "nao"` (desliga).

> ⚠️ **Exclua a pasta do código do Sync** (Obsidian → Configurações → Sync → Pastas excluídas → `estudaai`) **em cada aparelho**: essa configuração não passa de um para o outro. O código vai só pelo Git; pelo Obsidian vai só `estudaai-sync/`.

### IA (opcional)
**Windows:** dois cliques em **`CONFIGURAR-IA.bat`** (o `ESTUDAAI.bat` oferece isso sozinho na primeira vez). Ele abre a página de cada chave; você cria e **copia**, e o script percebe, testa e salva em `dados/config.json`. Enter pula. Mac/Linux: `python configurar_ia.py`.

Ordem automática, por atividade (aula, revisão, dúvidas): **sua assinatura do Claude** (se o Claude Code estiver instalado e logado: sem chave, com busca na web, gasta do limite do plano) → **APIs pagas** com o melhor modelo para a tarefa (Claude, depois ChatGPT) → **Gemini grátis** (Google AI Studio) → **copiar e abrir no chat** (sua assinatura ou a versão grátis). Se uma falhar (sem crédito, limite), passa para a próxima sozinha. A tabela fica em `CADEIA`, em `nucleo/ia.py`.

> Assinatura (Claude Pro, ChatGPT Plus) não inclui a API: a API é crédito pré-pago à parte. Com só a assinatura, use "Copiar e abrir no chat".

## 🗂️ Onde ficam as coisas

```
estudaai/
├── ESTUDAAI.bat / estudaai.sh   ← abrir
├── servidor.py                  ← servidor local: só guarda arquivos (biblioteca padrão do Python)
├── nucleo/ia.py                 ← cadeia de IAs (pagas → Gemini grátis), com busca na web e troca automática se uma falhar
├── configurar_ia.py             ← liga as IAs: abre a página da chave, detecta a chave copiada, testa e salva
├── web/index.html               ← o app (gerado; não edite à mão)
├── fonte/                       ← código do app → python fonte/build.py
│   ├── app.html + estilo.css    ← casca da página e visual
│   ├── js/NN-*.js               ← o app, um arquivo por parte (juntados na ordem do número)
│   ├── organizar.js             ← PDF → seções → termos, definições, lacunas, aula
│   └── aulas-*.js               ← aulas prontas
├── conteudo/                    ← temas e cartões que já vêm prontos
├── dados/                       ← SEU material: PDFs, progresso, config (fora do git)
└── testes/
```

**Seus dados não vão para o GitHub:** a pasta `dados/` está no `.gitignore`. Para fazer backup, copie essa pasta ou use **Progresso → Copiar backup**.

## 🧪 Desenvolvimento

```bash
python testes/gerar_exemplo.py     # recria o PDF de exemplo (precisa de reportlab)
python -m unittest discover testes # testes do servidor
node --test testes/*.test.js       # testes do organizador de PDF
python fonte/build.py              # depois de editar fonte/ ou conteudo/
```

**Para criar um tema pronto**, adicione `conteudo/temas/<tema>.json` e a entrada em `META` no `fonte/build.py`. **Para criar uma aula**, adicione um `AULAS.<id> = {...}` em `fonte/aulas-*.js` (o formato está em `docs/REFERENCIAS.md`).

## 🙏 Referências e inspirações

O estudaai junta ideias de projetos abertos. Os detalhes estão em [docs/REFERENCIAS.md](docs/REFERENCIAS.md).
- [open-spaced-repetition / FSRS](https://github.com/open-spaced-repetition): o algoritmo de revisão.
- [lfnovo/open-notebook](https://github.com/lfnovo/open-notebook): fontes viram cadernos, roda local, IA opcional.
- [cardflash](https://github.com/cardflash/cardflash-angular): cada cartão aponta para o trecho do PDF de origem.
- [ankitects/anki](https://github.com/ankitects/anki): exportação compatível.
- Dunlosky et al. (2013): as técnicas de estudo com mais evidência (testar-se e espaçar).

## Licença
MIT © Vitória Costa
