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
  }
];
