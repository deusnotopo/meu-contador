/**
 * 🇧🇷 Módulo de Indicadores e Cálculos Financeiros Brasileiros
 * Baseado em legislação real e práticas contábeis brasileiras
 */

// ============= Indicadores Econômicos =============

export interface IndicadorEconomico {
  nome: string;
  valor: number;
  unidade: string;
  dataAtualizacao: string;
  fonte: string;
  isSimulado?: boolean;
  observacao?: string;
}

const dataReferenciaAtual = new Date().toISOString().slice(0, 10);

// Indicadores de referência.
// Enquanto não houver integração com API oficial (BCB/IBGE/B3), o app deve tratar estes valores como estimativas educacionais.
export const INDICADORES_BRASIL: Record<string, IndicadorEconomico> = {
  SELIC: {
    nome: 'Taxa Selic',
    valor: 11.25,
    unidade: '% a.a.',
    dataAtualizacao: dataReferenciaAtual,
    fonte: 'Referência interna baseada em Banco Central do Brasil',
    isSimulado: true,
    observacao: 'Valor de referência para simulações locais até integração com fonte oficial.',
  },
  CDI: {
    nome: 'CDI',
    valor: 11.15,
    unidade: '% a.a.',
    dataAtualizacao: dataReferenciaAtual,
    fonte: 'Referência interna baseada em B3',
    isSimulado: true,
    observacao: 'Pode divergir do fechamento real do período.',
  },
  IPCA: {
    nome: 'IPCA (Inflação)',
    valor: 4.50,
    unidade: '% a.a.',
    dataAtualizacao: dataReferenciaAtual,
    fonte: 'Referência interna baseada em IBGE',
    isSimulado: true,
    observacao: 'Usado como aproximação educacional para cenários e comparativos.',
  },
  POUPANCA: {
    nome: 'Poupança',
    valor: 6.17,
    unidade: '% a.a.',
    dataAtualizacao: dataReferenciaAtual,
    fonte: 'Referência interna baseada em BCB',
    isSimulado: true,
    observacao: 'Rentabilidade aproximada para fins de comparação no app.',
  },
  TR: {
    nome: 'TR (Taxa Referencial)',
    valor: 0.00,
    unidade: '% a.m.',
    dataAtualizacao: dataReferenciaAtual,
    fonte: 'Referência interna baseada em BCB',
    isSimulado: true,
    observacao: 'Atualize via fonte oficial antes de usar em decisão real.',
  },
};

// ============= Tabelas de Imposto de Renda 2024 =============

export interface FaixaIR {
  limite: number;
  aliquota: number;
  deducao: number;
}

export const TABELA_IR_2024: FaixaIR[] = [
  { limite: 2259.20, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 7.5, deducao: 169.44 },
  { limite: 3751.05, aliquota: 15, deducao: 381.44 },
  { limite: 4664.68, aliquota: 22.5, deducao: 662.77 },
  { limite: Infinity, aliquota: 27.5, deducao: 896.00 },
];

/**
 * Calcula o Imposto de Renda retido na fonte
 */
export function calcularIRRF(
  salarioBruto: number,
  dependentes: number = 0,
  pensaoAlimenticia: number = 0,
  outrasDeducoes: number = 0
): {
  baseCalculo: number;
  irrf: number;
  aliquotaEfetiva: number;
  deducaoDependentes: number;
  salarioLiquido: number;
} {
  // Dedução por dependente (R$ 189,59 em 2024)
  const deducaoDependentes = dependentes * 189.59;

  // Base de cálculo
  const baseCalculo = Math.max(
    0,
    salarioBruto - deducaoDependentes - pensaoAlimenticia - outrasDeducoes
  );

  // Encontrar faixa
  let irrf = 0;
  let aliquotaEfetiva = 0;

  for (const faixa of TABELA_IR_2024) {
    if (baseCalculo <= faixa.limite) {
      irrf = (baseCalculo * faixa.aliquota / 100) - faixa.deducao;
      aliquotaEfetiva = faixa.aliquota;
      break;
    }
  }

  irrf = Math.max(0, irrf);

  return {
    baseCalculo,
    irrf,
    aliquotaEfetiva,
    deducaoDependentes,
    salarioLiquido: salarioBruto - irrf,
  };
}

// ============= Tabelas INSS 2024 =============

export interface FaixaINSS {
  limite: number;
  aliquota: number;
}

export const TABELA_INSS_2024: FaixaINSS[] = [
  { limite: 1412.00, aliquota: 7.5 },
  { limite: 2666.68, aliquota: 9 },
  { limite: 4000.03, aliquota: 12 },
  { limite: 7786.02, aliquota: 14 },
];

/**
 * Calcula a contribuição INSS (progressiva)
 */
export function calcularINSS(salarioBruto: number): {
  contribuicao: number;
  aliquotaEfetiva: number;
  teto: number;
} {
  const teto = 7786.02;
  const baseCalculo = Math.min(salarioBruto, teto);
  
  let contribuicao = 0;
  let faixaAnterior = 0;

  for (const faixa of TABELA_INSS_2024) {
    const faixaAtual = Math.min(baseCalculo, faixa.limite) - faixaAnterior;
    if (faixaAtual > 0) {
      contribuicao += faixaAtual * (faixa.aliquota / 100);
      faixaAnterior = faixa.limite;
    }
    if (baseCalculo <= faixa.limite) break;
  }

  const aliquotaEfetiva = salarioBruto > 0 ? (contribuicao / salarioBruto) * 100 : 0;

  return {
    contribuicao,
    aliquotaEfetiva,
    teto,
  };
}

/**
 * Calcula o salário líquido completo
 */
export function calcularSalarioLiquido(
  salarioBruto: number,
  dependentes: number = 0,
  pensaoAlimenticia: number = 0,
  planoSaude: number = 0,
  valeTransporte: boolean = true,
  valeRefeicao: number = 0
): {
  salarioBruto: number;
  inss: number;
  irrf: number;
  valeTransporte: number;
  valeRefeicao: number;
  planoSaude: number;
  totalDescontos: number;
  salarioLiquido: number;
  percentualDesconto: number;
} {
  const inss = calcularINSS(salarioBruto);
  const irrf = calcularIRRF(
    salarioBruto - inss.contribuicao,
    dependentes,
    pensaoAlimenticia
  );

  // Vale transporte: 6% do salário bruto (opcional)
  const vt = valeTransporte ? salarioBruto * 0.06 : 0;

  const totalDescontos = inss.contribuicao + irrf.irrf + vt + valeRefeicao + planoSaude;
  const salarioLiquido = salarioBruto - totalDescontos;
  const percentualDesconto = salarioBruto > 0 ? (totalDescontos / salarioBruto) * 100 : 0;

  return {
    salarioBruto,
    inss: inss.contribuicao,
    irrf: irrf.irrf,
    valeTransporte: vt,
    valeRefeicao,
    planoSaude,
    totalDescontos,
    salarioLiquido,
    percentualDesconto,
  };
}

// ============= Cálculos de Investimentos =============

export interface ComparativoInvestimento {
  tipo: string;
  rentabilidadeAnual: number;
  liquidez: string;
  risco: 'baixo' | 'medio' | 'alto';
  imposto: number;
  rentabilidadeLiquida: number;
  protecaoInflacao: boolean;
}

/**
 * Compara tipos de investimentos brasileiros
 */
export function compararInvestimentos(_valor: number, prazoMeses: number): ComparativoInvestimento[] {
  const selic = INDICADORES_BRASIL.SELIC?.valor ?? 11.25;
  const ipca = INDICADORES_BRASIL.IPCA?.valor ?? 4.5;
  const cdi = INDICADORES_BRASIL.CDI?.valor ?? 11.15;

  const calcularIR = (bruto: number, prazo: number): number => {
    if (prazo <= 6) return bruto * 0.225;
    if (prazo <= 12) return bruto * 0.20;
    if (prazo <= 24) return bruto * 0.175;
    return bruto * 0.15;
  };

  const investimentos: ComparativoInvestimento[] = [
    {
      tipo: 'Poupança',
      rentabilidadeAnual: INDICADORES_BRASIL.POUPANCA?.valor ?? 6.17,
      liquidez: 'D+0',
      risco: 'baixo',
      imposto: 0, // Isenta
      rentabilidadeLiquida: INDICADORES_BRASIL.POUPANCA?.valor ?? 6.17,
      protecaoInflacao: false,
    },
    {
      tipo: 'Tesouro Selic',
      rentabilidadeAnual: selic,
      liquidez: 'D+1',
      risco: 'baixo',
      imposto: calcularIR(selic, prazoMeses),
      rentabilidadeLiquida: selic - calcularIR(selic, prazoMeses),
      protecaoInflacao: false,
    },
    {
      tipo: 'Tesouro IPCA+',
      rentabilidadeAnual: ipca + 6,
      liquidez: 'D+1 (marcação a mercado)',
      risco: 'medio',
      imposto: calcularIR(ipca + 6, prazoMeses),
      rentabilidadeLiquida: (ipca + 6) - calcularIR(ipca + 6, prazoMeses),
      protecaoInflacao: true,
    },
    {
      tipo: 'CDB 100% CDI',
      rentabilidadeAnual: cdi,
      liquidez: 'D+0 a D+30',
      risco: 'baixo',
      imposto: calcularIR(cdi, prazoMeses),
      rentabilidadeLiquida: cdi - calcularIR(cdi, prazoMeses),
      protecaoInflacao: false,
    },
    {
      tipo: 'LCI/LCA (Isenta)',
      rentabilidadeAnual: cdi * 0.9, // ~90% do CDI
      liquidez: 'D+90',
      risco: 'baixo',
      imposto: 0, // Isenta
      rentabilidadeLiquida: cdi * 0.9,
      protecaoInflacao: false,
    },
    {
      tipo: 'Ações (IBOV)',
      rentabilidadeAnual: 12, // Histórico médio
      liquidez: 'D+2',
      risco: 'alto',
      imposto: 15, // Sobre lucro
      rentabilidadeLiquida: 12 * 0.85,
      protecaoInflacao: true,
    },
    {
      tipo: 'FIIs',
      rentabilidadeAnual: 8, // Dividend yield médio
      liquidez: 'D+2',
      risco: 'medio',
      imposto: 20, // Sobre dividendos
      rentabilidadeLiquida: 8 * 0.8,
      protecaoInflacao: true,
    },
  ];

  return investimentos.sort((a, b) => b.rentabilidadeLiquida - a.rentabilidadeLiquida);
}

/**
 * Simula juros compostos
 */
export function simularJurosCompostos(
  capitalInicial: number,
  aporteMensal: number,
  taxaAnual: number,
  anos: number
): {
  totalInvestido: number;
  totalJuros: number;
  montanteFinal: number;
  projecaoMensal: { mes: number; valor: number }[];
} {
  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
  const totalMeses = anos * 12;
  const projecaoMensal: { mes: number; valor: number }[] = [];

  let montante = capitalInicial;
  let totalInvestido = capitalInicial;

  for (let mes = 1; mes <= totalMeses; mes++) {
    montante = montante * (1 + taxaMensal) + aporteMensal;
    totalInvestido += aporteMensal;

    if (mes % 12 === 0 || mes === totalMeses) {
      projecaoMensal.push({ mes, valor: montante });
    }
  }

  const totalJuros = montante - totalInvestido;

  return {
    totalInvestido,
    totalJuros,
    montanteFinal: montante,
    projecaoMensal,
  };
}

// ============= Planejamento de Emergência =============

/**
 * Calcula reserva de emergência ideal para realidade brasileira
 */
export function calcularReservaEmergencia(
  despesasMensais: number,
  temEmpregadoFormal: boolean = true,
  temDependentes: boolean = false,
  temFinanciamento: boolean = false
): {
  mesesRecomendados: number;
  valorIdeal: number;
  valorMinimo: number;
  sugestaoAlocacao: { tipo: string; percentual: number; motivo: string }[];
  prazoAtingirMeta: (aporteMensal: number) => number;
} {
  // Base: 6 meses (realidade brasileira com alta instabilidade)
  let mesesRecomendados = 6;

  // Ajustes baseados na situação
  if (!temEmpregadoFormal) mesesRecomendados += 3; // Informal = mais risco
  if (temDependentes) mesesRecomendados += 2;
  if (temFinanciamento) mesesRecomendados += 2;

  // Limitar entre 3 e 12 meses
  mesesRecomendados = Math.max(3, Math.min(12, mesesRecomendados));

  const valorIdeal = despesasMensais * mesesRecomendados;
  const valorMinimo = despesasMensais * 3;

  // Sugestão de alocação para brasileiros
  const sugestaoAlocacao = [
    {
      tipo: 'Tesouro Selic',
      percentual: 50,
      motivo: 'Liquidez diária, seguro e rende acima da poupança',
    },
    {
      tipo: 'CDB Liquidez Diária',
      percentual: 30,
      motivo: 'Protegido pelo FGC, rendimento próximo ao CDI',
    },
    {
      tipo: 'Conta Remunerada (Nubank/Inter)',
      percentual: 20,
      motivo: 'Acesso imediato para emergências urgentes',
    },
  ];

  const prazoAtingirMeta = (aporteMensal: number): number => {
    if (aporteMensal <= 0) return Infinity;
    return Math.ceil(valorIdeal / aporteMensal);
  };

  return {
    mesesRecomendados,
    valorIdeal,
    valorMinimo,
    sugestaoAlocacao,
    prazoAtingirMeta,
  };
}

// ============= Simulador Aposentadoria INSS =============

/**
 * Simula aposentadoria pelo INSS
 */
export function simularAposentadoriaINSS(
  idadeAtual: number,
  tempoContribuicao: number,
  salarioAtual: number,
  sexo: 'M' | 'F'
): {
  idadeAposentadoria: number;
  tempoNecessario: number;
  valorEstimado: number;
  percentualSalario: number;
  regraAplicada: string;
  recomendacao: string;
} {
  // Regras 2024 (Reforma da Previdência)
  const idadeMinima = sexo === 'M' ? 65 : 62;
  const tempoMinimo = sexo === 'M' ? 20 : 15;
  // Idade estimada de aposentadoria
  const anosFaltandoIdade = Math.max(0, idadeMinima - idadeAtual);
  const anosFaltandoTempo = Math.max(0, tempoMinimo - tempoContribuicao);
  const anosParaAposentar = Math.max(anosFaltandoIdade, anosFaltandoTempo);

  const idadeAposentadoria = idadeAtual + anosParaAposentar;
  const tempoTotal = tempoContribuicao + anosParaAposentar;

  // Cálculo do benefício (média dos 80% maiores salários)
  // Simplificação: assume salário constante
  const mediaSalarios = salarioAtual;
  
  // Percentual: 60% + 2% por ano acima de 20 anos (M) ou 15 anos (F)
  const anosExcedentes = Math.max(0, tempoTotal - (sexo === 'M' ? 20 : 15));
  const percentualBeneficio = Math.min(100, 60 + anosExcedentes * 2);
  
  const valorEstimado = mediaSalarios * (percentualBeneficio / 100);
  const percentualSalario = (valorEstimado / salarioAtual) * 100;

  // Teto INSS 2024
  const tetoINSS = 7786.02;
  const valorFinal = Math.min(valorEstimado, tetoINSS);

  const regraAplicada = 'Regra Permanente (2024)';
  let recomendacao = '';

  if (anosParaAposentar > 20) {
    recomendacao = 'Considere investir em previdência privada (PGBL/VGBL) para complementar a renda.';
  } else if (percentualSalario < 70) {
    recomendacao = 'Seu benefício será inferior a 70% do salário. Planeje uma fonte de renda extra.';
  } else {
    recomendacao = 'Você está no caminho certo! Continue contribuindo.';
  }

  return {
    idadeAposentadoria,
    tempoNecessario: anosParaAposentar,
    valorEstimado: valorFinal,
    percentualSalario,
    regraAplicada,
    recomendacao,
  };
}

// ============= Regra dos 4% (FIRE) =============

/**
 * Calcula independência financeira pela Regra dos 4%
 * Adaptada para realidade brasileira (SWR 3,2% mais conservadora)
 */
export function calcularFIRE(
  despesasAnuais: number,
  swr: number = 3.2 // Safe Withdrawal Rate brasileiro
): {
  patrimonioNecessario: number;
  fireMensal: number;
  patrimonioAtualizado: (anos: number, rendimentoAnual: number) => number;
} {
  const patrimonioNecessario = despesasAnuais / (swr / 100);
  const fireMensal = patrimonioNecessario / 12;

  const patrimonioAtualizado = (anos: number, rendimentoAnual: number): number => {
    return patrimonioNecessario * Math.pow(1 + rendimentoAnual / 100, anos);
  };

  return {
    patrimonioNecessario,
    fireMensal,
    patrimonioAtualizado,
  };
}

// ============= Score de Saúde Financeira BR =============

export interface ScoreFinanceiro {
  score: number;
  classificacao: string;
  cor: string;
  detalhes: {
    reservaEmergencia: { pontos: number; maximo: number; status: string };
    comprometimentoRenda: { pontos: number; maximo: number; status: string };
    diversificacao: { pontos: number; maximo: number; status: string };
    endividamento: { pontos: number; maximo: number; status: string };
    poupanca: { pontos: number; maximo: number; status: string };
  };
  recomendacoes: string[];
}

/**
 * Calcula score de saúde financeira brasileiro
 */
export function calcularScoreFinanceiro(
  rendaMensal: number,
  despesasMensais: number,
  reservaEmergencia: number,
  totalDividas: number,
  tiposInvestimento: number,
  mesesReserva: number
): ScoreFinanceiro {
  const detalhes = {
    reservaEmergencia: { pontos: 0, maximo: 25, status: '' },
    comprometimentoRenda: { pontos: 0, maximo: 25, status: '' },
    diversificacao: { pontos: 0, maximo: 20, status: '' },
    endividamento: { pontos: 0, maximo: 20, status: '' },
    poupanca: { pontos: 0, maximo: 10, status: '' },
  };
  const recomendacoes: string[] = [];

  // 1. Reserva de Emergência (25 pontos)
  if (mesesReserva >= 6) {
    detalhes.reservaEmergencia.pontos = 25;
    detalhes.reservaEmergencia.status = 'Excelente';
  } else if (mesesReserva >= 3) {
    detalhes.reservaEmergencia.pontos = 15;
    detalhes.reservaEmergencia.status = 'Adequada';
    recomendacoes.push('Aumente sua reserva para 6 meses de despesas.');
  } else if (mesesReserva >= 1) {
    detalhes.reservaEmergencia.pontos = 8;
    detalhes.reservaEmergencia.status = 'Insuficiente';
    recomendacoes.push('Sua reserva de emergência está muito baixa. Priorize aumentá-la.');
  } else {
    detalhes.reservaEmergencia.pontos = 0;
    detalhes.reservaEmergencia.status = 'Crítica';
    recomendacoes.push('Comece uma reserva de emergência IMEDIATAMENTE.');
  }

  // 2. Comprometimento de Renda (25 pontos)
  const comprometimento = rendaMensal > 0 ? (despesasMensais / rendaMensal) * 100 : 100;
  if (comprometimento <= 70) {
    detalhes.comprometimentoRenda.pontos = 25;
    detalhes.comprometimentoRenda.status = 'Saudável';
  } else if (comprometimento <= 85) {
    detalhes.comprometimentoRenda.pontos = 15;
    detalhes.comprometimentoRenda.status = 'Atenção';
    recomendacoes.push('Seus gastos estão consumindo mais de 70% da renda. Revise seu orçamento.');
  } else {
    detalhes.comprometimentoRenda.pontos = 5;
    detalhes.comprometimentoRenda.status = 'Crítico';
    recomendacoes.push('Gastos acima de 85% da renda. Corte despesas não essenciais urgentemente.');
  }

  // 3. Diversificação (20 pontos)
  if (tiposInvestimento >= 4) {
    detalhes.diversificacao.pontos = 20;
    detalhes.diversificacao.status = 'Diversificada';
  } else if (tiposInvestimento >= 2) {
    detalhes.diversificacao.pontos = 12;
    detalhes.diversificacao.status = 'Parcial';
    recomendacoes.push('Diversifique mais seus investimentos (renda fixa + variável).');
  } else {
    detalhes.diversificacao.pontos = 5;
    detalhes.diversificacao.status = 'Concentrada';
    recomendacoes.push('Carteira muito concentrada. Adicione diferentes classes de ativos.');
  }

  // 4. Endividamento (20 pontos)
  const patrimonio = reservaEmergencia;
  const razaoDivida = patrimonio > 0 ? (totalDividas / patrimonio) * 100 : totalDividas > 0 ? 100 : 0;
  if (razaoDivida <= 20) {
    detalhes.endividamento.pontos = 20;
    detalhes.endividamento.status = 'Baixo';
  } else if (razaoDivida <= 50) {
    detalhes.endividamento.pontos = 12;
    detalhes.endividamento.status = 'Moderado';
    recomendacoes.push('Seu endividamento está moderado. Priorize quitar dívidas caras.');
  } else {
    detalhes.endividamento.pontos = 5;
    detalhes.endividamento.status = 'Alto';
    recomendacoes.push('Endividamento alto! Use o método avalanche (maior juros primeiro).');
  }

  // 5. Taxa de Poupança (10 pontos)
  const poupanca = rendaMensal > 0 ? ((rendaMensal - despesasMensais) / rendaMensal) * 100 : 0;
  if (poupanca >= 20) {
    detalhes.poupanca.pontos = 10;
    detalhes.poupanca.status = 'Excelente';
  } else if (poupanca >= 10) {
    detalhes.poupanca.pontos = 7;
    detalhes.poupanca.status = 'Boa';
  } else if (poupanca > 0) {
    detalhes.poupanca.pontos = 4;
    detalhes.poupanca.status = 'Baixa';
    recomendacoes.push('Tente aumentar sua taxa de poupança para pelo menos 10%.');
  } else {
    detalhes.poupanca.pontos = 0;
    detalhes.poupanca.status = 'Negativa';
    recomendacoes.push('Você está gastando mais do que ganha. Ação urgente necessária!');
  }

  // Score total
  const score = Object.values(detalhes).reduce((sum, d) => sum + d.pontos, 0);

  // Classificação
  let classificacao = '';
  let cor = '';
  if (score >= 80) {
    classificacao = 'Excelente';
    cor = '#22c55e';
  } else if (score >= 60) {
    classificacao = 'Boa';
    cor = '#84cc16';
  } else if (score >= 40) {
    classificacao = 'Regular';
    cor = '#f59e0b';
  } else if (score >= 20) {
    classificacao = 'Ruim';
    cor = '#f97316';
  } else {
    classificacao = 'Crítica';
    cor = '#ef4444';
  }

  return {
    score,
    classificacao,
    cor,
    detalhes,
    recomendacoes,
  };
}