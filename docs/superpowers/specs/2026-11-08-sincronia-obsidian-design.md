# Sincronia com o Obsidian (modo local)

## Por quê
A Vitória estuda no notebook e no PC. O código vai pelo Git (ela cuida disso). O **conteúdo e o progresso** (estudo, PDFs importados, prepara.ai, foco) precisam ir de um aparelho para o outro **sem ela lembrar de nada**. O cofre `ESTUDOS` já tem o Obsidian Sync ligado nos dois aparelhos: usamos esse caminho.

## Decisões dela
- Só conteúdo e progresso. Código continua no Git, manual.
- O último passo depois de salvar é sincronizar com o Obsidian, sem depender de ela lembrar.
- Ao abrir no outro aparelho, o app verifica a nota do Obsidian e **pergunta** se sincroniza.
- A pasta `estudaai/` sai do Obsidian Sync (código só no Git), nos dois aparelhos.

## Como funciona
- Pasta no cofre: `<cofre>/estudaai-sync/` (fora de `estudaai/`, que fica excluída do Sync).
- **Uma nota por aparelho**: `estudaai-sync/<aparelho>.md`. Cada aparelho só escreve a sua, então o Obsidian Sync nunca precisa juntar duas edições do mesmo arquivo.
  - Frontmatter (`aparelho`, `atualizado`, `app`), tabela de totais, **histórico** do que mudou ("+15 revisões de cartão, +1 PDF") e, no fim, um bloco ```json com `{estado, biblioteca}`.
- Arquivos dos PDFs: `estudaai-sync/arquivos/<id>.pdf` (o Sync leva PDF por padrão) e o pacote como `<id>.json.md` (`.json` solto não sincroniza por padrão). Os nomes são únicos e imutáveis: só copia o que falta.
- **Salvar (automático):** o servidor exporta ~2 s depois de cada gravação do estado ou da biblioteca, e só reescreve a nota se os dados mudaram. Na saída da aba, o app manda um `sendBeacon` para exportar na hora. Chip no topo: "Obsidian ✓ 14:32" (clique força a sincronia).
- **Abrir:** ao iniciar (e ao voltar para a aba), o app lê as notas dos outros aparelhos. Se uma é mais nova que a última vista e juntar mudaria algo, abre um modal: "Tem progresso do <aparelho> (data): <resumo>. Sincronizar?". Juntar não muda nada → marca como vista em silêncio.
- **Juntar (nunca apaga):** cartões e tópicos → vale o registro com mais revisões (`n`), depois a data mais recente; dias → maior pontuação; listas → união por `id`/`ini`/`nome`; demais valores → do lado mais novo (`_t`). Biblioteca → união de docs, temas e anexos por id.
- Cofre: `cofre_obsidian` em `dados/config.json` (ou `"nao"` para desligar); senão, a primeira pasta acima de `dados/` que tenha `.obsidian`. Sem cofre, nada aparece.

## Atualização (08/11/2026): Google Drive primeiro
Ela não tem Obsidian Sync (é pago) e não quer assinar. A base passa a ser o **Google Drive para computador** (`G:\Meu Drive\estudaai-sync`), achado sozinho; o cofre do Obsidian fica como alternativa. Para ler o histórico no Obsidian, `ESTUDOS/estudaai-sync` é uma junção (`mklink /J`) para a pasta do Drive. A exclusão da pasta `estudaai/` do Obsidian Sync deixa de ser necessária.

## Fora do escopo
Modo nuvem (já sincroniza) e modo arquivo (não grava em disco). Sincronizar código.
