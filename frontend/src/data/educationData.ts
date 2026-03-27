export type PassoTipo = 'teoria' | 'exemplo' | 'regra' | 'quiz' | 'acao';

export interface Passo {
  tipo: PassoTipo;
  titulo?: string;
  conteudo?: string;
  visual?: string;
  exemplo?: string;
  calculo?: { simples: string; composto: string; delta: string };
  pergunta?: string; // para quiz
  opcoes?: string[]; // para quiz
  correta?: number; // para quiz
  expl?: string; // para quiz
  cta?: string; // para acao
  ctaFn?: string; // para acao
}

export interface Trilha {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

export interface Conquista {
  emoji: string;
  nome: string;
  desc: string;
  ok: boolean;
}

export interface Lesson {
  id: string;
  trilha: string;
  title: string;
  sub: string;
  emoji: string;
  dur: string;
  xp: number;
  ok: boolean;
  grad: string;
  passos: Passo[];
}

// ----------------------------------------------------------------------
// DEFINIÇÃO DAS TRILHAS (REALIDADE BRASILEIRA)
// ----------------------------------------------------------------------
export const AULAS_TRILHAS: Trilha[] = [
  { id: 'start',       label: 'Sobrevivência',   emoji: '🇧🇷', color: '#E94560', bg: 'rgba(233,69,96,0.12)' },
  { id: 'base',        label: 'Fundamentos',     emoji: '🏗️', color: '#4A8BFF', bg: 'rgba(74,139,255,0.12)' },
  { id: 'renda_fixa',  label: 'Renda Fixa BR',   emoji: '🏛️', color: '#00D991', bg: 'rgba(0,217,145,0.12)' },
  { id: 'renda_var',   label: 'Bolsa e ETFs',    emoji: '📈', color: '#FFAD3B', bg: 'rgba(255,173,59,0.12)' },
  { id: 'fire',        label: 'Independência',   emoji: '🔥', color: '#9B7FFF', bg: 'rgba(155,127,255,0.12)' },
  { id: 'dividendos',  label: 'Dividendos BR',   emoji: '💰', color: '#00D991', bg: 'rgba(0,217,145,0.12)' },
  { id: 'cripto',      label: 'Cripto/Bitcoin',  emoji: '₿',  color: '#F7931A', bg: 'rgba(247,147,26,0.12)' },
  { id: 'sucessao',    label: 'Blindagem',       emoji: '🛡️', color: '#E94560', bg: 'rgba(233,69,96,0.12)' },
  { id: 'renda_ativa', label: 'Renda Ativa',     emoji: '🚀', color: '#4A8BFF', bg: 'rgba(74,139,255,0.12)' },
];

export const AULAS_CONQUISTAS: Conquista[] = [
  { emoji: '🇧🇷', nome: 'Sobrevivente do Serasa',  desc: 'Completou a Trilha Sobrevivência',   ok: true  },
  { emoji: '🛡️', nome: 'Reserva Blindada',         desc: 'Respondeu certo sobre Selic',         ok: false },
  { emoji: '📈', nome: 'Sócio de Empresas',         desc: 'Completou Renda Variável',            ok: false },
  { emoji: '🔥', nome: 'Matemática do FIRE BR',     desc: 'Dominou a SWR de 3,2%',              ok: false },
  { emoji: '💰', nome: 'Discípulo de Barsi',        desc: 'Completou Dividendos BR',             ok: false },
  { emoji: '₿',  nome: 'Hodler Consciente',         desc: 'Completou a Trilha Cripto',            ok: false },
  { emoji: '📜', nome: 'Patrimônio Blindado',        desc: 'Completou Blindagem Sucessória',       ok: false },
  { emoji: '✈️', nome: 'Viajante de Graça',          desc: 'Concluiu Milhas e Renda Ativa',        ok: false },
];

// ----------------------------------------------------------------------
// CONTEÚDO MASSIVO DA ACADEMIA (DO BÁSICO AO AVANÇADO - BRASIL)
// ----------------------------------------------------------------------
export const EDUCATION_MODULES: Lesson[] = [
  
  // ==========================================
  // TRILHA 1: SOBREVIVÊNCIA BRASILEIRA (BÁSICO)
  // ==========================================
  {
    id: 'br_dividas', trilha: 'start', title: 'A Armadilha do Rotativo', sub: 'O maior vilão do brasileiro', emoji: '💳', dur: '5 min', xp: 50, ok: true, grad: 'linear-gradient(135deg,#2B0F1A,#5C1A33)',
    passos: [
      { tipo: 'teoria', titulo: 'O que é o Rotativo?', conteudo: 'No Brasil, pagar o "minímo do cartão" ativa o rotativo. É o crédito mais caro do MUNDO. Juros chegam a <strong style="color:#E94560">mais de 400% ao ano</strong>. Quem entra no rotativo trabalha para o banco, não para si.', visual: '💳' },
      { tipo: 'regra', titulo: 'Nunca use o Cheque Especial', conteudo: 'Assim como o rotativo, o cheque especial (limite da conta corrente) tem juros imorais. <strong style="color:#E94560">Solução:</strong> Se não conseguir pagar o cartão, pegue um empréstimo pessoal (Custo Efetivo Total menor) para quitar o cartão à vista.', exemplo: 'Trocar uma dívida de 400% a.a. por uma de 40% a.a.' },
      { tipo: 'exemplo', titulo: 'Bola de Neve Inversa', conteudo: 'R$ 1.000 no rotativo a 400% a.a. vira R$ 5.000 em 12 meses. O juro composto contra você é letal.', calculo: { simples: 'Dívida no Rotativo: R$ 5k/ano', composto: 'Emprestimo Consignado: R$ 1.3k/ano', delta: '- R$ 3.700 em juros pagos' } },
      { tipo: 'quiz', pergunta: 'O que você deve fazer se a fatura do cartão vier R$ 3.000 e você só tem R$ 1.000 na conta corrente e zero reserva?', opcoes: ['Pagar o mínimo exigido (ex: R$ 450) e rolar a dívida pro mês que vem no rotativo automático.', 'Pegar o "Cheque Especial" do banco porque cai na hora e usar para pagar a fatura.', 'Procurar um Empréstimo Pessoal ou Consignado (se tiver) que tenha taxa muito menor que o rotativo, pegar os R$ 2.000 faltantes, quitar a fatura inteira e depois pagar as parcelas do empréstimo.', 'Deixar a fatura sujar o nome e ignorar.'], correta: 2, expl: 'Sempre troque uma dívida muito cara (Rotativo custa até 15% ao mês) por uma mais barata (Empréstimo pessoal cobra de 3% a 6% ao mês). Pagar o mínimo do cartão é assinar sua própria falência no Brasil.' },
      { tipo: 'acao', titulo: 'Monitore seu Orçamento Mensal', conteudo: 'Use o Zero-Based Budgeting no app para nunca mais faltar dinheiro na hora da fatura.', cta: 'Configurar Envelopes', ctaFn: "go('budget')" }
    ]
  },
  {
    id: 'br_reserva', trilha: 'start', title: 'Reserva de Emergência', sub: 'Tesouro Selic & NuConta', emoji: '🛡️', dur: '6 min', xp: 60, ok: true, grad: 'linear-gradient(135deg,#002B1D,#005739)',
    passos: [
      { tipo: 'teoria', titulo: 'Doença, Demissão e Carro Quebrado', conteudo: 'Emergências não são "SE vão acontecer", são "QUANDO vão acontecer". No Brasil, o SUS pode demorar e o seguro desemprego não mantém seu padrão de vida. Você precisa de 3 a 6 meses de seu custo de vida <strong style="color:#00D991">livre de risco</strong>.', visual: '☔' },
      { tipo: 'regra', titulo: 'Liquidez Diária (D+0)', conteudo: 'Dinheiro de emergência não pode ficar trancado em imóveis ou em ações que mudam de preço. Onde colocar? <strong style="color:#00D991">Tesouro Selic</strong>, contas do tipo <strong style="color:#00D991">Nubank/Mercado Pago</strong> (rendendo 100% do CDI) ou CDBs de Liquidez Diária de bancos sólidos.', exemplo: 'Se seu custo de vida é R$ 3.000, sua meta de reserva é entre R$ 9.000 e R$ 18.000.' },
      { tipo: 'exemplo', titulo: 'A Poupança = Perda de Dinheiro', conteudo: 'A velha Caderneta de Poupança rende abaixo da inflação (IPCA). Seu dinheiro perde poder de compra todo dia.', calculo: { simples: 'Poupança: Rende ~6% a.a.', composto: 'Tesouro Selic: Rende ~10% a.a.', delta: 'Proteção contra inflação' } },
      { tipo: 'quiz', pergunta: 'João juntou R$ 10.000 para sua Reserva de Emergência. Para proteger da inflação e ter segurança imediata num domingo à noite para pagar um hospital, onde ele DEVE ter guardado esse dinheiro?', opcoes: ['Ações da Petrobras (garantem altos dividendos).', 'Tesouro IPCA+ 2045 (protege perfeitamente da inflação).', 'CDB de liquidez diária batendo 100% do CDI ou Contas Remuneradas (D+0).', 'Caderneta de Poupança da Caixa.'], correta: 2, expl: 'Ações não têm garantia de valor (podem cair). Tesouro IPCA sofre marcação a mercado e você pode perder dinheiro se sacar antes. Poupança perde pra inflação. CDB 100% CDI ou Tesouro Selic (agora D+0 até em fins de semana em alguns bancos) é o único lugar correto.' },
      { tipo: 'acao', titulo: 'Defina sua Meta de Reserva', conteudo: 'Vá até o menu de Metas e cadastre "Reserva de Emergência" atrelada ao CDB.', cta: 'Configurar Metas', ctaFn: "go('planos')" }
    ]
  },

  // ==========================================
  // TRILHA 2: FUNDAMENTOS / CLÁSSICOS (INTERMEDIÁRIO)
  // ==========================================
  {
    id: 'base_bab', trilha: 'base', title: 'O Homem Mais Rico da Babilônia', sub: 'Pague-se Primeiro', emoji: '📜', dur: '6 min', xp: 75, ok: false, grad: 'linear-gradient(135deg,#13283D,#29537A)',
    passos: [
      { tipo: 'teoria', titulo: 'Pague-se Primeiro', conteudo: 'A principal regra psicológica do livro: <strong style="color:#4A8BFF">Uma parte de tudo o que você ganha pertence a você.</strong> Não à concessionária, não à padaria, nem ao governo.', visual: '💰' },
      { tipo: 'regra', titulo: 'Pagamento como Imposto Inevitável', conteudo: 'A maioria das pessoas no Brasil gasta o salário e investe a "Sobra". O correto é tratar seu investimento com a mesma urgência que um FGC ou INSS retido na fonte. Tire do seu acesso no Dia 01.', exemplo: 'Caiu R$ 4.000? Automatize uma TED de R$ 400 para sua corretora e viva perfeitamente com R$ 3.600.' },
      { tipo: 'exemplo', titulo: 'Adaptação Hedônica do Brasileiro', conteudo: 'Se você ganhar um aumento, seu estilo de vida subirá automaticamente (restaurantes mais caros). "Pagar-se primeiro" força a adaptação hedônica a ser aliada do seu patrimônio.', calculo: { simples: 'Dinheiro na Conta Corrente = Será Gasto.', composto: 'Dinheiro invisível = Fica rendendo juros', delta: 'Psicologia Pura' } }
    ]
  },
  {
    id: 'base_juros', trilha: 'base', title: 'O Custo de Oportunidade BR', sub: 'A Matemática dos Juros Compostos', emoji: '📈', dur: '5 min', xp: 60, ok: false, grad: 'linear-gradient(135deg,#0D1C2E,#1A375C)',
    passos: [
      { tipo: 'teoria', titulo: 'O que o Brasil Ensina', conteudo: 'No Brasil convivemos historicamente com as <strong style="color:#4A8BFF">maiores taxas de juros reais do planeta</strong>. É o pior país do mundo para se ter dívidas, mas um dos melhores países do mundo para ser o *credor* (investidor).', visual: '🇧🇷' },
      { tipo: 'regra', titulo: 'A Regra dos 72', conteudo: 'Divida <strong style="color:#4A8BFF">72</strong> pela taxa anual de retorno (ex: Selic a 10%) e você sabe em quantos anos seu dinheiro dobra sozinho. 72 ÷ 10 = O dinheiro dobra a cada 7,2 anos reais no Brasil em Renda Fixa!', exemplo: 'R$ 100k viram R$ 200k em 7 anos. Que viram R$ 400k em 14 anos.' },
      { tipo: 'quiz', pergunta: 'Você decide não comprar uma nova TV de R$ 3.000 num mês e em vez disso coloca em um investimento brasileiro rendendo líquidos 10% a.a. por 21 anos. Qual o valor aproximado desses R$ 3.000 originais lá no fim na Regra dos 72?', opcoes: ['R$ 6.000', 'R$ 9.000', 'R$ 24.000', 'R$ 15.000'], correta: 2, expl: 'Pela Regra dos 72, 10% a.a. dobra o dinheiro a cada ~7 anos. Em 21 anos, são três ciclos de dobra. R$ 3k -> R$ 6k -> R$ 12k -> R$ 24.000. Uma única TV não comprada hoje financia meses inteiros de aposentadoria no futuro por causa das taxas altas do Brasil.' },
      { tipo: 'acao', titulo: 'Use Juros Brasileiros a seu Favor', conteudo: 'Veja nossa aba de Simulador de Juros e insira suas variáveis reais.', cta: 'Simulador', ctaFn: "go('invest_compostos')" }
    ]
  },

  // ==========================================
  // TRILHA 3: RENDA FIXA BR (AVANÇADO)
  // ==========================================
  {
    id: 'rf_ipca', trilha: 'renda_fixa', title: 'A Magia do Tesouro IPCA+', sub: 'O seu dinheiro intocável', emoji: '🏛️', dur: '7 min', xp: 90, ok: false, grad: 'linear-gradient(135deg,#1A375C,#005739)',
    passos: [
      { tipo: 'teoria', titulo: 'A Trindade da Renda Fixa', conteudo: 'No Brasil você tem opções pré-fixadas (rentabilidade fixa engessada), Pós-Fixadas (Selic, rende junto com o CDI) e as **Híbridas (IPCA+)** que garantem a inflação oficial + um juro real absurdo em cima.', visual: '📊' },
      { tipo: 'regra', titulo: 'Mantendo o Poder de Compra', conteudo: 'O Tesouro IPCA+ paga a inflação (IPCA) + ~6% ao ano. Isso significa que, independentemente se o Brasil virar uma Argentina amanhã (inflação 100%), o seu investimento reajustará o valor e entregará um lucro gigante real de 6% por cima. É a defesa máxima.', exemplo: 'Tesouro IPCA+ 2045 é um pilar de aposentadorias de brasileiros milionários.' },
      { tipo: 'exemplo', titulo: 'O Risco: Marcação a Mercado', conteudo: 'CUIDADO: Títulos pré e IPCA+ variam de preço TODOS OS DIAS antes do vencimento. Se os juros do país sobem, o valor atual do seu título CAI. Se carregar até a data combinada, você recebe exatamente a taxa combinada. Se resgatar no meio, pode perder dinheiro.', calculo: { simples: 'Guardar R$ 10k na Selic -> Cresce reto todo dia', composto: 'Tesouro IPCA+ -> Sobe e desce como ações (!)', delta: 'Risco de curto prazo' } },
      { tipo: 'quiz', pergunta: 'Você aplicou no Tesouro IPCA+ 2035 (pagando IPCA + 6%) porque precisava de juros altos, mas depois de 1 ano você se acidentou, perdeu emprego e precisou resgatar o dinheiro emergencialmente. Nesse exato momento, a taxa de juros futura do país estava disparando na lua. O que ocorre?', opcoes: ['Você receberá 100% de volta + lucro parcial, pois é Renda Fixa e a lei brasileira proíbe perda nominal de Renda Fixa estatal.', 'Você poderá ver um valor NEGATIVO. Receberá menos dinheiro do que aplicou porque sofreu Marcação a Mercado Negativa por resgatar título híbrido antes do prazo em período de curva de juros em alta.', 'O Tesouro bloqueia resgates em cenários assim, retendo até 2035.', 'Renda os IPCA e desconsidera os 6% atrelados no momento do resgate.'], correta: 1, expl: 'A armadilha número 1 do brasileiro avançado. Ao vender o Tesouro IPCA antes do prazo (2035) com a taxa do governo em ALTA, seu título velho vale MENOS e você sofre forte prejuízo nominal imediato (Marcação a mercado). Renda Fixa de prazo só é fixa SE VOCÊ LEVAR ATÉ O VENCIMENTO. Jamais coloque dinheiro que pode precisar a curto prazo em IPCA+, use o Selic.' }
    ]
  },
  {
    id: 'rf_fundos', trilha: 'renda_fixa', title: 'O Come-Cotas Vira-Lata', sub: 'Por que Fundos de Bancos Sugam Você', emoji: '🧛', dur: '5 min', xp: 70, ok: false, grad: 'linear-gradient(135deg,#3A1010,#7D1A1A)',
    passos: [
      { tipo: 'teoria', titulo: 'A Ilusão do Gerente de Banco', conteudo: 'Seu gerente oferece um "Fundo DI" ou um "Fundo de Renda Fixa". Além de taxas abusivas de administração (até 2% a.a.), os fundos brasileiros abertos possuem um impostos assassino invisível: O Come-Cotas.', visual: '💼' },
      { tipo: 'regra', titulo: 'O que é Come-Cotas?', conteudo: 'Em maio e novembro de cada ano, o Governo confisca as cotas do seu lucro de forma antecipada (15%). O problema não é pagar imposto. O problema é que isso ANQUILA a magia dos juros compostos. Como você perde fatias todo semestre, você tem menos principal base para render no mês seguinte.', exemplo: 'Investidor A (CDB direto - Sem come-cotas) destrói Investidor B (Fundo DI via gerente) em 20 anos apenas por causa dessa "mordida semestral".' },
      { tipo: 'acao', titulo: 'Rejeite Produtos Vendidos', conteudo: 'Compre títulos Tesouro Direto (não tem come-cotas) ou CDBs, LCI, LCAs diretamente na corretora.', cta: 'Ver Meus Investimentos', ctaFn: "go('invest')" }
    ]
  },

  // ==========================================
  // TRILHA 4: RENDA VARIÁVEL E ETFS (AVANÇADO)
  // ==========================================
  {
    id: 'rv_etfs', trilha: 'renda_var', title: 'A Revolução dos ETFs Bogleheads', sub: 'O Investidor Passivo de Sucesso', emoji: '🌐', dur: '6 min', xp: 85, ok: false, grad: 'linear-gradient(135deg,#54290C,#A15814)',
    passos: [
      { tipo: 'teoria', titulo: 'Ninguém Bate o Mercado a Longo Prazo', conteudo: 'Gestores formados em Harvard não conseguem escolher ações ("Stock Picking") melhores que a média do mercado após descontadas as comissões num prazo de 15 anos. Estatisticamente comprovado pelo conselho de Burton Malkiel e John Bogle.', visual: '📊' },
      { tipo: 'regra', titulo: 'A Filosofia Boglehead no Brasil', conteudo: 'Em vez de tentar acertar qual empresa vai subir (Petrobras ou Vale?), nós compramos "uma cesta global" pagando uma taxa mínima. <strong style="color:#FFAD3B">No Brasil usamos ETFs notíssimos:</strong> WRLD11 (Mundo Inteiro - VT), IVVB11 (S&P 500 dos EUA) e B5P211 (Renda fixa IPCA curta).', exemplo: 'Custo de adm de um fundo brasileiro (2%), Custo do WRLD11 (0.3% ao ano).' },
      { tipo: 'exemplo', titulo: 'A Superioridade do WRLD11', conteudo: 'Comprando R$ 100 de WRLD11 na B3 (bolsa nacional), você passa a ser sócio da Apple, Microsoft, Toyota, Nestlé e outras 9.000 ações ao mesmo tempo em dólares. A diversificação é automática e instantânea sem abrir conta exterior.', calculo: { simples: 'Brasil representa < 1% da riqueza do mundo', composto: 'WRLD11 te expõe aos 99% restantes', delta: 'Portfólio Antifrágil' } },
      { tipo: 'quiz', pergunta: 'Pela lógica de John Bogle aplicada ao Brasil, o que um investidor iniciante de bolsa de valores DEVERIA evitar fazer ativamente?', opcoes: ['Focar na sua carreira primária (trabalho) em vez do homebroker.', 'Comprar passivamente cotas de índices amplos através de ETFs WRLD11.', 'Tentar ler balanços, analisar DREs e escolher 10 Small Caps promissoras para fazer "Stock Picking" e ganhar alfa de 20% a.a.', 'Aplicar em CDB atrelado a inflação.'], correta: 2, expl: 'A ilusão do stock-picking: tentar bater o mercado escolhendo ações isoladas como "Small Caps" para o CPF brasileiro rende estresse, taxas abusivas de corretagem e perde dos benchmarks (IBOV, S&P) quase sempre a longo prazo. O caminho do investidor inteligente de Boglehead é ETFs baratos.' },
      { tipo: 'acao', titulo: 'Lance seus ETFs no Patrimônio', conteudo: 'Controle toda a diversificação no App sem olhar cotação diária esquizofrênica.', cta: 'Ver Minha Carteira', ctaFn: "go('invest')" }
    ]
  },

  // ==========================================
  // TRILHA 5: INDEPENDÊNCIA / FIRE NO BRASIL (AVANÇADO)
  // ==========================================
  {
    id: 'fire_math_br', trilha: 'fire', title: 'A Matemática FIRE (Adaptação BR)', sub: 'Trinity Study Pós-INSS', emoji: '🔥', dur: '7 min', xp: 100, ok: false, grad: 'linear-gradient(135deg,#2E1060,#471B96)',
    passos: [
      { tipo: 'teoria', titulo: 'Aposentadoria Antecipada Extrema (FIRE)', conteudo: 'A sigla <strong style="color:#9B7FFF">FIRE (Financial Independence, Retire Early)</strong> virou religião. O The Trinity Study revelou nos EUA a "Safe Withdrawal Rate" (SWR) de 4% ao ano. Se você saca 4% do seu dinheiro, não descapitaliza antes de morrer.', visual: '🇺🇸' },
      { tipo: 'regra', titulo: 'Adaptando para a Pátria (SWR 3,2%)', conteudo: 'Os 4% americanos preveem a moeda forte do Dólar e inflação controlada de NY. No Brasil Tupiniquim, especialistas conservadores de FIRE atestam matematicamente que nossa SWR é de <strong style="color:#FFAD3B">3.0% a 3.5% ao ano</strong>.', exemplo: '1 Milhão de Reais BR * 3.2% ao ano = R$ 32.000 / 12 meses = R$ 2.666 sem que o milhão morra.' },
      { tipo: 'exemplo', titulo: 'O Fim da Era da Esperança no INSS', conteudo: 'A pirâmide etária nacional ruiu (brasileiros têm menos filhos, vivem mais velhos). O INSS quebrará matematicamente e aidade passará dos 70 anos. O FIRE é blindagem matemática forçada via aportes paralelos.', calculo: { simples: 'Despesas anuais desejadas: 100 mil reais', composto: 'Regra dos 3.2% FIRE: (100k ÷ 0.032)', delta: 'Patrimônio alvo FIRE R$ 3.1 Milhões!' } },
      { tipo: 'quiz', pergunta: 'Segundo a escola FIRE Brasileira com SWR conservadora, se você decidir que viverá bem morando de aluguel e com lazer limitando os gastos do seu estilo de vida exato em absurdos R$ 4.000 REAIS POR MÊS. Qual montante precisa acumular?', opcoes: ['R$ 480.000,00', 'R$ 1.500.000,00', 'R$ 2.000.000,00', 'R$ 3.000.000,00'], correta: 1, expl: 'Pela regra 3.2%: Passos. 1) Valor anual: R$ 4.000 * 12 = R$ 48.000. 2) Aplicar FIRE SWR Módulo BR (R$ 48k ÷ 0.032): Dá exatos R$ 1.500.000. Com um milhão e meio no Brasil, investidos numa carteira diversificada boglehead/nacional sem viés especulativo, sua retirada cobre seu padrão pra sempre.' },
      { tipo: 'acao', titulo: 'Calcule seu FIRE BR no Menu', conteudo: 'Desenvolvemos esse exato engine de cálculo dentro do simulador da Aposentadoria FIRE para cruzar a matemática com as metas tupiniquins.', cta: 'Calcular Aposentadoria', ctaFn: "go('retire_fire')" }
    ]
  },
  {
    id: 'men_kahneman', trilha: 'fire', title: 'Psicologia e Aversão à Perda', sub: 'Thinking, Fast and Slow (Kahneman)', emoji: '🧠', dur: '5 min', xp: 60, ok: false, grad: 'linear-gradient(135deg,#1F103A,#3D2075)',
    passos: [
      { tipo: 'teoria', titulo: 'Por que o Brasileiro Vende na Baixa?', conteudo: 'O Prêmio Nobel Daniel Kahneman comprovou: o impacto psicológico da dor de perder R$ 1.000 é <strong style="color:#9B7FFF">DUAS VEZES MAIS FORTE</strong> que a alegria de ganhar os mesmos R$ 1.000.', visual: '🧠' },
      { tipo: 'regra', titulo: 'O Efeito da Manada', conteudo: 'Quando a Bolsa BR cai -20% durante a pandemia, todos os "novatos" desesperam-se com o número vermelho gigante no Home Broker (aversão absurda de perda) e vendem suas boas ações. Realizando o prejuízo no fundo do poço.', exemplo: 'Para ganhar muito dinheiro passivamente, a melhor coisa na Renda Variável BR é se comportar como se não tivesse a senha da corretora.' },
      { tipo: 'acao', titulo: 'O Dashboard Desconectado', cta: 'Lançar Novos Títulos', ctaFn: "go('investimentos')", conteudo: 'Nossa área de Patrimônio foi formatada para não ter tickers e cores piscantes do Day Trade, forçando tranquilidade perante a loucura diária do país.' }
    ]
  },
  // ==========================================
  // NOVAS AULAS BRASILEIRAS APROFUNDADAS (EXPANSÃO)
  // ==========================================
  {
    id: 'br_fgts', trilha: 'start', title: 'O Sequestro do FGTS', sub: 'Proteção ou Punição?', emoji: '💼', dur: '5 min', xp: 55, ok: false, grad: 'linear-gradient(135deg,#54290C,#A15814)',
    passos: [
      { tipo: 'teoria', titulo: 'O Fundo Intocável', conteudo: 'O FGTS retém 8% do seu salário na Caixa Econômica. O governo diz que é para te proteger caso seja demitido. O problema? Ele rende APENAS <strong style="color:#FFAD3B">3% a.a + TR</strong>.', visual: '🔒' },
      { tipo: 'regra', titulo: 'Destruição pelo IPCA', conteudo: 'Como a inflação histórica no Brasil é acima de 5%, seu FGTS perde poder de compra todos os anos. É dinheiro derretendo legalmente.', exemplo: '10 mil no FGTS em 2010 compravam um carro popular usado. Em 2024 não compram meia moto.' },
      { tipo: 'exemplo', titulo: 'Saque-Aniversário', conteudo: 'Muitos ativam o saque-aniversário para resgatar uma % desse dinheiro retido e investir num CDB de 10% a.a. O risco? Se for demitido sem justa causa, você NÃO CONSEGUE sacar o saldo total do FGTS, só a multa de 40%.', calculo: { simples: 'Manter no FGTS = Perde da Inflação', composto: 'Sacar e Investir em CDB = Bate Inflação', delta: 'Mas bloqueia o saque na demissão!' } },
      { tipo: 'quiz', pergunta: 'Por que matematicamente o FGTS (rendendo 3% + TR) é considerado por economistas como um "imposto invisível" disfarçado de benefício?', opcoes: ['Porque a Receita Federal taxa os saques do FGTS no Imposto de Renda em 27,5%.', 'Porque o rendimento fixo de 3% a.a. é sempre MENOR que a inflação real do Brasil. Logo, o trabalhador enriquece o governo (que empresta a juros altos) enquanto o próprio saldo do trabalhador perde poder de compra mês a mês.', 'Porque apenas 8% é muito pouco.', 'Porque não possui proteção contra calote bancário (FGC)'], correta: 1, expl: 'Extato. O governo recolhe a 3% ao ano e empresta esse mesmo dinheiro seu para projetos imobiliários cobrando 12% a.a. Ele lucra o spread. Você sofre e seu dinheiro não acompanha nem os preços do supermercado.' },
      { tipo: 'acao', titulo: 'Monitore seus Ativos Reais', conteudo: 'Foque em construir uma aba de Patrimônio com investimentos livres, que rendam acima de Selic e IPCA.', cta: 'Ver Meus Investimentos', ctaFn: "go('invest')" }
    ]
  },
  {
    id: 'br_imoveis', trilha: 'start', title: 'Financiamento Imobiliário', sub: 'O Sonho da Casa Própria vs Matemática', emoji: '🏠', dur: '7 min', xp: 75, ok: false, grad: 'linear-gradient(135deg,#0D291F,#1A533E)',
    passos: [
      { tipo: 'teoria', titulo: 'O Maior Contrato da sua Vida', conteudo: 'O brasileiro é ensinado que "aluguel é jogar dinheiro fora". Mas financiar um imóvel em 30 anos (360 meses) com taxas nominais no Brasil (11% a.a.) pode significar <strong style="color:#FFAD3B">pagar 3 imóveis e levar 1</strong>.', visual: '🏠' },
      { tipo: 'regra', titulo: 'Tabela SAC vs PRICE', conteudo: '<strong style="color:#00D991">SAC:</strong> Parcelas começam caras e caem. A maioria da parcela amortiza o saldo devedor desde o início. <strong style="color:#FF4F6E">PRICE:</strong> Parcelas fixas, mas no início você paga 90% só de juros ao banco sem diminuir a dívida real.', exemplo: 'Se puder escolher, vá de SAC. O susto inicial compensa a economia total.' },
      { tipo: 'exemplo', titulo: 'O Hack da Amortização de Prazo', conteudo: 'No Brasil, você pode pagar as parcelas "de trás pra frente" usando o FGTS ou Renda Extra. Ao amortizar o PRAZO, você arranca o multiplicador de juros (o tempo) do banco.', calculo: { simples: 'Pagar 1 parcela mensal = 30 anos sofrendo', composto: 'Pagar 1 parcela + 1 extra no final = Quitar em 15 anos', delta: 'Menos da metade dos juros!' } },
      { tipo: 'quiz', pergunta: 'Você contraiu um financiamento de R$ 300.000 em 360 meses (SAC). A parcela atual é R$ 3.000 (R$ 2.400 de juros e seguro + R$ 600 de amortização da dívida). Se você mandar R$ 1.200 extras pelo App da Caixa para AMORTIZAR NO PRAZO. O que acontece?', opcoes: ['Apenas a sua próxima fatura do mês vem mais barata, mas as outras permanecem.', 'Os R$ 1.200 matam DUAS parcelas inteiras do final do contrato (360 e 359), porque lá não há juros embutidos ainda.', 'Os R$ 1.200 reduzem R$ 1.200 reais dos R$ 300.000 originais, mas você tem que pagar juro sobre os R$ 1.200.', 'Nada muda no Custo Efetivo Total.'], correta: 1, expl: 'A amortização no Prazo ataca "de trás pra frente". Como nos juros do Brasil a maior parte da parcela inicial é puro juro do banco, as parcelas finais são compostas quase só pelo "valor puro emprestado". Com R$ 1.200 extras hoje, você queima várias parcelas finais e poupa meses da sua vida financeira.' },
      { tipo: 'acao', titulo: 'Programe Suas Amortizações', conteudo: 'Use as Metas Mensais no app para separar um valor só para Amortizar mês a mês seu contrato.', cta: 'Configurar Budgets', ctaFn: "go('envelopes')" }
    ]
  },
  {
    id: 'base_isencao', trilha: 'renda_fixa', title: 'LCI, LCA e Isenção Fiscal', sub: 'Por que 90% vence de 105%', emoji: '🛡️', dur: '5 min', xp: 60, ok: false, grad: 'linear-gradient(135deg,#16082B,#2E1060)',
    passos: [
      { tipo: 'teoria', titulo: 'Letras de Crédito', conteudo: 'CDB (Empréstimo genérico pro banco), LCI (Banco usa para Imóveis) e LCA (Para grãos/Agro). Para estimular o Agro e a Construção, o Governo brasileiro deixou LCI e LCA <strong style="color:#00D991">ISENTOS DE IMPOSTO DE RENDA</strong>.', visual: '🌾' },
      { tipo: 'regra', titulo: 'A Matemática do Imposto', conteudo: 'Um CDB de 105% do CDI pode perder para uma LCI de "apenas" 90% do CDI, porque o CDB sofrerá tabela regressiva de IR de 22,5% a 15% na hora do resgate. A LCI cai limpa na sua conta.', exemplo: 'Rende mais? Converta o CDB multiplicando sua taxa por (1 - Taxa do IR) e veja se bate a LCI isenta.' },
      { tipo: 'acao', titulo: 'Monitore seus CDBs e LCIs', conteudo: 'Ao lançar ativos ali no Patrimônio, note sempre a diferença da tributação na previsão do seu App Custo Zero.', cta: 'Ver Patrimônio', ctaFn: "go('invest')" }
    ]
  },
  {
    id: 'rf_fgc', trilha: 'renda_fixa', title: 'O Fundo Garantidor', sub: 'A ilusão da Segurança Infinita', emoji: '🏰', dur: '6 min', xp: 70, ok: false, grad: 'linear-gradient(135deg,#361F05,#73410B)',
    passos: [
      { tipo: 'teoria', titulo: 'O Anjo da Guarda dos Bancos', conteudo: 'O FGC (Fundo Garantidor de Crédito) garante seu dinheiro até R$ 250.000 por CPF/Instituição (teto de R$ 1 Mi) caso o banco quebre. É isso que nos faz comprar CDB de banquinho duvidoso pagando 120% do CDI.', visual: '🛡️' },
      { tipo: 'regra', titulo: 'O Risco de Liquidez Oculto', conteudo: 'O FGC funciona e ele TE PAGA. Mas ele <strong style="color:#E94560">NÃO TE PAGA NA HORA</strong>. Entre o Banco Rural estourar e o FGC cair na sua conta corrente via portabilidade, podem se passar semanas ou MÊSES.', exemplo: 'Se sua Reserva de Emergência estava num banco quebrado protegido pelo FGC... Como paga a cirurgia hoje de noite?' },
      { tipo: 'quiz', pergunta: 'Você aplicou sua Reserva de Emergência (R$ 20.000) num CDB de liquidez diária do "Banco XYZ" (pagando incríveis 130% CDI) que tem selo do FGC. O Banco XYZ decreta falência no feriado prolongado. Você quebrou a perna na terça. O que deve ocorrer?', opcoes: ['O FGC detecta a quebra e em 24h deposita na sua via PIX pelo CPF cadastrado no Bacen.', 'O investimento vira pó porque rendimentos absurdos anulam a garantia civil de proteção de crédito.', 'O FGC honrará seus R$ 20.000 + Juros até a data da falência. PORÉM será um trâmite burocrático, você receberá um ofício, preencherá papéis via App/Agência e pode demorar de semanas a meses para o dinheiro cair. Você está sem grana para a cirurgia urgente.', 'O FGC te paga na hora na Caixa.'], correta: 2, expl: 'A armadilha mortal do brasileiro rentista. Colocar reserva de EMERGÊNCIA (que precisa sair na D+0) em bancos nanicos arriscados só pelo FGC. O FGC te protege da perda eterna, mas NÃO protege você do travamento de liquidez na hora do caos. Reserva é em banco de primeira linha (Itaú, Nubank massificado, Tesouro Direto do Governo).' },
      { tipo: 'acao', titulo: 'Epare suas Caixinhas', conteudo: 'O Meu Contador te ajuda a categorizar por nível de liquidez. Separe sua Poupança do Curto e do Longo Przo na área de Planejamento!', cta: 'Planejamento e Caixinhas', ctaFn: "go('planos')" }
    ]
  },
  {
    id: 'rv_fiis', trilha: 'renda_var', title: 'FIIs: Viver de Aluguel', sub: 'A Paixão Brasileira por Shoppings', emoji: '🏢', dur: '6 min', xp: 80, ok: false, grad: 'linear-gradient(135deg,#0D1C2E,#1A375C)',
    passos: [
      { tipo: 'teoria', titulo: 'Em Tijolo Eu Confio', conteudo: 'O brasileiro sempre preferiu investir em imóveis. Mas comprar um apto de R$ 300k, pagar IR de 27,5% no aluguel e ter inquilino estragando a torneira é duro. Os **FIIs (Fundos Imobiliários)** resolvem isso.', visual: '🏬' },
      { tipo: 'regra', titulo: 'Renda Isenta Todo Mês', conteudo: 'Comprando cotas (ex: R$ 100), você vira de dono de frações de galpões logísticos (Amazon, MercadoLivre) e shoppings prime em São Paulo. O fundo aluga, gerencia tudo e distribui o aluguel limpo na sua conta. <strong style="color:#00D991">E é ISENTO DE IMPOSTO.</strong>', exemplo: 'Apto Físico rende: ~4% a.a bruto. Carteira de FIIs rende: ~8 a 10% a.a ISENTO.' },
      { tipo: 'exemplo', titulo: 'O Perigo dos "Dividend Yields" Explosivos', conteudo: 'A cota de um FII pode cair (Marcação a mercado ou vacância no prédio). Quem olha apenas que um fundo pagou 18% ao ano na tela do broker ("DY Mágico"), geralmente está comprando Fundo de Papel super arriscado ou um fundo despencando.', calculo: { simples: 'FII High-Yield (18% a.a) -> Calote no Galpão', composto: 'FII Tijolo Prime (8% a.a) -> Aluguel eterno', delta: 'Risco vs Retorno Clássico' } },
      { tipo: 'acao', titulo: 'Veja a Magia dos Dividendos no App', conteudo: 'Em nossa área de Patrimônio você terá todos os aluguéis unificados somados na métrica Passiva. Compre ações e crie a meta.', cta: 'Lançar Novos Títulos', ctaFn: "go('invest')" }
    ]
  },
  {
    id: 'rv_dolar', trilha: 'renda_var', title: 'Dolarização Cega', sub: 'Protegendo do Risco Brasil', emoji: '💵', dur: '5 min', xp: 75, ok: false, grad: 'linear-gradient(135deg,#002B1D,#005739)',
    passos: [
      { tipo: 'teoria', titulo: 'A Moeda Forte Soberana', conteudo: 'O Real (BRL) é uma moeda de mercado emergente e altamente inflacionária desde sua criação nos anos 90, oscilando por decretos e tweets macroeconômicos. Manter toda sua riqueza em reais a vida toda é um risco não diversificável.', visual: '🦅' },
      { tipo: 'regra', titulo: 'Descorrelação Estatística', conteudo: 'Geralmente, quando ativos brasileiros (Ibovespa) sofrem choques e caem forte, o Dólar no mundo SOFTA (sobe). Se você tem investimentos globais (S&P 500) em dólar, seu patrimônio se auto-defende.', exemplo: 'Ibovespa despencou 5% numa terça. Mas o dólar subiu 4% frente ao real. O seu fundo VT (EUA) compensou a queda aqui de dentro pelo câmbio.' },
      { tipo: 'acao', titulo: 'Rebalanceie seu Portfólio', conteudo: 'Use ETFs globais listados aqui mesmo na B3, como o WRLD11 e o IVVB11 para atrelar a % da carteira à saúde da Microsoft, Amazon e Apple em dólar forte.', cta: 'Ver Meus Investimentos', ctaFn: "go('invest')" }
    ]
  },
  {
    id: 'fire_pgbl', trilha: 'fire', title: 'O Hack do PGBL (Previdência)', sub: 'A Restituição Massiva de IR', emoji: '🧾', dur: '8 min', xp: 100, ok: false, grad: 'linear-gradient(135deg,#2B0A0E,#5C1822)',
    passos: [
      { tipo: 'teoria', titulo: 'O Governo te dá Dinheiro?', conteudo: 'Ao fazer uma **Previdência PGBL**, o governo do Brasil permite que você esconda da Receita Federal até <strong style="color:#00D991">12% da sua renda bruta no ano</strong>. Se você declara via modelo completo, seu Imposto a Pagar desaba.', visual: '🎩' },
      { tipo: 'regra', titulo: 'Como a bruxaria funciona?', conteudo: 'Renda de R$ 100 mil/ano. Você investe R$ 12.000 num PGBL (Fundo atrelado à inflação ou renda fixa de sua escolha corretora XP/BTG etc). O governo calcula seu imposto sobre APENAS 88 mil. O montante de IR que o governo "esquece" de te cobrar te é devolvido em CASH na Restituição anual de Lote.', exemplo: 'R$ 12k aportados no PGBL podem gerar estornos automáticos de R$ 3.300 em dinheiro livre na conta num ano.' },
      { tipo: 'exemplo', titulo: 'PGBL x VGBL e TABELA REGRESSIVA', conteudo: 'VGBL não deduz os 12%, mas você só paga imposto sobre os LUCROS. PGBL deduz os 12%, mas você pagará imposto sobre TUDO (Lucro + Aporte) quando for velho. Mande o PGBL na Tabela Regressiva após 10 anos a taxa de saída na veia será os ínfimos módicos 10%.', calculo: { simples: 'IRPF normal = Paga 27,5% todo ano.', composto: 'PGBL = Adia IR por décadas em fundo composto e paga 10% lá nos 65 anos de idade!', delta: 'Vantajem de tempo (Free Lunch)' } },
      { tipo: 'quiz', pergunta: 'Você ganha bem (30 mil/mês), e paga um absurdo de imposto na FONTE de Renda Pessoa Física. Seu imposto é deduzido modelo COMPLETO por ter família e afins. O conselheiro do banco disse para investir muito em **VGBL** na tabela progressiva. Ele está indicando a melhor matemática de enriquecimento pra ti?', opcoes: ['Sim. VGBL deduz 12% da renda anual isentando o que é pago na fonte nos altos escalões.', 'Não. O conselheiro recomendou os piores fatores pra ti. Como tens alta renda do modelo Completo, tu **deves** optar brutalmente pelo PGBL (não VGBL) para estornar legalmente 12% da renda do seu Imposto na Fonte e deve escolher a tabela Regressiva pra bater só 10% daqui a décadas na saída da sua velhice.', 'VGBL e PGBL têm rentabilidade isenta total de IR logo o modelo progressivo ajuda em todos fatores.', 'PGBL usa regra SWR da Trinity.'], correta: 1, expl: 'PGBL + Regressiva (após 10 anos com imposto lá nos chãos de 10%). Este é a maior lei tributária existente para profissionais liberais e celetistas modelo Completo de alta renda.' },
      { tipo: 'acao', titulo: 'Acesse o Modulo FIRE e Calcule Aposentadoria!', conteudo: 'Nessa simulação, calcule o tempo que demorará usando essa super otimização na jornada! Lembre da margem FIRE dos 3.2%!', cta: 'Calcular Aposentadoria', ctaFn: "go('retire_fire')" }
    ]
  },
  {
    id: 'men_status', trilha: 'mental', title: 'O Monstro do Status Social', sub: 'O Vizinho com HRV Nova', emoji: '🏎️', dur: '5 min', xp: 60, ok: false, grad: 'linear-gradient(135deg,#1F103A,#3D2075)',
    passos: [
      { tipo: 'teoria', titulo: 'O Paradoxo do Luxo', conteudo: 'Você compra uma Compass/HRV de 200 mil ou o IPhone último modelo para ser adorado pelas pessoas. Morgan Housel alerta: <strong style="color:#FF4F6E">Ninguém admira você. As pessoas admiram o objeto e se imaginam dentro ou sendo donas dele</strong>.', visual: '🧠' },
      { tipo: 'regra', titulo: 'Treadmill Social', conteudo: 'Se você gasta todo o seu limite para "parecer rico", você é, na verdade, alguém em via rápida da falência. O carro zero não produz patrimônio, gera depreciação severa instantânea de -20% ao tirar da loja de automóvel + IPVA Brasil.', exemplo: 'Quer ser milionário? Pouse os olhos para bilionários de camisa lisa.' },
      { tipo: 'acao', titulo: 'Orçamento com Liberdade', conteudo: 'Vá montar envelopes sensatos para seu lazer no app. Esqueça inflacionar seu Budget baseando-se no financiamento de SUV de outras pessoas.', cta: 'Meu Budget', ctaFn: "go('budget')" }
    ]
  },

  // ==========================================
  // TRILHA 6 — DIVIDENDOS BRASILEIROS (Bazin / Barsi)
  // ==========================================
  {
    id: 'div_bazin', trilha: 'dividendos', title: 'A Escola Brasileira de Dividendos', sub: 'Bazin, Barsi e a Renda Perpétua', emoji: '💰', dur: '7 min', xp: 90, ok: false, grad: 'linear-gradient(135deg,#002B10,#00552A)',
    passos: [
      { tipo: 'teoria', titulo: 'Faça Fortuna com Ações (Décio Bazin)', conteudo: 'Décio Bazin escreveu em 1992 o livro-bíblia dos investidores de dividendos brasileiros. A tese central: <strong style="color:#00D991">empresas que pagam bons dividendos de forma consistente são saudáveis e lucrativas</strong>. Luiz "Bilionário" Barsi Filho é o maior praticante dessa escola. Comprou ITSA4 e TAESA3 por décadas, reinvestindo os dividendos.', visual: '📖' },
      { tipo: 'regra', titulo: 'A Regra dos 6% de Dividend Yield', conteudo: 'Bazin estabeleceu: Dividend Yield abaixo de <strong style="color:#00D991">6% a.a.</strong> não cobre a inflação histórica brasileira. Empresa que não paga ao menos 6% não merece capital de um investidor razoável.', exemplo: 'TAESA3, BBAS3, ITSA4 historicamente pagam DYs acima de 6%. Ações de crescimento como startups pagam zero.' },
      { tipo: 'exemplo', titulo: 'O Efeito Bola de Neve do Reinvestimento', conteudo: 'Ao receber R$ 800 de dividendos mensais e reinvesti-los em mais ações geradoras de dividendos, sua renda passiva cresce exponencialmente. Barsi fez isso por décadas sem vender uma ação.', calculo: { simples: 'Gastar dividendos = Renda fixa para sempre', composto: 'Reinvestir dividendos = Avalanche exponencial de renda', delta: 'Décadas de paciência composta' } },
      { tipo: 'quiz', pergunta: 'Uma ação paga Dividend Yield de 3,5% ao ano. Segundo Décio Bazin aplicado ao Brasil, o que você deve fazer?', opcoes: ['Comprar em dobro. Qualquer dividendo é dinheiro grátis.', 'Ignorar ou rejeitar. 3,5% não cobre a inflação e fica bem abaixo do CDI (~10% a.a.) e do patamar mínimo de Bazin (6%).', 'Analisar somente o preço da cota, ignorando o dividendo.', 'Vender na hora da declaração do dividendo.'], correta: 1, expl: 'Pela Regra dos 6% de Bazin, um DY de 3,5% é abaixo do limiar. Competindo com CDB 100% CDI (~10,5% a.a.) sem risco, a empresa estaria entregando retorno insuficiente. Alta qualidade = distribui pelo menos 6% via dividendo de forma consistente por anos.' },
      { tipo: 'acao', titulo: 'Monte sua Carteira de Dividendos', conteudo: 'Lance seus ativos de dividendos na área de Patrimônio e acompanhe a Renda Passiva Total crescer mês a mês.', cta: 'Ver Meus Investimentos', ctaFn: "go('invest')" }
    ]
  },
  {
    id: 'div_reinvest', trilha: 'dividendos', title: 'Vivendo de Renda Passiva', sub: 'O Orçamento que se Paga Sozinho', emoji: '🎯', dur: '5 min', xp: 70, ok: false, grad: 'linear-gradient(135deg,#003319,#006633)',
    passos: [
      { tipo: 'teoria', titulo: 'O Sonho do Fluxo de Caixa Infinito', conteudo: 'A meta final do investidor de dividendos: cada envelope do orçamento é pago por ativos. Conta de Luz → TAESA3. Plano de Saúde → BBAS3. Supermercado → ITSA4. Você trabalha quando quiser.', visual: '🏖️' },
      { tipo: 'regra', titulo: 'O Cálculo da Liberdade por Envelope', conteudo: 'Se sua conta de luz é R$ 200 e sua carteira de FIIs rende DY 8% a.a. (0,67% ao mês): você precisa de <strong style="color:#00D991">R$ 200 ÷ 0,0067 = R$ 29.800 investidos</strong> para essa conta ser paga eternamente por dividendos.', exemplo: 'Repita para cada envelope do budget. A soma é sua meta de independência parcial.' },
      { tipo: 'exemplo', titulo: 'Independência Parcial é Poder', conteudo: 'Você não precisa ter 100% das contas pagas por dividendos para ter liberdade. Se 30% das suas despesas fixas são cobertas passivamente, você pode aceitar empregos com mais propósito e menos salário, ou trabalhar menos horas.', calculo: { simples: '0% das contas cobertas = Escravo do salário', composto: '50% das contas cobertas = Liberdade cirúrgica real', delta: 'O meio-caminho muda tudo' } },
      { tipo: 'acao', titulo: 'Configure seus Envelopes e Metas', conteudo: 'No app, crie um envelope para cada despesa fixa e calcule quanto patrimônio gera dividendos suficientes para cobri-la.', cta: 'Configurar Envelopes', ctaFn: "go('budget')" }
    ]
  },

  // ==========================================
  // TRILHA 7 — CRIPTO E BITCOIN
  // ==========================================
  {
    id: 'cripto_btc', trilha: 'cripto', title: 'Bitcoin: Dinheiro sem Estado', sub: 'O White Paper de Satoshi Nakamoto (2008)', emoji: '₿', dur: '8 min', xp: 100, ok: false, grad: 'linear-gradient(135deg,#2D1800,#5C3300)',
    passos: [
      { tipo: 'teoria', titulo: 'A Crise de 2008 e a Resposta de Satoshi', conteudo: 'Em setembro de 2008, o Lehman Brothers quebrou. Governos imprimiram trilhões. Em outubro, um pseudônimo chamado Satoshi Nakamoto publicou um white paper de 9 páginas: <strong style="color:#F7931A">Bitcoin – A Peer-to-Peer Electronic Cash System.</strong> A proposta: dinheiro que nenhum governo pode inflacionar ou confiscar.', visual: '₿' },
      { tipo: 'regra', titulo: 'Escassez Absoluta Programada', conteudo: 'Nunca existirão mais de <strong style="color:#F7931A">21 milhões de bitcoins</strong>. Nenhum presidente ou banco central cria mais. Diferente do Real (perdeu 99,6% do poder de compra desde 1994), o Bitcoin tem desinflação programada via "halvings" a cada 4 anos até 2140.', exemplo: 'O Real de 1994 vale R$ 0,004 hoje. O Bitcoin de 2013 (US$ 100) valia ~US$ 100.000 em 2024.' },
      { tipo: 'exemplo', titulo: 'Bitcoin como Reserva de Valor Assimétrica', conteudo: 'Ray Dalio, Michael Saylor e o Fundo de Pensão de Wisconsin alocam 1% a 5% do portfólio em Bitcoin como seguro contra a desvalorização das moedas fiduciárias. Se vai a zero, você perde 1-5%. Se valoriza 10x, seu portfólio inteiro sobe 10-50%.', calculo: { simples: 'Alocar 0% em BTC = Zero risco, zero assimetria', composto: 'Alocar 1-5% em BTC = Risco baixo, upside brutal', delta: 'Assimetria positiva calculada' } },
      { tipo: 'quiz', pergunta: 'Um amigo te indica uma "criptomoeda nova" que criadores anônimos prometem 1000% em 3 meses via "staking garantido". O que você faz?', opcoes: ['Alocar 40% do patrimônio. O staking garante os retornos prometidos.', 'Ignorar completamente. Qualquer cripto que não seja Bitcoin ou Ethereum (com anos de teste comprovado) com promessa de retorno garantido é estatisticamente uma shitcoin ou pirâmide. 95% delas vão a zero.', 'Separar R$ 50.000 e tentar a sorte com o dinheiro que pode perder.', 'Verificar se tem "white paper" e então investir 10%.'], correta: 1, expl: '99%+ das altcoins são esquemas de pirâmide ou cassinos. O Bitcoin tem 16 anos de teste e nunca foi hackeado. Princípio conservador: APENAS Bitcoin (e talvez Ethereum) com no MÁXIMO 1% a 5% do patrimônio, e JAMAIS algo que prometa retorno "garantido".' },
      { tipo: 'acao', titulo: 'Adicione Bitcoin ao Patrimônio', conteudo: 'Lance seu BTC na área de Patrimônio como qualquer outro ativo e acompanhe o percentual da carteira.', cta: 'Ver Meus Investimentos', ctaFn: "go('invest')" }
    ]
  },
  {
    id: 'cripto_risco', trilha: 'cripto', title: 'Altcoins: O Cemitério dos CPFs', sub: 'Shitcoins, Esquemas e Ilusões', emoji: '💀', dur: '5 min', xp: 65, ok: false, grad: 'linear-gradient(135deg,#2D0A0A,#5C1414)',
    passos: [
      { tipo: 'teoria', titulo: 'O Brasil Amou as Shitcoins', conteudo: 'O Brasil está entre os países com mais vítimas de fraudes cripto do mundo. De TerraLuna (LUNA virou pó overnight com US$ 40 bilhões evaporados) ao GAS Token e DreamMax, brasileiros perderam bilhões em tokens de 6 meses de vida.', visual: '💀' },
      { tipo: 'regra', titulo: 'Os 3 Sinais Claros de Fraude', conteudo: '<strong style="color:#E94560">1. Rendimento garantido</strong> — nenhum ativo real garante nada. <strong style="color:#E94560">2. Você precisa recrutar novos membros</strong> para aumentar seu rendimento (pirâmide pura). <strong style="color:#E94560">3. Equipe anônima</strong> sem histórico verificável.', exemplo: 'Qualquer token que usa "mineração de nuvem", "staking de 500%", "novo Bitcoin" ou "Tokenomics revolucionários" é sinal vermelho máximo.' },
      { tipo: 'quiz', pergunta: 'Qual é o ÚNICO critério que garante que uma criptomoeda não é uma fraude baseado no histórico de 15 anos do mercado?', opcoes: ['Ter white paper publicado em inglês técnico.', 'O influenciador que divulgou tem mais de 1 milhão de seguidores.', 'Nenhum critério garante 100%. Mas os únicos com provas de resistência comprovadas por anos são Bitcoin e Ethereum. Todo o resto é especulação de alto risco.', 'Estar listada em exchanges conhecidas como Binance.'], correta: 2, expl: 'Exchanges conhecidas já listaram TerraLuna, FTX Token, LUNA e centenas de outros que foram a zero. A listagem não garante nada. Apenas produtos com anos de teste real do mundo, sem promessas, sem "fundadores famosos", resistem. Bitcoin: 16 anos de operação ininterrupta sem hack.' },
      { tipo: 'acao', titulo: 'Controle a % de Risco da Carteira', conteudo: 'No Patrimônio do App, classifique cripto como "Ativo de Risco" e mantenha abaixo de 5% do total.', cta: 'Ver Meus Investimentos', ctaFn: "go('invest')" }
    ]
  },

  // ==========================================
  // TRILHA 8 — BLINDAGEM SUCESSÓRIA
  // ==========================================
  {
    id: 'suc_itcmd', trilha: 'sucessao', title: 'ITCMD: O Leão na Sua Morte', sub: 'O Imposto que Aniquila Heranças Brasileiras', emoji: '📜', dur: '7 min', xp: 90, ok: false, grad: 'linear-gradient(135deg,#1A0A2B,#3D1A60)',
    passos: [
      { tipo: 'teoria', titulo: 'O Imposto que sua Família Paga', conteudo: 'O ITCMD (Imposto de Transmissão Causa Mortis e Doação) é cobrado pelos Estados sobre toda herança e doação. SP: <strong style="color:#E94560">4%</strong>. RJ: <strong style="color:#E94560">até 8%</strong>. A Reforma Tributária em tramitação pode elevar o teto federal progressivo para <strong style="color:#E94560">até 16%</strong> sobre grandes patrimônios.', visual: '💀' },
      { tipo: 'regra', titulo: 'O Calvário do Inventário Judicial', conteudo: 'Quando alguém morre com bens (imóvel, carro, conta bancária), os herdeiros precisam abrir um INVENTÁRIO. Em média: <strong style="color:#E94560">2 a 5 anos de duração</strong>. Os bens ficam congelados. Paga-se advogado, cartório e ITCMD no final.', exemplo: 'Um imóvel de R$ 500.000 pode custar R$ 60.000 a R$ 100.000 em inventário, advogado, ITCMD e cartório.' },
      { tipo: 'exemplo', titulo: 'A Solução: Produtos que Não Entram em Inventário', conteudo: 'Alguns produtos financeiros <strong style="color:#00D991">pulam o inventário completamente</strong> ao nomear beneficiário: Seguro de Vida, VGBL, CDB com beneficiário cadastrado. O dinheiro vai direto em ~20 dias sem processo judicial, sem ITCMD e sem advogado.', calculo: { simples: 'Herança via Imóvel: 2 a 5 anos + ITCMD + custas judiciais', composto: 'Herança via Seguro: 20 dias + isenção total de imposto', delta: 'Planejamento estratégico muda tudo' } },
      { tipo: 'quiz', pergunta: 'Seu pai tem R$ 1,5 milhão em imóvel (único bem). Ele morre sem testamento ou blindagem. Você é o único filho. O que acontece?', opcoes: ['Você recebe o imóvel na semana seguinte via registro automático do cartório, pois é único herdeiro.', 'Você precisa abrir inventário judicial que pode durar anos. Paga entre R$ 60k a R$ 120k entre advogado, ITCMD e cartório. O imóvel fica bloqueado sem poder ser vendido ou alugado durante todo esse tempo.', 'As dívidas do pai são somadas e abatidas do imóvel antes da transferência automática.', 'Como está em nome do pai, o imóvel vai a leilão automático do governo.'], correta: 1, expl: 'O inventário judicial é um dos processos mais lentos e dolorosos do sistema jurídico brasileiro. Um imóvel pode travar o patrimônio familiar por anos. A prevenção: planejamento sucessório com Testamento + Escritura formal de Doação e/ou prioridade em ativos que não passam em inventário (seguro de vida, VGBL, previdência com beneficiário).' },
      { tipo: 'acao', titulo: 'Mapeie seu Patrimônio Total', conteudo: 'No Meu Contador, classifique seus ativos por liquidez e sucessão. Saiba exatamente o que será bloqueado e o que passará direto para seus herdeiros.', cta: 'Ver Meus Investimentos', ctaFn: "go('invest')" }
    ]
  },
  {
    id: 'suc_seguro', trilha: 'sucessao', title: 'Seguro de Vida: O Ativo Invisível', sub: 'Sua Maior Alavanca Patrimonial', emoji: '🛡️', dur: '5 min', xp: 70, ok: false, grad: 'linear-gradient(135deg,#2B001A,#5C0035)',
    passos: [
      { tipo: 'teoria', titulo: 'O Produto Financeiro Mais Subestimado', conteudo: 'O brasileiro odeia ouvir sobre seguro de vida. Mas um seguro de vida individual bem calibrado (pago R$ 200/mês, família recebe R$ 1.000.000 em 5 dias sem inventário) é o produto com o maior alavancamento possível da história financeira humana.', visual: '🛡️' },
      { tipo: 'regra', titulo: 'Quem DEVE Ter Seguro de Vida?', conteudo: 'Todo chefe de família com filhos dependentes, dívidas (financiamento imobiliário) e patrimônio ainda em construção. Se você tem apenas 30 anos e um financiamento de R$ 400.000, um sinistro deixa sua família herdando uma dívida, não um patrimônio.', exemplo: 'Custo típico: R$ 50–200/mês para cobertura de R$ 500k a R$ 2M, dependendo da idade e saúde.' },
      { tipo: 'acao', titulo: 'Calcule sua Necessidade de Cobertura', conteudo: 'Some todas suas dívidas + (despesas mensais × número de anos que seus dependentes precisariam de suporte) = Capital que o seguro deve cobrir.', cta: 'Ver Metas Financeiras', ctaFn: "go('planos')" }
    ]
  },

  // ==========================================
  // TRILHA 9 — RENDA ATIVA / MILHAS E CASHBACK
  // ==========================================
  {
    id: 'ra_milhas', trilha: 'renda_ativa', title: 'Milhas vs Cashback: A Matemática', sub: 'Viagem Grátis ou Dinheiro de Volta?', emoji: '✈️', dur: '6 min', xp: 70, ok: false, grad: 'linear-gradient(135deg,#002244,#003F88)',
    passos: [
      { tipo: 'teoria', titulo: 'O Custo de Oportunidade do Débito', conteudo: 'Quem paga no débito perde dois benefícios: <strong style="color:#4A8BFF">1) Cashback ou milhas</strong> que o crédito geraria. <strong style="color:#4A8BFF">2) O "float" de 30 dias</strong> — dinheiro rendendo no Tesouro Selic até o vencimento da fatura. Isso sem nenhum custo, desde que a fatura seja paga 100% todo mês.', visual: '💳' },
      { tipo: 'regra', titulo: 'Quando Milhas > Cashback', conteudo: 'Milhas valem <strong style="color:#4A8BFF">R$ 0,025 a R$ 0,04 cada</strong> quando trocadas por passagens internacionais em Business Class. Um cartão emitindo 2 milhas por real gera ~5% de retorno por compra. Um cashback padrão de 1% perde feio.', exemplo: 'R$ 3.000 de gasto mensal no cartão de milhas = ~180 milhas de bônus em promoções = trecho de voo grátis a cada 10 meses.' },
      { tipo: 'exemplo', titulo: 'Quando Cashback > Milhas', conteudo: 'Para quem viaja pouco ou não quer gestão de pontos: cartão com cashback de 1,5% a 2% é mais simples e previsível. Cartões como Inter Black e Caixa Visa pagam cashback direto na fatura.', calculo: { simples: 'Cartão com Milhas: 1 voo SP-Europa Business/ano', composto: 'Cartão Cashback 1.5%: R$ 540/ano em dinheiro de volta', delta: 'Depende do perfil de viagem!' } },
      { tipo: 'quiz', pergunta: 'Você gasta R$ 5.000/mês no cartão. Tem um cartão que dá 2 milhas por real e outro 1,5% cashback flat. Você viaja ao menos 1x ao ano em passagem longa. Qual gera MAIS valor?', opcoes: ['Cashback 1.5% = R$ 75/mês em dinheiro = R$ 900/ano. É visível e simples.', 'Milhas 2x/real = 10.000 milhas/mês = 120.000 milhas/ano. Uma passagem Business SP-Europa pode custar 70-90k milhas e valer R$ 12.000 a R$ 20.000 de mercado. A milha VENCE o cashback para quem sabe resgatar no momento certo.', 'Os dois são iguais.', 'Nenhum. Débito tem menos fraude.'], correta: 1, expl: 'O segredo das milhas está no RESGATE PREMIUM. Uma Business Class SP-Europa pode valer R$ 15.000 quando comprada. Com 120.000 milhas/ano, você vai e volta de graça. O cashback nunca atinge esse ROI para quem viaja.' },
      { tipo: 'acao', titulo: 'Lance o Cashback como Renda Extra', conteudo: 'Todo cashback recebido é receita real. Lance na seção de Receitas do App e reinvista direto no Tesouro Selic.', cta: 'Novo Lançamento', ctaFn: "go('launch')" }
    ]
  },
  {
    id: 'ra_upskill', trilha: 'renda_ativa', title: 'O Maior ROI do Mundo', sub: 'Investir em si Mesmo (Buffett / Capital Humano)', emoji: '🚀', dur: '5 min', xp: 80, ok: false, grad: 'linear-gradient(135deg,#001A40,#003380)',
    passos: [
      { tipo: 'teoria', titulo: 'O Teto da Poupança vs o Teto da Renda', conteudo: 'Existe um teto matemático para o quanto você pode poupar: <strong style="color:#4A8BFF">máximo 100% da renda</strong>. Não existe teto para o quanto pode ganhar. Aumentar a renda ativa é o maior alavancador de acumulação e é onde a maioria dos brasileiros sub-investe.', visual: '🚀' },
      { tipo: 'regra', titulo: 'O ROI do Upskilling Brasileiro', conteudo: 'Um curso de programação de R$ 3.000 que eleva seu salário em R$ 2.000/mês = <strong style="color:#4A8BFF">ROI de 800% no primeiro ano</strong>. De CLT Júnior para Sênior via certificação AWS/GCP: diferença de R$ 3.000 a R$ 8.000/mês. Nenhuma ação da B3 entrega esse retorno.', exemplo: 'Warren Buffett: "O melhor investimento que você pode fazer é em você mesmo."' },
      { tipo: 'exemplo', titulo: 'O Multiplicador Composto da Renda', conteudo: 'Cada R$ 1.000 de aumento de renda mensal, investido integralmente em ETFs por 20 anos (10% a.a.), vira <strong style="color:#4A8BFF">R$ 759.000</strong>. Aumentar a renda é a variável mais sensível na equação do patrimônio — muito mais do que otimizar o fundo de investimento em 0.2%.', calculo: { simples: 'Economizar mais do mesmo salário: margem limitada', composto: 'Aumentar o salário + poupar tudo: margem infinita', delta: 'Carreira = Maior alavancagem disponível' } },
      { tipo: 'acao', titulo: 'Ajuste seus Aportes ao Novo Salário', conteudo: 'Se você teve aumento, acesse o App, revise seu Budget e calibre automaticamente o novo aporte mensal para evitar a inflação do estilo de vida.', cta: 'Ver Metas', ctaFn: "go('planos')" }
    ]
  }

];
