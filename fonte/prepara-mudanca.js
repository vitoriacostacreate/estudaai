/* ============ prepara.ai: conteúdo do plano "Em 08/02/2027 no avião ou pousando lá fora" ============
   Informações conferidas em 06/11/2026 (fontes no fim). Regras de imigração mudam: a tela sempre manda conferir no site oficial.
   Tipos de tarefa em "faca": check | texto | numero | escolha (opcoes: [[valor, rótulo]]) | rota (escolhe uma de "rotas") | longo | widget (bens, matriz, marcos, gonogo).
   Cada imersão: mapa (o todo antes do detalhe), minimo (versão de dia ruim, ~10 min), recupere (1 pergunta no meio: p, op, c = índice certo, por), entenda, faca, saida.
   rotas[].comprova: [valor, moeda] = comprovação financeira mínima exigida pelo governo (sem custo de vida). */
const PREPARA = {
  meta: { data: "2027-02-08", dataBR: "08/02/2027", verificado: "2026-11-06", verificadoBR: "06/11/2026", cor: "#5cc8f5" },

  pergunta: {
    original: "Como eu saio do Brasil e começo do zero lá fora, com pouco dinheiro, até fevereiro?",
    texto: "Qual rota LEGAL e de custo baixíssimo me coloca no avião em 08/02/2027 com trabalho já previsto e um caminho de carreira em TI para crescer lá, e qual é o plano B se ela não fechar?",
    porque: [
      "<b>Legal</b>: ousadia no destino, segurança no documento. Sair como turista para trabalhar dá deportação e proibição de voltar.",
      "<b>Custo baixíssimo</b>: cada real conta. Rota sem comprovação alta vence rota famosa. Primeiro o número, depois o país.",
      "<b>Trabalho previsto</b>: você não embarca para procurar emprego, embarca com renda fechada (vaga remota, vaga local ou freelas).",
      "<b>Carreira</b>: o primeiro país pode ser uma ponte. O que importa é sair com experiência internacional em TI e um segundo passo.",
      "<b>Plano B</b>: se a rota A travar, troca de rota, não de data. Adiar só se faltar um critério crítico."
    ]
  },

  /* A estratégia fora do comum, mostrada no topo da aba como um mapa de 3 passos. */
  estrategia: {
    titulo: "Ponte barata + carreira",
    lema: "Meter o louco no destino, nunca no documento.",
    passos: [
      { t: "Pousar barato", d: "Um país do Mercosul: o documento sai só com a nacionalidade, pedido lá, sem comprovação alta. Paraguai e Argentina são os mais baratos de chegar." },
      { t: "Levar o trabalho na mala", d: "Antes de embarcar, fechar a renda: vaga remota em QA ou suporte, vaga local em empresa de TI do destino ou um pacote de freelas." },
      { t: "Trampolim", d: "Com 1 a 2 anos de experiência internacional e espanhol, pular para Europa ou Japão por contrato com visto ou Working Holiday (até 30 anos)." }
    ]
  },

  imersoes: [
    {
      id: "diagnostico", n: 1, titulo: "Diagnóstico: de onde eu parto", tempo: "40 min",
      objetivo: "Levantar os dados que abrem ou fecham portas. Sem eles, qualquer lista de países é chute.",
      mapa: ["Idade","Passaporte","Ascendência","Idiomas","Renda remota","Concurso"],
      minimo: "Responda só idade, passaporte e o que o concurso é no plano.",
      recupere: {"p":"Qual destas respostas fecha de uma vez todos os Working Holiday?","op":["Inglês intermediário","Não ter renda remota","Morar em Campo Grande","Ter 31 anos na data do pedido"],"c":3,"por":"Os Working Holiday para brasileiros aceitam só de 18 a 30 anos. Idioma e renda pesam, mas não eliminam."},
      entenda: [
        { t: "Por que começar por você, e não pelo país", html: "<p>Os programas mais baratos têm <b>idade máxima</b> (Working Holiday: 18 a 30 anos). A rota mais fácil da Europa é a <b>cidadania por descendência</b>. O idioma decide onde você consegue o primeiro emprego. São quatro variáveis que mudam o mapa inteiro:</p><ul><li><b>Idade</b>: abre ou fecha os Working Holiday.</li><li><b>Passaporte</b>: sem ele quase nada anda (exceto Mercosul).</li><li><b>Ascendência europeia</b>: pode valer mais que qualquer visto.</li><li><b>Dinheiro líquido</b>: o mínimo exigido muda de R$ 1 mil a mais de R$ 60 mil.</li></ul>" },
        { t: "O conflito de datas", html: "<p>A prova da UFMS é em <b>17/01/2027</b>, em Campo Grande. A meta é estar no avião em <b>08/02/2027</b>. Se você passar, a posse é aqui. Decida agora o que o concurso é no seu plano, para não dividir a energia sem perceber.</p>" }
      ],
      faca: [
        { id: "idade", tipo: "numero", rotulo: "Sua idade hoje", dica: "Working Holiday aceita 18 a 30 anos na data do pedido." },
        { id: "passaporte", tipo: "escolha", rotulo: "Passaporte", opcoes: [["valido", "Tenho, válido por mais de 1 ano"], ["vencido", "Tenho, mas vencido ou vencendo"], ["nao", "Não tenho"]] },
        { id: "ascendencia", tipo: "escolha", rotulo: "Tem pai, mãe, avós ou bisavós europeus?", opcoes: [["sim", "Sim, sei de quem"], ["talvez", "Talvez, preciso perguntar à família"], ["nao", "Não"]], dica: "Italiana, portuguesa, espanhola, alemã, polonesa... Cidadania leva meses ou anos, mas muda tudo no longo prazo." },
        { id: "ingles", tipo: "escolha", rotulo: "Inglês", opcoes: [["basico", "Básico"], ["inter", "Intermediário"], ["avanc", "Avançado"]] },
        { id: "espanhol", tipo: "escolha", rotulo: "Espanhol", opcoes: [["nada", "Não sei"], ["entendo", "Entendo, mas não falo"], ["conversa", "Consigo conversar"]] },
        { id: "formacao", tipo: "texto", rotulo: "Formação e experiência que posso provar com papel", dica: "Ex.: ADS (concluído?), QA em X projetos, suporte. Diploma e carteira/contratos contam muito em visto de trabalho." },
        { id: "renda_remota", tipo: "escolha", rotulo: "Renda remota (em dólar ou não)", opcoes: [["tenho", "Já tenho"], ["buscando", "Estou buscando"], ["nao", "Não tenho"]], dica: "Renda que vai junto na mala é o maior redutor de risco de qualquer rota." },
        { id: "aluguel", tipo: "texto", rotulo: "Contrato do apartamento: prazo de aviso e multa", dica: "Leia a cláusula de rescisão. Só avise o locador DEPOIS de escolher a rota (marco de 10/12)." },
        { id: "carreira_alvo", tipo: "escolha", rotulo: "Que trabalho eu quero ter previsto ao embarcar", opcoes: [["qa", "QA / testes"], ["suporte", "Suporte técnico"], ["web", "Dev web"], ["ia", "IA e dados"], ["qualquer", "Qualquer legal enquanto me estabeleço"]], dica: "É o trabalho da ponte. A carreira dos sonhos pode ser o passo 3." },
        { id: "concurso", tipo: "escolha", rotulo: "O concurso UFMS no meu plano", opcoes: [["faco", "Faço a prova em 17/01 e decido depois do resultado"], ["faco_saio", "Faço a prova, mas a mudança vem primeiro"], ["largo", "Paro o concurso e foco 100% na mudança"]] },
        { id: "idioma_alvo", tipo: "escolha", rotulo: "Preferência de idioma do país", opcoes: [["en", "Inglês"], ["es", "Espanhol"], ["qualquer", "Qualquer um, se a rota for boa"]] }
      ],
      saida: "Um retrato seu em 10 respostas. A tela inicial do prepara.ai passa a mostrar quais rotas combinam com sua idade."
    },
    {
      id: "burocracia", n: 2, titulo: "Burocracia 101: as palavras e os papéis", tempo: "45 min",
      objetivo: "Entender o que cada documento faz e já colocar o passaporte em andamento (é o item que mais trava o resto).",
      mapa: ["Passaporte","Visto","Residência","Trabalho","Papéis-base","Fronteira"],
      minimo: "Preencha o formulário da PF e pague a GRU. O resto espera.",
      recupere: {"p":"Brasileiro entra sem visto como turista em vários países. Isso dá direito a quê?","op":["Morar até 6 meses","Trabalhar meio período","Só visitar: morar e trabalhar pedem autorização própria","Pedir residência em qualquer país depois"],"c":2,"por":"Turista não mora nem trabalha. Residência e trabalho são autorizações separadas, dadas pelo outro país."},
      entenda: [
        { t: "Quatro palavras que não são sinônimos", html: "<table><tr><th>Palavra</th><th>Quem dá</th><th>O que permite</th></tr><tr><td><b>Passaporte</b></td><td>Brasil (Polícia Federal)</td><td>Provar quem você é lá fora. Não dá direito a nada sozinho.</td></tr><tr><td><b>Visto</b></td><td>O outro país (consulado)</td><td>Entrar com um propósito: turismo, estudo, trabalho.</td></tr><tr><td><b>Autorização de residência</b></td><td>O outro país (imigração)</td><td>Morar por um tempo definido.</td></tr><tr><td><b>Autorização de trabalho</b></td><td>O outro país</td><td>Trabalhar. Turista nunca tem.</td></tr></table><p>Brasileiro entra sem visto como turista em muitos países. Isso <b>não</b> é morar nem trabalhar.</p>" },
        { t: "Passaporte, passo a passo", html: "<ol><li>Formulário no site da Polícia Federal.</li><li>Pagar a GRU: <b>R$ 257,25</b> (taxa comum em 2026). Urgência: R$ 334,42, só com comprovação. Perda do anterior: R$ 514,50.</li><li>Agendar atendimento num posto da PF (Campo Grande tem).</li><li>Ir com RG, CPF regular e quitação eleitoral. Foto e digitais são feitas lá.</li><li>Retirar quando ficar pronto. <b>Não retirou em 90 dias, perde a taxa.</b></li></ol><p>Validade: 10 anos para adultos. A PF propôs reajuste da taxa: se a GRU vencer, gere outra.</p>" },
        { t: "Os papéis que quase toda rota pede", html: "<ul><li><b>Antecedentes criminais</b>: certidão da PF, online e gratuita.</li><li><b>Diploma e histórico</b> com <b>apostila de Haia</b> (cartório) e, às vezes, tradução juramentada.</li><li><b>Comprovação financeira</b>: extrato no seu nome. Cartão de crédito não vale.</li><li><b>Seguro saúde</b> válido no destino, para todo o período.</li><li><b>Passagem de volta</b> ou dinheiro para comprá-la.</li></ul>" },
        { t: "Na fronteira", html: "<p>Quem decide se você entra é o agente, na hora. Leve tudo <b>impresso</b> (reserva de hospedagem, seguro, extrato, carta da escola ou do visto). Diga a verdade: mentir sobre o motivo da viagem dá proibição de entrada.</p>" }
      ],
      faca: [
        { id: "pp_form", tipo: "check", rotulo: "Preenchi o formulário do passaporte no site da PF" },
        { id: "pp_gru", tipo: "check", rotulo: "Paguei a GRU (R$ 257,25)" },
        { id: "pp_agenda", tipo: "texto", rotulo: "Data agendada na PF", dica: "Se não houver vaga próxima, olhe outros postos e volte ao site todo dia: vagas reabrem." },
        { id: "antecedentes", tipo: "check", rotulo: "Emiti a certidão de antecedentes criminais da PF" },
        { id: "diploma", tipo: "check", rotulo: "Separei diploma e histórico (ou declaração de conclusão)" },
        { id: "apostila", tipo: "texto", rotulo: "Preço da apostila de Haia num cartório de Campo Grande", dica: "Ligue ou veja o site do cartório. Só apostile depois de saber se a rota pede." }
      ],
      saida: "Passaporte em andamento e uma pasta (física e no Drive) com os documentos-base."
    },
    {
      id: "caminhos", n: 3, titulo: "Mapa dos caminhos", tempo: "90 min",
      objetivo: "Conhecer todas as rotas reais para brasileiros em 2026/2027, eliminar as que não cabem e dar nota às que sobram.",
      mapa: ["Como ler os cartões","O que não é caminho","10 rotas","Matriz com pesos","Rota A e B"],
      minimo: "Dê nota só às 3 rotas de que você mais gostou.",
      recupere: {"p":"Qual rota cabe até 08/02 só com a nacionalidade brasileira?","op":["Working Holiday Canadá","Mercosul (Argentina, Uruguai, Paraguai)","Portugal: entrar como turista e regularizar lá","Work and Holiday Austrália"],"c":1,"por":"Canadá não tem acordo com o Brasil, Portugal acabou com essa via em 2025 e a Austrália está pausada para o Brasil."},
      entenda: [
        { t: "Como ler os cartões", html: "<p>Cada rota tem o requisito que mais pesa, o custo mínimo exigido, o prazo e se <b>cabe até 08/02</b>. Verde: cabe se você agir agora. Laranja: depende de algo que você não controla. Vermelho: não cabe nesta janela, mas pode entrar no plano C.</p>" },
        { t: "O que NÃO é caminho (2026)", html: "<ul><li><b>Portugal como turista e regularizar lá</b>: acabou com a Lei 61/2025 (em vigor desde 23/10/2025). O visto de procura de trabalho foi suspenso. O substituto, “procura de trabalho qualificado”, ainda aguardava regulamentação em julho de 2026.</li><li><b>Working Holiday no Canadá</b>: o Brasil não tem acordo. Quem vende isso está vendendo outra coisa.</li><li><b>Working Holiday na Irlanda</b>: o Brasil não aparece na lista oficial de países do programa. Alguns blogs dizem o contrário: confira no irishimmigration.ie antes de acreditar.</li><li><b>Worldpackers e Workaway</b>: são turismo com troca de hospedagem. Não dão permissão de trabalho e alguns países tratam a troca como trabalho.</li><li><b>Entrar como turista para trabalhar</b>: irregular em qualquer país.</li></ul>" },
        { t: "A estratégia: ponte barata + carreira", html: "<p>O caminho comum é escolher o país dos sonhos e juntar dinheiro por anos. O seu é outro: <b>pousar onde o documento é garantido e barato</b> (Mercosul), <b>com o trabalho já fechado</b>, e usar 1 a 2 anos lá como ponte de carreira.</p><ul><li><b>Paraguai</b>: o mais perto de Campo Grande e de custo de vida baixo.</li><li><b>Argentina</b>: residência online (RaDEX), mercado de TI grande.</li><li><b>Uruguai</b>: polo de software forte, mas custo de vida alto para a região.</li></ul><p>Working Holiday e estudo continuam no mapa como aposta ou como passo 3.</p>" }
      ],
      faca: [
        { id: "rotas_lidas", tipo: "check", rotulo: "Li todos os cartões de rota" },
        { id: "rotas_eliminadas", tipo: "texto", rotulo: "Rotas que eliminei e por quê", dica: "Ex.: Austrália (pausada), NZ (só em out/2027)." },
        { id: "matriz", tipo: "widget", widget: "matriz", rotulo: "Dei nota às rotas que sobraram" },
        { id: "rota_a", tipo: "rota", rotulo: "Rota A (a que vou perseguir)", dica: "Pela matriz, a primeira do ranking costuma ser a A. Você decide." },
        { id: "rota_b", tipo: "rota", rotulo: "Rota B (se a A não fechar até o marco)", dica: "De preferência uma rota verde (cabe até 08/02) e que não dependa de vaga." }
      ],
      saida: "Ranking das rotas pela sua matriz, rota A e rota B escritas."
    },
    {
      id: "carreira", n: 4, titulo: "Trabalho previsto antes do embarque", tempo: "60 min",
      objetivo: "Sair do Brasil com renda fechada e um plano de carreira, e não com a esperança de achar emprego lá.",
      mapa: ["3 tipos de trabalho previsto", "Onde buscar", "Funil semanal", "Trampolim"],
      minimo: "Mande 3 candidaturas hoje.",
      recupere: { p: "Qual destes conta como trabalho previsto no Go/No-Go?", op: ["Ter mandado 100 currículos", "Ter um perfil bom no LinkedIn", "Oferta assinada, contrato remoto ou freelas fechados para 60 dias", "Uma entrevista marcada"], c: 2, por: "Só conta o que já é renda garantida. Currículo, perfil e entrevista são o caminho até lá, não o resultado." },
      entenda: [
        { t: "Três jeitos de ter trabalho previsto", html: "<table><tr><th>Tipo</th><th>Como é</th><th>Atenção</th></tr><tr><td><b>Remoto</b></td><td>Empresa de qualquer país, você trabalha de onde estiver.</td><td>Leia o contrato: algumas vagas remotas exigem morar no Brasil.</td></tr><tr><td><b>Local</b></td><td>Empresa de TI no país de destino contrata você.</td><td>Com residência Mercosul você pode trabalhar; confira o prazo do documento.</td></tr><tr><td><b>Freelas</b></td><td>Testes, QA e suporte por projeto.</td><td>Feche os primeiros clientes antes de sair. Renda que oscila pede colchão maior.</td></tr></table>" },
        { t: "Onde buscar", html: "<ul><li><b>LinkedIn</b> com a localização já no destino (ex.: Buenos Aires, Assunção, Montevidéu) e o título em inglês e espanhol.</li><li><b>Sites de vagas da América Latina</b> (como o Computrabajo) e as páginas de carreira das empresas de software do destino.</li><li><b>Vagas remotas</b>: Remote OK e We Work Remotely, filtrando por QA, suporte e América Latina.</li><li><b>Freelas</b>: Upwork e comunidades de QA.</li></ul><p>Sites e empresas mudam: confira se a vaga é real antes de mandar documentos (imersão 8).</p>" },
        { t: "O funil da semana", html: "<p>Trabalho previsto é um número, não sorte. Meta sugerida: <b>5 candidaturas por dia útil</b>, em lotes curtos. Toda sexta, anote quantas foram, quantas responderam e quantas viraram entrevista. Se ninguém responde, troque o currículo, não a meta.</p>" },
        { t: "O trampolim", html: "<p>A ponte não é o fim. Escreva já para onde você quer pular depois de 1 a 2 anos e o que precisa juntar até lá: experiência, idioma, dinheiro, idade (Working Holiday vai só até 30).</p>" }
      ],
      faca: [
        { id: "cv_idiomas", tipo: "check", rotulo: "Currículo pronto em inglês e em espanhol (1 página)" },
        { id: "linkedin_local", tipo: "check", rotulo: "LinkedIn com a localização no destino e o título em inglês" },
        { id: "trab_tipo", tipo: "escolha", rotulo: "O trabalho que vou levar na mala", opcoes: [["remoto", "Vaga remota"], ["local", "Vaga local no destino"], ["freela", "Freelas"], ["misto", "Misto"]] },
        { id: "cand_semana", tipo: "numero", rotulo: "Candidaturas enviadas nesta semana", dica: "Atualize toda sexta. Meta: 25." },
        { id: "pitch", tipo: "longo", rotulo: "Meu pitch em 3 frases (quem sou, o que testo ou resolvo, por que me mudo)" },
        { id: "trampolim", tipo: "texto", rotulo: "Trampolim: para onde quero pular em 1 a 2 anos" }
      ],
      saida: "Currículo nos dois idiomas, funil rodando toda semana e o tipo de trabalho que vai junto na mala."
    },
    {
      id: "dinheiro", n: 5, titulo: "Dinheiro: quanto eu terei no embarque", tempo: "60 min",
      objetivo: "Transformar bens, salário e dívida em um número só: o capital líquido no dia da partida.",
      mapa: ["Comprovação","Custo de saída","Colchão","Dívida","Bens","Capital líquido"],
      minimo: "Liste 5 itens para vender, com preço.",
      recupere: {"p":"Na conta da mudança, a comprovação financeira é:","op":["O preço da passagem de ida","O limite do cartão de crédito","Dinheiro que você mostra no extrato, sem precisar gastar","O custo dos primeiros 3 meses"],"c":2,"por":"Comprovação é o valor que o governo quer ver na conta. Cartão não vale. Passagem e colchão são outros números da conta."},
      entenda: [
        { t: "Três números diferentes", html: "<ol><li><b>Comprovação financeira</b>: o que o governo quer ver no extrato (ex.: Irlanda pede € 833 por mês de estadia). Você não gasta, só mostra.</li><li><b>Custo de saída</b>: passaporte, documentos, seguro, passagem, primeira hospedagem.</li><li><b>Colchão de chegada</b>: 3 meses de custo de vida no destino + uma passagem de volta guardada.</li></ol><p>Passagem barata não é mudança viável. A conta que importa: <b>capital líquido ≥ comprovação + custo de saída + colchão</b>.</p>" },
        { t: "Custo baixíssimo, sem gambiarra", html: "<ul><li><b>Rota sem comprovação alta</b>: no Mercosul, o maior gasto é chegar e se manter, não mostrar extrato.</li><li><b>Chegar por terra</b> também vale: para Paraguai e Argentina, compare ônibus e voo. Brasileiro entra nos países do Mercosul com RG em bom estado (confira a regra da companhia).</li><li><b>Passagem</b>: ligue o alerta de preço em dezembro. Na rota Mercosul o documento é garantido, então dá para comprar mais cedo (marco de 10/01).</li><li><b>Primeiras semanas</b>: quarto em casa compartilhada ou pensão, pago por plataforma com proteção, nunca por transferência a desconhecido.</li></ul>" },
        { t: "A dívida do cartão", html: "<p>Cartão no rotativo é a dívida mais cara que existe no Brasil. Prioridade: quitar ou negociar <b>antes</b> de sair. Nome negativado dificulta conta, cartão e uma eventual volta. Isto é orientação geral, não consultoria financeira.</p>" },
        { t: "Vender bens sem perder dinheiro", html: "<ul><li>Liste tudo agora, com preço de mercado (veja anúncios iguais).</li><li>Venda primeiro o que você não usa; o que usa todo dia (cama, notebook) fica para janeiro.</li><li>Conte só 70% do valor estimado no plano: desconto e itens encalhados são normais.</li></ul>" }
      ],
      faca: [
        { id: "din_hoje", tipo: "numero", rotulo: "Dinheiro guardado hoje (R$)" },
        { id: "din_mes", tipo: "numero", rotulo: "Quanto consigo guardar por mês (R$)" },
        { id: "din_meses", tipo: "numero", rotulo: "Meses até a partida", dica: "De novembro a janeiro são 3." },
        { id: "din_divida", tipo: "numero", rotulo: "Dívidas a quitar antes de sair (R$)" },
        { id: "din_contas", tipo: "numero", rotulo: "Contas até sair: aluguel, multa, contas finais (R$)" },
        { id: "din_saida", tipo: "numero", rotulo: "Custo de saída estimado (R$)", dica: "Passaporte + documentos + seguro + passagem de ida + 2 semanas de hospedagem." },
        { id: "cot_eur", tipo: "numero", rotulo: "Cotação do euro hoje (R$ por € 1)", dica: "Veja no Google ou no app do banco (\"euro hoje\"). Use o valor de venda." },
        { id: "cot_usd", tipo: "numero", rotulo: "Cotação do dólar hoje (R$ por US$ 1)" },
        { id: "din_meta", tipo: "numero", rotulo: "Meta da rota A em reais (R$)", dica: "Comprovação exigida + colchão de 3 meses + passagem de volta. O botão abaixo preenche a comprovação mínima da rota A; some o colchão e a volta." },
        { id: "bens", tipo: "widget", widget: "bens", rotulo: "Inventário dos bens para vender e o resultado" },
      ],
      saida: "Seu capital líquido no embarque e quanto falta para a meta da rota A."
    },
    {
      id: "cronograma", n: 6, titulo: "Cronograma reverso até 08/02", tempo: "30 min",
      objetivo: "Trabalhar de trás para frente: cada marco tem uma data-limite e uma decisão.",
      mapa: ["Data final","Caminho crítico","11 marcos","4 decisões","Agenda"],
      minimo: "Coloque só os 4 marcos de decisão na agenda.",
      recupere: {"p":"Qual destas ações só pode vir DEPOIS de escolher a rota?","op":["Pedir o passaporte","Avisar o locador","Listar os bens","Emitir antecedentes criminais"],"c":1,"por":"Avisar o locador não tem volta. Passaporte, lista de bens e antecedentes servem para qualquer rota."},
      entenda: [
        { t: "Planejamento reverso", html: "<p>Comece pela data final e pergunte: <i>o que precisa estar pronto antes disso?</i> Repita até chegar em hoje. Os marcos com <b>decisão</b> são pontos de Go/No-Go: se não estiver pronto, você troca de rota ou adia, em vez de empurrar o problema.</p>" },
        { t: "O caminho crítico", html: "<p>São as tarefas que atrasam tudo se atrasarem: <b>passaporte → visto/autorização → passagem</b>. Dinheiro e venda de bens rodam em paralelo. Nada que não tem volta (avisar o locador, comprar passagem) antes do marco que o libera.</p>" }
      ],
      faca: [
        { id: "marcos", tipo: "widget", widget: "marcos", rotulo: "Revisei os marcos e marquei os que já fiz" },
        { id: "agenda", tipo: "check", rotulo: "Coloquei os marcos de decisão na minha agenda" }
      ],
      saida: "Um calendário com 11 marcos e 4 pontos de decisão."
    },
    {
      id: "decisao", n: 7, titulo: "Go/No-Go e planos A, B e C", tempo: "30 min",
      objetivo: "Definir ANTES, com a cabeça fria, quais condições precisam estar cumpridas para comprar a passagem.",
      mapa: ["Regras antes","7 críticos","Plano A","Plano B","Plano C"],
      minimo: "Escreva só o gatilho que faz você trocar para o plano B.",
      recupere: {"p":"Em 25/01, o passaporte ainda não chegou. O que o Go/No-Go manda fazer?","op":["Comprar a passagem e torcer","No-Go: trocar para o plano B ou C","Ir como turista e regularizar lá","Adiar sem data"],"c":1,"por":"Passaporte é critério crítico. Faltou um crítico, é No-Go. Adiar vale, mas com data (plano C)."},
      entenda: [
        { t: "Por que decidir as regras antes", html: "<p>Perto da data, a vontade de ir faz tudo parecer resolvido. Critérios escritos antes protegem você de embarcar sem documento ou sem colchão. Se um crítico estiver faltando em 25/01, a resposta é <b>No-Go</b>: troca para o plano B ou C.</p>" },
        { t: "Os três planos", html: "<ul><li><b>A</b>: a rota principal, saindo até 08/02.</li><li><b>B</b>: outra rota que cabe na mesma data (ex.: outro país do Mercosul, ou o mesmo país com trabalho local em vez de remoto).</li><li><b>C</b>: adiar com data definida (ex.: julho de 2027), guardando dinheiro e mirando a próxima janela (PVT, NZ em outubro). Adiar não é desistir.</li></ul>" }
      ],
      faca: [
        { id: "gonogo", tipo: "widget", widget: "gonogo", rotulo: "Passei pelos critérios de Go/No-Go" },
        { id: "plano_a", tipo: "longo", rotulo: "Plano A: rota, destino, data e o que precisa acontecer" },
        { id: "plano_b", tipo: "longo", rotulo: "Plano B e o gatilho que me faz trocar para ele" },
        { id: "plano_c", tipo: "longo", rotulo: "Plano C: nova data e o que faço até lá" }
      ],
      saida: "Planos A, B e C escritos e uma regra clara para comprar (ou não) a passagem."
    },
    {
      id: "fontes", n: 8, titulo: "Crivo de fontes e golpes", tempo: "20 min",
      objetivo: "Saber em quem confiar quando os conteúdos se contradizem (e eles vão se contradizer).",
      mapa: ["Escada da confiança","Viés de sobrevivência","Sinais de golpe","Fonte oficial"],
      minimo: "Abra só o site oficial da sua rota A.",
      recupere: {"p":"Um vídeo antigo diz: “entra em Portugal como turista e regulariza lá”. O que você faz?","op":["Confia, porque tem muitas visualizações","Pergunta nos comentários","Confere no site oficial: essa via acabou com a Lei 61/2025","Paga uma consultoria para garantir"],"c":2,"por":"A regra está no site do governo. Relato antigo e popular não muda a lei."},
      entenda: [
        { t: "A escada da confiança", html: "<ol><li><b>Site oficial do governo do destino</b>: é a regra.</li><li><b>Consulado/embaixada</b>: como pedir, aqui do Brasil.</li><li><b>Advogado ou consultoria</b>: útil, mas vende serviço.</li><li><b>Blog de agência</b>: vende curso ou intercâmbio; números costumam ser otimistas.</li><li><b>YouTube, Reddit, grupos</b>: mostram a vida real, não a regra. Ótimo para custos do dia a dia e erros comuns.</li></ol><p>Desconfie de relato antigo: a lei de Portugal, por exemplo, mudou em 2025. Relato de quem “deu certo” sofre <b>viés de sobrevivência</b>: quem voltou quebrado raramente grava vídeo.</p>" },
        { t: "Sinais de golpe", html: "<ul><li>“Vaga garantida” ou “acesso antecipado” a visto (o Working Holiday do Japão é gratuito e não tem intermediário oficial).</li><li>Empresa que cobra para te contratar.</li><li>Pagar aluguel antes de ver o imóvel ou por transferência para pessoa física desconhecida.</li><li>“Vai de turista e resolve lá”.</li></ul>" },
        { t: "Sobre o canal Vida Infinda", html: "<p>Não encontrei um canal com esse nome exato. Existe o <b>Via Infinda</b>, de viagem. Seja qual for, use os relatos como inspiração e pistas, e confira cada regra no site oficial antes de agir.</p>" }
      ],
      faca: [
        { id: "canais", tipo: "texto", rotulo: "Canais e comunidades que vou acompanhar (e por quê)" },
        { id: "fonte_oficial", tipo: "check", rotulo: "Abri o site oficial da minha rota A e conferi os requisitos" }
      ],
      saida: "Uma lista curta de fontes confiáveis e o hábito de checar na fonte oficial."
    }
  ],

  /* Rotas. cabe: sim | talvez | nao (até 08/02/2027). */
  rotas: [
    { id: "paraguai", nome: "Mercosul: Paraguai (Assunção)", grupo: "Residência por acordo", cabe: "sim", idioma: "Espanhol (e guarani)",
      req: "Só a nacionalidade. Residência temporária Mercosul de 2 anos, pedida na Migraciones. Pede RG ou passaporte, certidão de nascimento e antecedentes (com apostila).",
      custo: "Taxas e renda mínima: fontes não oficiais divergem. Confira em migraciones.gov.py antes de contar no plano.",
      prazo: "Semanas. Dá para entrar e pedir no país.", obs: "O mais perto de Campo Grande, por terra ou voo curto. Custo de vida baixo: combina com renda remota em dólar." },
    { id: "argentina", nome: "Mercosul: Argentina (Buenos Aires ou Córdoba)", grupo: "Residência por acordo", cabe: "sim", idioma: "Espanhol",
      req: "Só a nacionalidade. Residência temporária de 2 anos, pedida online (RaDEX) já no país, com direito a trabalhar.",
      custo: "Taxa de 50 UMSM = ARS 50.000 (cerca de US$ 32, out/2026), mais certidões e traduções.",
      prazo: "Semanas.", obs: "Mercado de TI grande e muitas empresas que contratam para fora. Inflação alta: prefira renda em dólar." },
    { id: "uruguai", nome: "Mercosul: Uruguai (Montevidéu)", grupo: "Residência por acordo", cabe: "sim", idioma: "Espanhol",
      req: "Só a nacionalidade. Residência Mercosul pedida no país ou no consulado. Fontes divergem se já sai permanente ou se é temporária antes.",
      custo: "Certidões apostiladas + taxas (confira em gub.uy).",
      prazo: "Semanas a meses.", obs: "Um dos polos de software mais fortes da região. Custo de vida alto para a América do Sul: a renda precisa vir antes." },
    { id: "japao", nome: "Working Holiday Japão", grupo: "Working Holiday", cabe: "talvez", idioma: "Japonês (inglês ajuda)",
      req: "18 a 30 anos, morar no Brasil, primeira vez no programa. Programa novo: começa em 01/12/2026.",
      custo: "Visto gratuito. Exige seguro, reserva financeira e passagem de volta (valores a definir pelos consulados).",
      prazo: "Pedido no consulado a partir de 01/12. Depois de emitido, entrar em até 3 meses. Fica até 12 meses.", obs: "Número de vagas do primeiro ano ainda não divulgado (nov/2026). Uma vez só na vida. O visto não pode ser prorrogado nem convertido em outro no Japão." },
    { id: "franca", comprova: [2500, "EUR"], nome: "PVT França (Visto Férias-Trabalho)", grupo: "Working Holiday", cabe: "talvez", idioma: "Francês",
      req: "18 a 30 anos, sem dependentes, passaporte válido por pelo menos 1 ano e 3 meses.",
      custo: "Visto gratuito. Comprovação de cerca de € 2.500 + seguro + passagem.",
      prazo: "Campanha costuma abrir em 1º de janeiro, com agendamentos limitados. Fica 12 meses.", obs: "Apertado para fevereiro: depende de conseguir agendamento logo no começo de janeiro." },
    { id: "alemanha", comprova: [2000, "EUR"], nome: "Working Holiday Alemanha", grupo: "Working Holiday", cabe: "talvez", idioma: "Alemão (inglês ajuda)",
      req: "18 a 30 anos, seguro de 12 meses, passagem de volta ou dinheiro para ela.",
      custo: "Taxa consular € 75. Comprovação de cerca de € 2.000.",
      prazo: "Agendamento passa de 40 dias em 2026 + processamento de cerca de 6 semanas.", obs: "Não permite trabalhar como autônomo/freelancer." },
    { id: "irlanda", comprova: [6665, "EUR"], nome: "Irlanda: estudo de inglês + trabalho (Stamp 2)", grupo: "Estudo e trabalho", cabe: "talvez", idioma: "Inglês",
      req: "Curso de inglês de 25 semanas em escola credenciada. Brasileiro não precisa de visto: a comprovação é feita no registro, já lá.",
      custo: "€ 833 por mês de estadia (€ 6.665 para 8 meses) em conta + curso + seguro. Estimativa de agências: cerca de € 11 mil no total.",
      prazo: "Cabe se o dinheiro existir: matrícula em semanas.", obs: "Trabalho de 20 h/semana (40 h nas férias). O gargalo é o dinheiro, não o prazo." },
    { id: "espanha", comprova: [7200, "EUR"], nome: "Espanha: visto de estudante", grupo: "Estudo e trabalho", cabe: "talvez", idioma: "Espanhol",
      req: "Matrícula + 100% do IPREM: € 600 por mês de curso. Seguro saúde privado.",
      custo: "€ 7.200 para 12 meses de comprovação + curso + taxas.",
      prazo: "Matrícula + consulado: apertado para fevereiro.", obs: "Trabalho de até 30 h/semana só para universidade e formação profissional. Escola de idiomas não dá trabalho automático." },
    { id: "contrato", nome: "Emprego com contrato e visto de trabalho", grupo: "Trabalho", cabe: "talvez", idioma: "Do país",
      req: "Uma empresa te contrata antes e o visto sai pelo contrato. Portugal: visto D1 pedido no Brasil, salário de pelo menos € 920.",
      custo: "Baixo em taxas; o custo é conseguir a vaga.",
      prazo: "Só cabe se a vaga sair até dezembro.", obs: "Use a mesma busca da vaga gringa e filtre por “visa sponsorship”." },
    { id: "australia", nome: "Work and Holiday Austrália (462)", grupo: "Working Holiday", cabe: "nao", idioma: "Inglês",
      req: "18 a 30 anos. Brasil com teto de 500 vagas no ano 2026–27.",
      custo: "Taxa do visto + comprovação (confira em Home Affairs).",
      prazo: "Status do Brasil: PAUSADO (página oficial atualizada em 12/10/2026). Novo ano do programa começa em 01/07/2027.", obs: "Acompanhe a página de status. Não conte com ela para fevereiro." },
    { id: "nz", comprova: [4200, "NZD"], nome: "Working Holiday Nova Zelândia", grupo: "Working Holiday", cabe: "nao", idioma: "Inglês",
      req: "18 a 30 anos, NZD 4.200 em conta.",
      custo: "Taxa do visto + NZD 4.200.",
      prazo: "As 300 vagas de 2026 abriram em 10/10/2026. Próxima janela: cerca de outubro de 2027.", obs: "Ótimo para o plano C." },
    { id: "cidadania", nome: "Cidadania europeia por descendência", grupo: "Cidadania", cabe: "nao", idioma: "Varia",
      req: "Ter antepassado europeu e conseguir a documentação.",
      custo: "Varia muito (certidões, traduções, processo).",
      prazo: "Meses a anos.", obs: "Não cabe em fevereiro, mas se existir, comece já: muda todo o longo prazo." }
  ],

  criterios: [
    { id: "prazo", nome: "Cabe até 08/02", peso: 3 },
    { id: "custo", nome: "Custo baixíssimo", peso: 3 },
    { id: "trabalho", nome: "Trabalho previsto antes de embarcar", peso: 3 },
    { id: "ti", nome: "Carreira em TI e trampolim", peso: 2 },
    { id: "idioma", nome: "Idioma que já falo", peso: 1 },
    { id: "ficar", nome: "Caminho para ficar depois", peso: 1 }
  ],

  marcos: [
    { id: "m1", data: "2026-11-15", t: "Diagnóstico feito, passaporte pedido e currículo em inglês e espanhol", decisao: false },
    { id: "m2", data: "2026-11-30", t: "Rotas A e B escolhidas pela matriz", decisao: true },
    { id: "m3", data: "2026-12-01", t: "Working Holiday Japão começa: ver regras no consulado (se for rota)", decisao: false },
    { id: "m4", data: "2026-12-10", t: "Avisar o locador conforme o contrato (só com rota escolhida)", decisao: true },
    { id: "m12", data: "2026-12-15", t: "Funil rodando: 60 candidaturas enviadas e alerta de preço da passagem ligado", decisao: false },
    { id: "m5", data: "2026-12-20", t: "Cartão quitado e 70% dos bens vendidos", decisao: false },
    { id: "m6", data: "2027-01-01", t: "Campanha do PVT França costuma abrir (se for rota)", decisao: false },
    { id: "m7", data: "2027-01-10", t: "Trabalho previsto fechado e documentos da rota prontos. Rota Mercosul: já pode comprar a passagem", decisao: true },
    { id: "m8", data: "2027-01-17", t: "Prova da UFMS (se for fazer)", decisao: false },
    { id: "m9", data: "2027-01-25", t: "Go/No-Go final: as outras rotas só compram a passagem se for VAI", decisao: true },
    { id: "m10", data: "2027-01-31", t: "Entregar o apartamento", decisao: false },
    { id: "m11", data: "2027-02-08", t: "No avião ou pousando lá fora", decisao: false }
  ],

  gonogo: [
    { id: "pp", t: "Passaporte em mãos (no Mercosul, RG em bom estado também serve para entrar)", critico: true },
    { id: "legal", t: "Rota confirmada no site oficial do destino", critico: true },
    { id: "doc", t: "Visto, autorização ou matrícula aprovados (se a rota exige antes de ir)", critico: true },
    { id: "trabalho", t: "Trabalho previsto: oferta assinada, contrato remoto ou freelas fechados para os primeiros 60 dias", critico: true },
    { id: "din", t: "Capital líquido ≥ custo de saída + 2 meses de custo de vida + passagem de volta", critico: true },
    { id: "divida", t: "Dívida do cartão quitada ou negociada", critico: true },
    { id: "casa", t: "Hospedagem das primeiras 2 a 4 semanas reservada", critico: true },
    { id: "seguro", t: "Seguro saúde válido no destino", critico: true },
    { id: "copias", t: "Cópias digitais de todos os documentos no Drive", critico: false },
    { id: "trampolim", t: "Trampolim escrito: para onde vou em 1 a 2 anos", critico: false },
    { id: "rede", t: "Entrei em pelo menos 2 comunidades de brasileiros no destino", critico: false }
  ],

  fontes: [
    { nome: "Polícia Federal: passaporte", url: "https://www.gov.br/pf/pt-br/assuntos/passaporte" },
    { nome: "Polícia Federal: antecedentes criminais", url: "https://www.gov.br/pf/pt-br/assuntos/antecedentes-criminais" },
    { nome: "Argentina: Dirección Nacional de Migraciones", url: "https://www.argentina.gob.ar/migraciones" },
    { nome: "Paraguai: Dirección Nacional de Migraciones", url: "https://www.migraciones.gov.py" },
    { nome: "Uruguai: portal do governo (trâmites de residência)", url: "https://www.gub.uy" },
    { nome: "Irlanda: Immigration Service (estudo e finanças)", url: "https://www.irishimmigration.ie/coming-to-study-in-ireland/" },
    { nome: "Portugal: Portal de Vistos (MNE)", url: "https://vistos.mne.gov.pt" },
    { nome: "França: France-Visas", url: "https://france-visas.gouv.fr" },
    { nome: "Alemanha: consulados no Brasil", url: "https://brasil.diplo.de" },
    { nome: "Japão: Embaixada no Brasil", url: "https://www.br.emb-japan.go.jp" },
    { nome: "Austrália: status das vagas do visto 462", url: "https://immi.homeaffairs.gov.au/what-we-do/whm-program/status-of-country-caps" },
    { nome: "Nova Zelândia: Working Holiday", url: "https://www.immigration.govt.nz" }
  ]
};
if (typeof module !== "undefined") module.exports = PREPARA;
