# Sincronia do progresso pelo Git (substitui a pasta do Google Drive)

Aprovado em 10/11/2026. Substitui `2026-11-08-sincronia-obsidian-design.md`.

## Por quê

O progresso tem que ficar igual no notebook e no PC sem nenhuma ação: sem script, sem lembrar, sem conferir
antes de fechar. Grátis. A sincronia pela pasta do Drive dependia de um clique em "Sincronizar?" e de um
verificador manual.

## Diagnóstico que originou a mudança (10/11/2026)

O "0 dias seguidos" não era o transporte (o Drive tinha entregado tudo) nem a junção de `dias` (a união estava
certa). Eram duas coisas:

1. **Regra de contagem:** a sequência era contada a partir de hoje; antes do primeiro estudo do dia, mostrava 0.
2. **Junção manual:** só acontecia depois do clique em "Sincronizar?"; até lá cada aparelho mostrava o seu número.

A junção de 2 vias também perdia dados fora de `dias`: um campo simples alterado no aparelho que salvou antes era
sobrescrito pelo valor velho do que salvou depois, e itens apagados voltavam.

## Objetivos

- Puxar ao abrir e ao voltar à aba; enviar sozinho depois de salvar, ao fechar a aba e ao encerrar o servidor.
- Nunca perder progresso: mudanças dos dois aparelhos são juntadas, nunca sobrescritas.
- Conflito de merge do Git não pode existir, nem parar o app, nem pedir nada a ela.
- Sem internet o app funciona igual e envia depois.
- Dados pessoais nunca no repositório do código.
- Migrar o que está na pasta do Drive sem apagar nada.

## Fora do escopo

- Modo arquivo e modo nuvem: não mudam.
- Sincronizar chaves de IA (`dados/config.json` continua local).
- Compactar o histórico do repositório de dados.

## Desenho

- **Onde:** repositório privado `estudaai-dados` no GitHub dela, clonado em `dados/sync` (`dados/` já está fora
  do git do código). Configurado uma vez por aparelho por `configurar_sincronia.py`.
- **Formato:** JSON, um arquivo por aparelho (`<aparelho>.json`), chaves ordenadas e indentado; PDFs e pacotes em
  `arquivos/` (nomes únicos, conteúdo imutável). Acima de 50 MB o arquivo fica só local.
- **O Git só transporta.** Como cada aparelho só escreve o próprio arquivo, o clone é sempre reconstruível a
  partir de `dados/` + remoto. O ciclo é: `fetch` → `reset --hard origin/main` → trazer arquivos → regravar o meu
  arquivo → commit → push. Não há merge nem rebase. Push recusado por corrida refaz o ciclo (até 3 vezes).
- **Quem junta é o app**, em 3 vias. Base = a última versão do outro aparelho que este já juntou
  (`dados/sinc-base/<aparelho>.json`, gravada em `POST /api/sinc/visto`).
  - só um lado mudou um campo → vale a mudança; os dois → lado com `_t` maior;
  - item ou chave apagado de um lado e intacto do outro → sai; apagado de um lado e editado do outro → fica;
  - `top`, `cards` e `dias` nunca são apagados (maior `n`/`ultima`; máximo por dia).
- **Guardas contra apagar por engano:** a base é ignorada (junção de 2 vias, que só une) quando não existe, quando
  o outro aparelho foi reinstalado (`instalacao` diferente) ou quando o `_t` dele é menor que o da base. Estado
  vazio nunca é exportado.
- **Dias seguidos:** `SINC.sequencia`; se hoje ainda não tem estudo, conta a partir de ontem.

## Riscos aceitos

- Aparelho desligado menos de ~30 s depois da última mudança: envia na próxima abertura.
- Login do GitHub expirado: o envio falha, o chip mostra "envio pendente", o app segue.
- Histórico cresce (dezenas de commits pequenos por dia).
- Relógios diferentes entre os aparelhos só afetam o desempate quando os dois mudam o mesmo campo.
- Restaurar um backup antigo em **Progresso** num aparelho pode propagar como "apagado" itens de listas criados
  depois do backup (não afeta `top`, `cards`, `dias`). O histórico do repositório de dados guarda todas as versões.

## Testes

- `testes/sincronia.test.js`: junção de 2 e 3 vias e dias seguidos.
- `testes/test_sincronia.py`: ciclo com um remoto local (envio, recebimento, corrida, sem internet, clone
  bagunçado, arquivo grande), base, migração da pasta antiga e rotas `/api/sinc*`.
