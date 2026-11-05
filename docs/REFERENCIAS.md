# Referências: o que veio de onde

| Projeto | O que tem de bom | O que o estudaai aproveitou |
|---|---|---|
| [open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki) e [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | Modelo de memória DSR (dificuldade, estabilidade, recuperabilidade), validado em bilhões de revisões | `FSRS` em `fonte/js/41-cartoes.js`: pesos padrão do FSRS-4.5, curva de esquecimento em lei de potência (R = (1 + 19/81 · t/S)^−0,5), retenção-alvo de 90%. O intervalo é igual a S. |
| [lfnovo/open-notebook](https://github.com/lfnovo/open-notebook) | Alternativa aberta ao NotebookLM: fontes → cadernos, local, privacidade, IA plugável | Biblioteca de PDFs, tudo em `dados/`, IA opcional e trocável (`nucleo/ia.py`) |
| [cardflash](https://github.com/cardflash/cardflash-angular) | Cartões ligados ao trecho exato do PDF | Cada tópico e cartão guarda a página: botões "Abrir no PDF (p. X)" e "Ler o trecho original" |
| [ankitects/anki](https://github.com/ankitects/anki) | Padrão de mercado em revisão | Exportação `.csv` com `#separator`, `#html` e `#deck column` |
| [st3v3nmw/obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) | Revisar notas inteiras, além de cartões | As **aulas** também têm revisão agendada (e voltam no "plano de hoje") |
| [adCBueno/flashcards](https://github.com/adCBueno/flashcards) | Local-first, sem build, sem conta | Funciona abrindo o `web/index.html`; o servidor é só Python padrão |
| Dunlosky et al. (2013); Bjork (dificuldades desejáveis) | As técnicas com mais evidência: testar-se e espaçar | Ordem da aula: lembrar ANTES, teste, Feynman, revisão espaçada |

## Como o PDF é organizado (sem IA), em `fonte/organizar.js`
Roda no navegador, igual nos modos local e nuvem.
1. **Texto por página** com `pdf.js`, consertando a hifenização do fim de linha.
2. **Seções**, em ordem de preferência: o sumário do PDF; títulos numerados, em CAIXA ALTA ou "CAPÍTULO/UNIDADE/AULA…"; blocos de 2 ou 3 páginas. Seções com menos de 60 palavras são unidas à anterior.
3. **Termos-chave**: TF-IDF entre as seções, com expressões de 2 palavras ("retículo sarcoplasmático"), filtro de verbos e de palavras comuns, e bônus para termos que aparecem em definições.
4. **Definições**: frases do tipo "X é / são / consiste em / refere-se a…" e "Termo: explicação".
5. **Lacunas**: números com unidade (prazos, porcentagens) e termos-chave dentro de frases.
6. **Aula automática**: mapa mental (termos e frases), perguntas de "lembre", blocos de cerca de 140 palavras com os termos em negrito, teste com alternativas tiradas dos termos do próprio PDF, jogo de ligar pares (se houver 3 ou mais definições) e Feynman com palavras-chave.

## Formato de uma aula (JSON)
```json
{
  "titulo": "…", "ideia": "1 frase",
  "mapa": {"raiz": "…", "ramos": [["ramo", ["item", "item"]]]},
  "recupere": ["pergunta antes da aula"],
  "blocos": [{"t": "título", "html": "<p>…</p>"}],
  "widget": "parear", "parear": [["termo", "definição"]],
  "quiz": [{"q": "…", "o": ["A", "B", "C", "D"], "a": 0, "e": "explicação"}],
  "feynman": {"pergunta": "…", "chaves": ["palavra"]},
  "fontes": ["…"],
  "fonte": {"doc": "id-do-pdf", "pi": 3, "pf": 5}
}
```
Widgets prontos: `parear`, `ordenar` (com `ordenar: [...]` na ordem certa), `tabelaVerdade`, `costas`, `potencial`, `esquecimento`, `piano` (`pianoModo`: escala, triades, progressoes, acordes), `sequenciador`, `acordes`, `metronomo` e `soletrar`.

## Ideias para o futuro
- Modelo local via Ollama, como alternativa à API.
- Ler EPUB, DOCX e vídeos do YouTube (transcrição).
- Otimizar os pesos do FSRS com o seu próprio histórico.
- Questões no estilo da banca, geradas a partir de provas anteriores em PDF.
