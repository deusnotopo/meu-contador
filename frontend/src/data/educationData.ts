export type PassoTipo = 'teoria' | 'exemplo' | 'regra' | 'quiz' | 'acao';

export interface Passo {
  tipo: PassoTipo;
  titulo?: string;
  conteudo?: string;
  visual?: string;
  exemplo?: string;
  calculo?: { simples: string; composto: string; delta: string };
  pergunta?: string;
  opcoes?: string[];
  correta?: number;
  expl?: string;
  cta?: string;
  ctaFn?: string;
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

export const AULAS_TRILHAS: Trilha[] = [
  {id:'base',label:'Base',emoji:'🏗️',color:'#4A8BFF',bg:'rgba(74,139,255,0.12)'},
  {id:'invest',label:'Investir',emoji:'📈',color:'#00D991',bg:'rgba(0,217,145,0.12)'},
  {id:'fire',label:'FIRE',emoji:'🔥',color:'#FFAD3B',bg:'rgba(255,173,59,0.12)'},
  {id:'mental',label:'Mente',emoji:'🧠',color:'#9B7FFF',bg:'rgba(155,127,255,0.12)'},
];

export const AULAS_CONQUISTAS: Conquista[] = [
  {emoji:'⭐',nome:'Primeira aula',desc:'Completou sua 1ª lição',ok:true},
  {emoji:'🔥',nome:'3 dias seguidos',desc:'Sequência de 3 dias',ok:true},
  {emoji:'🎯',nome:'10 acertos',desc:'Acertou 10 quizzes',ok:false},
  {emoji:'🚀',nome:'Trilha FIRE',desc:'Completou a trilha FIRE',ok:false},
];

export const EDUCATION_MODULES: Lesson[] = [
  {id:'jc',trilha:'base',title:'Juros Compostos',sub:'A 8ª maravilha do mundo',emoji:'💰',dur:'4 min',xp:50,ok:true,grad:'linear-gradient(135deg,#0D1F3C,#1A3A6B)',passos:[
    {tipo:'teoria',titulo:'O que são juros compostos?',conteudo:'Juros simples crescem de forma <strong style="color:#4A8BFF">linear</strong>. Juros compostos crescem de forma <strong style="color:#00D991">exponencial</strong> — juros sobre juros sobre juros.',visual:'📈'},
    {tipo:'exemplo',titulo:'Veja na prática',conteudo:'R$ 1.000 por 30 anos a 10% a.a.',calculo:{simples:'R$ 4.000',composto:'R$ 17.449',delta:'4x mais!'}},
    {tipo:'regra',titulo:'A Regra dos 72',conteudo:'Divida <strong style="color:#FFAD3B">72</strong> pela taxa de retorno e você sabe em quantos anos seu dinheiro <strong style="color:#00D991">dobra</strong>.',exemplo:'72 ÷ 10% = 7,2 anos para dobrar'},
    {tipo:'quiz',pergunta:'Se você investe R$ 500/mês por 20 anos com retorno de 10% a.a., quanto acumula?',opcoes:['R$ 120.000','R$ 343.650','R$ 180.000','R$ 215.000'],correta:1,expl:'Com juros compostos, R$ 500/mês × 240 meses = R$ 120k aportado, mas os juros acumulam R$ 343.650!'},
    {tipo:'acao',titulo:'Aplique agora!',conteudo:'Acesse a calculadora em <strong style="color:#4A8BFF">Patrimônio → Juros Compostos</strong> e simule com seus próprios números.',cta:'Abrir calculadora',ctaFn:"go('invest_compostos')"},
  ]},
  {id:'env',trilha:'base',title:'Envelopes',sub:'Zero-based budgeting',emoji:'✉️',dur:'5 min',xp:60,ok:true,grad:'linear-gradient(135deg,#0D2B1F,#1A4F35)',passos:[
    {tipo:'teoria',titulo:'Por que o dinheiro some?',conteudo:'Sem um sistema, cada gasto compete com todos os outros. O método dos envelopes dá um <strong style="color:#00D991">destino</strong> a cada real antes de você gastá-lo.',visual:'✉️'},
    {tipo:'regra',titulo:'A Regra 50/30/20',conteudo:'<strong style="color:#4A8BFF">50%</strong> para Necessidades &bull; <strong style="color:#FFAD3B">30%</strong> para Desejos &bull; <strong style="color:#00D991">20%</strong> para Poupança',exemplo:'Com R$ 8.400 líquidos: R$ 4.200 | R$ 2.520 | R$ 1.680'},
    {tipo:'exemplo',titulo:'Custo de oportunidade',conteudo:'R$ 12 extra em delivery por mês parece pouco. Mas em 10 anos investidos a 10% a.a. viram...',calculo:{simples:'R$ 1.440 gastos',composto:'R$ 2.197 perdidos',delta:'Diferença real'}},
    {tipo:'quiz',pergunta:'Com renda líquida de R$ 5.000, quanto deve ir para Necessidades na regra 50/30/20?',opcoes:['R$ 1.000','R$ 1.500','R$ 2.500','R$ 3.000'],correta:2,expl:'50% de R$ 5.000 = R$ 2.500 para necessidades essenciais.'},
    {tipo:'acao',titulo:'Monte seus envelopes!',conteudo:'Vá até a aba <strong style="color:#00D991">Budget</strong> e confira como seus gastos estão distribuídos.',cta:'Ver envelopes',ctaFn:"go('budget')"},
  ]},
  {id:'fire',trilha:'fire',title:'Método FIRE',sub:'Financial Independence, Retire Early',emoji:'🔥',dur:'6 min',xp:80,ok:false,grad:'linear-gradient(135deg,#2B1500,#5C2800)',passos:[
    {tipo:'teoria',titulo:'O que é FIRE?',conteudo:'FIRE = <strong style="color:#FFAD3B">F</strong>inancial <strong style="color:#FFAD3B">I</strong>ndependence, <strong style="color:#FFAD3B">R</strong>etire <strong style="color:#FFAD3B">E</strong>arly. Acumule patrimônio suficiente para viver de renda.',visual:'🔥'},
    {tipo:'regra',titulo:'Taxa Segura de Retirada',conteudo:'Para o Brasil: <strong style="color:#FFAD3B">3,2% a.a.</strong> (não 4% dos EUA, por causa da nossa volatilidade).',exemplo:'Fórmula: Patrimônio = Despesas anuais ÷ 3,2%'},
    {tipo:'exemplo',titulo:'Quanto você precisa?',conteudo:'Se quer R$ 8.000/mês de renda passiva:',calculo:{simples:'R$ 8.000 × 12 = R$ 96.000/ano',composto:'÷ 3,2% = R$ 3.000.000',delta:'Sua meta FIRE'}},
    {tipo:'quiz',pergunta:'Uma pessoa quer viver com R$ 5.000/mês. Usando 3,2% (BR), qual o patrimônio necessário?',opcoes:['R$ 1.500.000','R$ 1.875.000','R$ 2.000.000','R$ 2.500.000'],correta:1,expl:'R$ 5.000 × 12 = R$ 60.000/ano. R$ 60.000 ÷ 0.032 = R$ 1.875.000 de patrimônio necessário.'},
    {tipo:'acao',titulo:'Calcule seu FIRE!',conteudo:'Acesse <strong style="color:#FFAD3B">Educação → Calculadora FIRE</strong> e simule com sua despesa.',cta:'Calcular meu FIRE',ctaFn:"go('fire')"},
  ]},
  {id:'dividas',trilha:'base',title:'Matar Dívidas',sub:'Estratégias avalanche e bola de neve',emoji:'🏔️',dur:'5 min',xp:70,ok:false,grad:'linear-gradient(135deg,#2B0A0E,#5C1822)',passos:[
    {tipo:'teoria',titulo:'Dívida boa vs. dívida ruim',conteudo:'Dívida <strong style="color:#00D991">boa</strong>: taxa menor que seu retorno em investimentos. Dívida <strong style="color:#FF4F6E">ruim</strong>: taxa maior que qualquer investimento seguro.',visual:'⚖️'},
    {tipo:'regra',titulo:'Método Avalanche',conteudo:'Pague o mínimo em todas. O extra vai para a <strong style="color:#FFAD3B">dívida de maior juros</strong> primeiro.',exemplo:'Carro 14,2% a.a. → atacar primeiro!'},
    {tipo:'regra',titulo:'Método Bola de Neve',conteudo:'Alternativa: quitar a <strong style="color:#4A8BFF">menor dívida primeiro</strong> para ganhos psicológicos rápidos.',exemplo:'Melhor para quem precisa de motivação'},
    {tipo:'quiz',pergunta:'Você tem dívida A (R$ 500, 8% a.a.) e B (R$ 2.000, 20% a.a.). Qual atacar primeiro no Avalanche?',opcoes:['Dívida A — menor valor','Dívida B — maior juro','As duas igualmente','A de maior prazo'],correta:1,expl:'Avalanche = maior taxa primeiro. A dívida B a 20% a.a. corrói mais patrimônio.'},
    {tipo:'acao',titulo:'Analise suas dívidas!',conteudo:'Veja em <strong style="color:#FF4F6E">Patrimônio → Dívidas</strong> a estratégia recomendada.',cta:'Ver minhas dívidas',ctaFn:"go('invest')"},
  ]},
  {id:'vieses',trilha:'mental',title:'Vieses Financeiros',sub:'Seu cérebro sabota seu dinheiro',emoji:'🧠',dur:'5 min',xp:65,ok:false,grad:'linear-gradient(135deg,#16082B,#2E1060)',passos:[
    {tipo:'teoria',titulo:'Por que tomamos decisões ruins?',conteudo:'Nosso cérebro evoluiu para sobreviver, não para <strong style="color:#9B7FFF">acumular riqueza</strong>. Ele prefere prazer imediato — isso é <strong style="color:#9B7FFF">desconto hiperbólico</strong>.',visual:'🧩'},
    {tipo:'regra',titulo:'Viés da Disponibilidade',conteudo:'Superestimamos riscos fáceis de lembrar (crashes na TV) e ignoramos riscos reais (inflação silenciosa).',exemplo:'Mídia mostra crashes → você fica com medo de investir'},
    {tipo:'regra',titulo:'Aversão à Perda (Kahneman)',conteudo:'A dor de perder R$ 100 é <strong style="color:#9B7FFF">2x maior</strong> que o prazer de ganhar R$ 100 — isso nos faz manter maus investimentos.',exemplo:'Não realizar prejuízo = perder mais dinheiro'},
    {tipo:'quiz',pergunta:'Qual viés faz uma pessoa manter um investimento ruim porque "não quer realizar prejuízo"?',opcoes:['Viés da confirmação','Falácia do apostador','Aversão à perda','Excesso de confiança'],correta:2,expl:'Aversão à perda (Kahneman): a dor de perder R$ 100 é 2x maior que o prazer de ganhar R$ 100.'},
    {tipo:'acao',titulo:'Automatize para vencer seus vieses!',conteudo:'O Ulysses Contract existe justamente para isso — decisões automáticas enquanto você está racional.',cta:'Ver Envelopes',ctaFn:"go('budget')"},
  ]},
  {id:'etfs',trilha:'invest',title:'ETFs e Diversificação',sub:'Como investir no mundo inteiro',emoji:'🌍',dur:'5 min',xp:75,ok:false,grad:'linear-gradient(135deg,#0A2218,#153D2B)',passos:[
    {tipo:'teoria',titulo:'O que é um ETF?',conteudo:'ETF replica um índice — como comprar <strong style="color:#00D991">todas as ações do S&P 500</strong> de uma vez. Simples, barato e diversificado automaticamente.',visual:'🌍'},
    {tipo:'regra',titulo:'Por que diversificar?',conteudo:'<strong style="color:#00D991">"Não coloque todos os ovos na mesma cesta"</strong>. Diversificação reduz risco sem reduzir retorno.',exemplo:'BOVA11 (Brasil) + IVVB11 (EUA) + Renda fixa = portfólio robusto'},
    {tipo:'exemplo',titulo:'Come-cotas: o vampiro silencioso',conteudo:'Fundos cobram "come-cotas" 2x/ano. ETFs e CDBs diretos não têm esse custo.',calculo:{simples:'Fundo: -R$ 420/ano',composto:'CDB direto: R$ 0 antecipado',delta:'+R$ 18.000 em 20 anos'}},
    {tipo:'quiz',pergunta:'O IVVB11 replica qual índice?',opcoes:['Ibovespa (ações brasileiras)','S&P 500 (500 maiores EUA)','Nasdaq (tecnologia EUA)','MSCI World (global)'],correta:1,expl:'IVVB11 = iShares S&P 500. 1 cota = investimento proporcional nas 500 maiores empresas americanas.'},
    {tipo:'acao',titulo:'Veja sua alocação atual!',conteudo:'Em <strong style="color:#00D991">Patrimônio</strong>, veja como seus investimentos estão distribuídos.',cta:'Ver patrimônio',ctaFn:"go('invest')"},
  ]},
];
