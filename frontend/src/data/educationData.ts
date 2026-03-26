export interface Lesson {
  id: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  title: string;
  description: string;
  duration: number;
  xpReward: number;
  content: string;
  quiz: {
    question: string;
    options: string[];
    correctIdx: number;
    explanation: string;
  };
}

export const EDUCATION_MODULES: Lesson[] = [
  {
    id: "mod-1",
    level: "Iniciante",
    title: "Reserva de Emergência",
    description: "Qual o tamanho ideal e onde guardar sua reserva para dormir tranquilo.",
    duration: 4,
    xpReward: 50,
    content: "Sua reserva de emergência é o seu colchão de segurança. Ela deve cobrir de 3 a 6 meses do seu custo de vida essencial.\n\nRegra de Ouro: Onde guardar?\nNunca coloque sua reserva em renda variável. O dinheiro precisa ter **alta liquidez** (poder sacar a qualquer momento) e **baixo risco**.\n\nMelhores lugares:\n- Tesouro Selic\n- CDBs de liquidez diária (Rendendo 100% ou mais do CDI)\n- Caixinhas do Nubank/PicPay (RDBs)",
    quiz: {
      question: "Onde você NÃO deve colocar sua reserva de emergência?",
      options: ["Tesouro Selic", "Fundos Imobiliários (FIIs)", "CDB de liquidez diária", "Poupança ou Conta Corrente com rendimento"],
      correctIdx: 1,
      explanation: "Fundos Imobiliários sofrem variação de mercado (volatilidade) e você pode resgatar menos do que investiu se precisar do dinheiro com urgência."
    }
  },
  {
    id: "mod-2",
    level: "Iniciante",
    title: "Saindo das Dívidas",
    description: "Aprenda a classificar, negociar e abater juros com a estratégia avalanche.",
    duration: 6,
    xpReward: 75,
    content: "Se você possui dívidas, não invista ainda. Os juros que você paga no rotativo do cartão ou no cheque especial são sempre maiores que o rendimento de qualquer investimento seguro (muitas vezes chegando a 300% ao ano, contra 10% de um investimento).\n\nEstratégia Avalanche:\n1. Liste todas as suas dívidas.\n2. Ordene pela taxa de juros (da maior para a menor).\n3. Pague o mínimo de todas, e direcione todo o dinheiro extra para atacar o saldo devedor da dívida com o juro mais alto.\n4. Repita até zerar.",
    quiz: {
      question: "Qual o primeiro passo se você tem dinheiro sobrando mas está no rotativo do cartão de crédito?",
      options: ["Investir em ações boas pagadoras de dividendos", "Comprar Tesouro Direto para ter segurança", "Pagar a dívida do cartão o mais rápido possível", "Comprar Dólares"],
      correctIdx: 2,
      explanation: "A taxa de juros do rotativo do cartão de crédito no Brasil ultrapassa os 300% a.a. Nenhum investimento lícito compensa esse custo."
    }
  },
  {
    id: "mod-3",
    level: "Intermediário",
    title: "A Mágica da Selic e do CDI",
    description: "Juros, inflação e como o Tesouro Direto funciona na prática.",
    duration: 5,
    xpReward: 100,
    content: "A Taxa Selic é a taxa básica de juros do Brasil, definida a cada 45 dias pelo banco central (Copom). O CDI acompanha a Selic quase perfeitamente (ficando 0,10% abaixo).\n\nSempre que vir um CDB rendendo '100% do CDI', significa que ele pagará essencialmente a taxa Selic. Se a Selic está 10.5%, o CDB vai render na casa de 10.4% ao ano.\n\nTipos de Tesouro:\n- Selic: Segue a taxa atual. Ótimo para reservas.\n- IPCA+: Mantém o poder de compra + uma taxa fixa. Ótimo para aposentadoria.\n- Prefixado: Você sabe exatamente quanto vai receber láá na frente.",
    quiz: {
      question: "Se a Selic está em 10% ao ano, quanto rende aproximadamente um CDB que paga '110% do CDI'?",
      options: ["Aproximadamente 11% ao ano", "110% ao mês", "10% exatos", "Depende do IPCA no período"],
      correctIdx: 0,
      explanation: "O CDI é praticamente igual à Selic. 110% de 10% (1,10 * 10) daria 11% ao ano nominalmente."
    }
  },
  {
    id: "mod-4",
    level: "Avançado",
    title: "O Movimento F.I.R.E.",
    description: "Independência Financeira e Aposentadoria Precoce através de aportes constantes.",
    duration: 8,
    xpReward: 200,
    content: "F.I.R.E. (Financial Independence, Retire Early) baseia-se em reduzir radicalmente seu custo de vida e investir intensamente o saldo (taxa de poupança alta).\n\nA Regra dos 4% ou Regra dos 300:\nVocê alcança a independência financeira quando seu patrimônio investido for igual a cerca de 300 vezes o seu custo de vida mensal.\nEx: Se você gasta R$ 5.000 por mês. Seu 'Número FIRE' é R$ 1.500.000.\nUm patrimônio de 1.5 milhão, rendendo acima da inflação, consegue cobrir seu gasto de 5 mil perpetuamente.",
    quiz: {
      question: "Seu gasto mensal essencial é R$ 3.000. Qual seria seu Número FIRE aproximado na regra dos 300?",
      options: ["R$ 300.000", "R$ 600.000", "R$ 900.000", "R$ 1.500.000"],
      correctIdx: 2,
      explanation: "300 x 3.000 = 900.000 reais. Com 900 mil investidos em uma carteira balanceada, você consegue sacar 3 mil mensais sem descapitalizar o montante principal no longo prazo."
    }
  },
  {
    id: "mod-5",
    level: "Intermediário",
    title: "Fundos Imobiliários (FIIs)",
    description: "Seja dono de prédios e shoppings e receba aluguéis todos os meses.",
    duration: 5,
    xpReward: 120,
    content: "FIIs são condomínios de investidores que compram imóveis físicos ou títulos de dívida imobiliária. A grande vantagem é a distribuição mensal de dividendos (isenção de IR para pessoa física até o momento).\n\nTipos de FIIs:\n- Tijolo: Imóveis físicos (shoppings, galpões, escritórios).\n- Papel: Títulos de crédito imobiliário (CRI, LCI).\n- Fundos de Fundos (FoFs): Compram cotas de outros FIIs.",
    quiz: {
      question: "Qual a principal característica dos Fundos Imobiliários de 'Tijolo'?",
      options: ["Investem em dívidas de bancos", "Investem em imóveis físicos reais", "Focam apenas em investir em Ouro", "São muito arriscados e podem sumir do dia para a noite"],
      correctIdx: 1,
      explanation: "FIIs de Tijolo possuem imóveis físicos reais em seu portfólio, como lajes corporativas, galpões logísticos ou shoppings."
    }
  },
  {
    id: "mod-6",
    level: "Intermediário",
    title: "ETFs e Diversificação Global",
    description: "Como investir no mundo inteiro com apenas uma cota e baixo custo.",
    duration: 6,
    xpReward: 130,
    content: "ETFs (Exchange Traded Funds) são fundos que replicam um índice. Ao comprar uma cota de IVVB11, você está investindo nas 500 maiores empresas dos EUA.\n\nPor que usar ETFs?\n- Diversificação instantânea.\n- Taxas de administração baixíssimas.\n- Exposição a moedas fortes (como o Dólar) sem precisar abrir conta no exterior (embora seja recomendado no longo prazo).",
    quiz: {
      question: "Ao comprar o ETF 'IVVB11' na bolsa brasileira, você está se expondo a qual mercado?",
      options: ["Mercado Chinês", "Mercado de Commodities (Soja/Milho)", "Mercado Americano (S&P 500)", "Apenas empresas de tecnologia do Brasil"],
      correctIdx: 2,
      explanation: "O IVVB11 replica o índice S&P 500, que contém as 500 maiores empresas de capital aberto dos Estados Unidos."
    }
  },
  {
    id: "mod-7",
    level: "Avançado",
    title: "Imposto de Renda (IR)",
    description: "Aprenda a declarar e não cair na malha fina por causa de centavos.",
    duration: 10,
    xpReward: 250,
    content: "Investir exige responsabilidade fiscal. No Brasil, ações têm isenção de venda até R$ 20 mil/mês (lucro), mas FIIs e ETFs NÃO têm essa isenção.\n\nRegras Básicas:\n- Dividendos de ações: Isentos (por enquanto).\n- JCP: Tributados em 15% na fonte.\n- Venda de FIIs com lucro: 20% de IR sobre o ganho de capital (pago via DARF).",
    quiz: {
      question: "Qual a alíquota de imposto de renda sobre o LUCRO na venda de cotas de FIIs?",
      options: ["10%", "15%", "20%", "Isento até 20 mil reais"],
      correctIdx: 2,
      explanation: "Vendas de FIIs com lucro são sempre tributadas em 20%, independente do valor da venda. Não há isenção para FIIs como existe para Ações."
    }
  },
  {
    id: "mod-8",
    level: "Avançado",
    title: "Criptoativos e Bitcoin",
    description: "Ouro digital, descentralização e como custodiar seus ativos com segurança.",
    duration: 7,
    xpReward: 180,
    content: "Bitcoin é a primeira escassez digital descentralizada. Diferente do Real, o Bitcoin tem um suprimento máximo de 21 milhões de unidades.\n\nSegurança:\n- Exchange: Prático, mas o dinheiro não é 100% seu.\n- Cold Wallet (Carteira Fria): O nível máximo de segurança. Você detém as chaves privadas e tem soberania total sobre seu capital.",
    quiz: {
      question: "Qual o limite máximo de Bitcoins que existirão no mundo?",
      options: ["1 milhão", "21 milhões", "100 milhões", "Ilimitado, o código é atualizado sempre"],
      correctIdx: 1,
      explanation: "O protocolo Bitcoin define que apenas 21 milhões de unidades serão mineradas, tornando-o um ativo deflacionário por natureza."
    }
  },
  {
    id: "mod-9",
    level: "Intermediário",
    title: "Tesouro Direto Avançado",
    description: "Entenda a marcação a mercado e como lucrar com a queda dos juros.",
    duration: 6,
    xpReward: 140,
    content: "A marcação a mercado é a atualização diária do preço de um título de renda fixa. Se a taxa de juros do mercado cai, o seu título antigo (com taxa alta) se valoriza muito.\n\nIsso permite que você venda um título do Tesouro antes do vencimento com um lucro muito superior ao rendimento contratado inicialmente.",
    quiz: {
      question: "O que acontece com o preço de um título pré-fixado se a taxa de juros do mercado cai?",
      options: ["O preço cai", "O preço sobe", "O preço permanece igual", "O título é cancelado"],
      correctIdx: 1,
      explanation: "Existe uma relação inversa entre juros e preço dos títulos. Juros caem = Preço do título sobe."
    }
  },
  {
    id: "mod-10",
    level: "Iniciante",
    title: "Previdência Privada",
    description: "PGBL vs VGBL: Qual escolher para pagar menos imposto?",
    duration: 5,
    xpReward: 90,
    content: "PGBL é indicado para quem faz a declaração completa do IR (permite abater até 12% da renda tributável). VGBL é indicado para quem faz a simplificada ou já atingiu o teto do PGBL.\n\nTabela Regressiva: Quanto mais tempo o dinheiro fica, menos imposto você paga (chegando a 10% após 10 anos).",
    quiz: {
      question: "Qual o benefício fiscal do PGBL?",
      options: ["Isenção total de IR", "Abatimento de até 12% da renda tributável no IR", "Rendimento garantido de 1% ao mês", "Poder sacar a qualquer momento sem custos"],
      correctIdx: 1,
      explanation: "O PGBL permite diferir o pagamento do imposto ao abater aportes da base de cálculo do seu IR anual."
    }
  },
  {
    id: "mod-11",
    level: "Avançado",
    title: "Análise Fundamentalista",
    description: "P/L, ROE, Dividend Yield: Os indicadores que os profissionais usam.",
    duration: 12,
    xpReward: 300,
    content: "Analisar uma empresa é entender se ela é lucrativa e se o preço está justo.\n- P/L: Preço sobre Lucro (em quantos anos você recupera o investimento).\n- ROE: Retorno sobre Patrimônio (eficiência da gestão).\n- DY: Dividend Yield (% que a empresa paga de proventos).",
    quiz: {
      question: "O que o indicador P/L (Preço/Lucro) representa?",
      options: ["O Patrimônio Líquido total", "Quanto a empresa deve", "Em quanto tempo o investidor teria o retorno do capital via lucros", "O valor de mercado dividido pelo número de funcionários"],
      correctIdx: 2,
      explanation: "O P/L indica o quanto o mercado está disposto a pagar por cada real de lucro que a empresa gera."
    }
  },
  {
    id: "mod-12",
    level: "Avançado",
    title: "Opções e Derivativos",
    description: "Proteção de carteira (Hedge) e os perigos da alavancagem.",
    duration: 15,
    xpReward: 400,
    content: "Opções são contratos que dão o direito (ou obrigação) de comprar ou vender um ativo por um preço fixo.\n- CALL: Direito de compra.\n- PUT: Direito de venda.\n\nCUIDADO: Se usadas para especulação, as perdas podem ser totais em dias.",
    quiz: {
      question: "Qual o nome da estratégia usada para proteger uma carteira de ações contra quedas?",
      options: ["Hedge", "All-in", "Day Trade", "Alavancagem"],
      correctIdx: 0,
      explanation: "Hedge é uma estratégia de cobertura para reduzir o risco de perdas em movimentos adversos de preço."
    }
  },
  {
    id: "mod-13",
    level: "Intermediário",
    title: "Consumo Consciente",
    description: "Frugalidade vs Escassez: Como viver bem gastando menos.",
    duration: 5,
    xpReward: 80,
    content: "O segredo da riqueza não é ganhar muito, mas sim a diferença entre o que você ganha e o que você gasta (o aporte).\n\nEvite a 'inflação de estilo de vida'. Conforme sua renda sobe, não suba seus gastos na mesma proporção.",
    quiz: {
      question: "O que é 'Inflação de Estilo de Vida'?",
      options: ["Aumento geral dos preços no mercado", "Aumento dos gastos pessoais conforme a renda aumenta", "A inflação medida pelo governo", "A valorização do Dólar"],
      correctIdx: 1,
      explanation: "É a tendência de gastar mais conforme se ganha mais, impedindo o acúmulo de patrimônio."
    }
  },
  {
    id: "mod-14",
    level: "Iniciante",
    title: "Mentalidade e Psicologia",
    description: "Vieses cognitivos: Por que compramos no topo e vendemos no fundo?",
    duration: 7,
    xpReward: 110,
    content: "Nossa mente não foi evolutivamente treinada para o mercado financeiro. Sentimos medo quando todos sentem medo e euforia quando o mercado sobe.\n\nViés da Recência: Achar que o que aconteceu ontem vai acontecer para sempre.",
    quiz: {
      question: "Qual o erro mais comum de investidores iniciantes guiados pela emoção?",
      options: ["Comprar quando o ativo está subindo muito (euforia) e vender quando cai (pânico)", "Manter os aportes constantes", "Estudar os fundamentos antes de comprar", "Ignorar notícias de curto prazo"],
      correctIdx: 0,
      explanation: "O efeito manada faz com que iniciantes comprem caro na euforia e vendam barato no desespero."
    }
  },
  {
    id: "mod-15",
    level: "Avançado",
    title: "Sucessão e Holding",
    description: "Como proteger o patrimônio para as próximas gerações.",
    duration: 8,
    xpReward: 220,
    content: "Uma Holding Familiar é uma empresa criada para gerir os bens de uma família. Reduz custos de inventário e facilita a sucessão.\n\nEficiência tributária: Aluguéis via empresa podem pagar menos imposto que na pessoa física.",
    quiz: {
      question: "Qual o principal objetivo de uma Holding Familiar?",
      options: ["Sonegar impostos", "Facilitar a sucessão patrimonial e proteção de bens", "Comprar ações americanas", "Evitar o pagamento de dívidas"],
      correctIdx: 1,
      explanation: "A holding centraliza o patrimônio e organiza a transferência de bens via cotas, evitando processos lentos de inventário."
    }
  },
  {
    id: "mod-16",
    level: "Intermediário",
    title: "Seguros Necessários",
    description: "Quando contratar seguro de vida, carro ou residencial.",
    duration: 6,
    xpReward: 100,
    content: "Seguro não é investimento, é transferência de risco. Se você tem dependentes, seguro de vida é essencial. Se não tem, foque em seguro de invalidez ou despesas médicas.",
    quiz: {
      question: "Qual o papel principal de um seguro na vida financeira?",
      options: ["Rendimento extra", "Transferência de risco catastrófico", "Substituir a reserva de emergência", "Pagar menos imposto de renda"],
      correctIdx: 1,
      explanation: "O seguro serve para que perdas financeiras grandes sejam absorvidas por uma seguradora em troca de um prêmio mensal."
    }
  },
  {
    id: "mod-17",
    level: "Avançado",
    title: "Rebalanceamento",
    description: "A técnica para 'vender caro e comprar barato' automaticamente.",
    duration: 7,
    xpReward: 160,
    content: "Defina percentuais alvo (ex: 50% ações, 50% renda fixa). Se as ações sobem muito e viram 60%, você vende o excesso e compra renda fixa.\n\nIsso força você a vender o que valorizou e comprar o que está descontado.",
    quiz: {
      question: "Com que frequência é recomendado fazer o rebalanceamento da carteira?",
      options: ["Todo dia", "A cada 6 ou 12 meses", "Nunca, deixe o mercado decidir", "Apenas quando a bolsa bater recorde"],
      correctIdx: 1,
      explanation: "Intervalos semestrais ou anuais são suficientes para ajustar os desvios sem gerar custos excessivos de corretagem/impostos."
    }
  },
  {
    id: "mod-18",
    level: "Iniciante",
    title: "Planejamento Sucessório",
    description: "Testamentos, doações e o ITCMD.",
    duration: 5,
    xpReward: 120,
    content: "Organizar quem fica com o quê evita brigas familiares e perda de até 15% do valor do patrimônio em advogados e taxas.\n\nDoação em vida com usufruto é uma ferramenta comum no Brasil.",
    quiz: {
      question: "O que é usufruto em uma doação de imóvel?",
      options: ["O doador perde o direito de morar no local", "O doador mantém o direito de uso e renda do bem até falecer", "O imóvel é vendido automaticamente", "O imposto de renda fica zerado"],
      correctIdx: 1,
      explanation: "O usufruto permite que você transfira a propriedade mas continue morando no imóvel ou recebendo os aluguéis dele."
    }
  },
  {
    id: "mod-19",
    level: "Intermediário",
    title: "Especulação vs Investimento",
    description: "Graham, Buffett e o conceito de investidor defensivo.",
    duration: 9,
    xpReward: 190,
    content: "Investir é uma operação que promete segurança do principal e retorno adequado. Operações que não atendem isso são especulativas.\n\nBenjamin Graham: O pai do Value Investing.",
    quiz: {
      question: "Segundo Benjamin Graham, o que define um investimento?",
      options: ["Análise profunda, segurança do principal e retorno adequado", "Lucro rápido em 24 horas", "Seguir dicas de influenciadores", "Apostar em empresas que estão falindo"],
      correctIdx: 0,
      explanation: "Investir exige análise rigorosa e foco em não perder o capital original."
    }
  },
  {
    id: "mod-20",
    level: "Intermediário",
    title: "O Custo de Oportunidade",
    description: "Por que deixar dinheiro parado na conta corrente é perigoso.",
    duration: 4,
    xpReward: 70,
    content: "Dinheiro parado perde poder de compra para a inflação. O custo de oportunidade é o que você deixa de ganhar ao não escolher a melhor alternativa segura disponível.\n\nEx: Se o CDI é 1% ao mês, deixar 100 mil parados custa R$ 1.000 mensais.",
    quiz: {
      question: "O que é 'Custo de Oportunidade'?",
      options: ["O valor do boleto a pagar", "O benefício que você renuncia ao escolher uma opção em vez de outra", "O custo de manter um cartão de crédito", "A taxa de corretagem da bolsa"],
      correctIdx: 1,
      explanation: "Ao deixar dinheiro parado, seu custo de oportunidade é o rendimento que você teria no Tesouro Selic, por exemplo."
    }
  }
];
