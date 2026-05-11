import { Lesson } from './educationData';

// ----------------------------------------------------------------------
// CONTEÚDO MASSIVO DA ACADEMIA (DO BÁSICO AO AVANÇADO - BRASIL)
// ----------------------------------------------------------------------
export const EDUCATION_MODULES: Lesson[] = [
    {
        id: 'br_parcelamento_inteligente',
        trilha: 'start',
        title: 'Parcelamento Inteligente',
        sub: 'Entenda o verdadeiro custo das parcelas',
        emoji: '📊',
        dur: '7 min',
        xp: 70,
        ok: false,
        grad: 'linear-gradient(135deg,#E94560,#4A8BFF)',
        objective: 'Ensinar a calcular o impacto real das parcelas no caixa futuro e evitar o comprometimento excessivo da renda.',
        outcomeType: 'divida',
        maturityStage: 'sobreviver',
        behaviorGoal: 'Antes de parcelar, simular o impacto no fluxo de caixa dos próximos 3 meses e comparar com alternativas à vista.',
        associatedFeature: 'cash_flow',
        activationContext: 'Quando o usuário está considerando parcelar uma compra ou já tem muitas parcelas comprometendo o futuro.',
        personaTags: ['iniciante', 'desorganizado', 'mes_apertado', 'divida_cara'],
        triggerEvents: ['fatura_alta', 'divida_cara', 'mes_apertado'],
        references: [
            'Banco Central do Brasil — Relatório de Endividamento e Inadimplência',
            'Sebrae — Gestão de capital de giro para pequenos negócios',
            'Princípios de fluxo de caixa e orçamento familiar',
            'Richard Thaler — Nudge (capítulo sobre mental accounting)'
        ],
        passos: [
            {
                tipo: 'teoria',
                titulo: 'O erro que faz você perder dinheiro sem perceber',
                conteudo: 'Você já comprou algo parcelado pensando "são apenas R$ 50 por mês" e depois descobriu que tem 15 parcelas diferentes vencendo no mesmo mês? <strong style="color:#E94560">Esse é o erro do parcelamento ilusório</strong>: focar apenas no valor da parcela individual e ignorar o comprometimento acumulado no seu fluxo de caixa futuro.',
                visual: '💳'
            },
            {
                tipo: 'regra',
                titulo: 'Diagnóstico: onde isso aparece na sua vida',
                conteudo: 'Isso aparece quando você: usa o cartão para parcelar o IPVA pensando que "é só mais uma parcela"; divide o aluguel em 12x no cartão achando que cabe no orçamento; compra um presente de aniversário em 10x sem calcular como isso afeta seu mês daqui a 6 meses; ou deixa o cliente atrasar o pagamento e passa a depender de parcelar suas próprias despesas para sobreviver.',
                exemplo: 'Situações comuns: parcelar o curso profissionalizante em 24x e depois descobrir que falta dinheiro para o transporte; usar o rotativo do cartão para pagar uma emergência médica e agora ter parcelas vencendo todo mês; dividir a reforma da casa em 36x sem planejar como isso afeta sua reserva de emergência.'
            },
            {
                tipo: 'teoria',
                titulo: 'Conceito: Comprometimento de Parcelas em português simples',
                conteudo: '<strong style="color:#4A8BFF">Comprometimento de parcelas</strong> é a soma de todas as parcelas que você deve pagar nos próximos meses. Não é o valor da dívida total, mas sim quanto sai do seu caixa todo mês por causa das parcelas já contratadas. Quanto maior esse número, menos liberdade você tem para lidar com imprevistos ou aproveitar oportunidades.',
                visual: '📉'
            },
            {
                tipo: 'exemplo',
                titulo: 'Exemplo brasileiro: João e o acúmulo silencioso de parcelas',
                conteudo: 'João é autônomo e tem R$ 5.000 de entrada mensal. No mês passado, ele fez várias compras parceladas: - Smartphone: 10x de R$ 150 (R$ 150/mês) - Curso de inglês: 12x de R$ 200 (R$ 200/mês) - Móveis para home office: 6x de R$ 300 (R$ 300/mês) - IPVA do carro: 8x de R$ 125 (R$ 125/mês) - Presente de aniversário parcelado: 4x de R$ 100 (R$ 100/mês) Total comprometido em parcelas: R$ 875/mês Isso significa que, antes de receber qualquer dinheiro, João já tem R$ 875 comprometidos todo mês. Se ele receber R$ 5.000, seu saldo livre para outras despesas é apenas R$ 4.125. No mês que vem, ele quer fazer um curso de R$ 2.000 parcelado em 5x de R$ 400. Se fizer, seu comprometimento subirá para R$ 1.275/mês, deixando apenas R$ 3.725 livre - uma redução de 10% no seu poder de compra mensal.',
                visual: '👨‍💼',
                calculo: { simples: 'Comprometimento atual: R$ 875/mês', composto: 'Após novo parcelamento: R$ 1.275/mês', delta: 'Redução de R$ 400 no livre para gastar' }
            },
            {
                tipo: 'quiz',
                pergunta: 'Maria recebeu R$ 3.000 este mês e tem as seguintes parcelas vencendo: R$ 150 (streaming), R$ 200 (academia), R$ 100 (curso online) e R$ 250 (contas diversas). Ela quer comprar um aparelho de R$ 400 parcelado em 4x. Qual será seu comprometimento total de parcelas após a compra?',
                opcoes: ['R$ 500/mês', 'R$ 600/mês', 'R$ 700/mês', 'R$ 800/mês'],
                correta: 3,
                expl: 'Parcelas atuais: R$ 150 + R$ 200 + R$ 100 + R$ 250 = R$ 700/mês. Novo aparelho: R$ 400 / 4 = R$ 100/mês. Total: R$ 700 + R$ 100 = R$ 800/mês.'
            },
            {
                tipo: 'acao',
                titulo: 'Ação imediata no app: Calcule seu comprometimento de parcelas',
                conteudo: 'Vá até o calendário financeiro, ative o filtro de "Parcelas" e veja o total comprometido para cada um dos próximos 3 meses. Anote esse número e compare com sua renda média mensal. Se o comprometimento for maior que 30% da sua renda, considere renegociar alguma parcela ou adiar novas compras parceladas.',
                cta: 'Abrir calendário de parcelas',
                ctaFn: "go('cash_flow')"
            },
            {
                tipo: 'acao',
                titulo: 'Reforço: Lembrete inteligente para o momento certo',
                conteudo: 'O app vai te lembrar de verificar seu comprometimento de parcelas sempre que: 1) Você for fazer uma compra acima de R$ 200; 2) Faltarem 5 dias para o vencimento de uma parcela grande; 3) Seu comprometimento de parcelas ultrapassar 25% da sua renda média. Esse reforço espaçado evita que você acumule parcelas sem perceber o impacto real no seu caixa futuro.',
                visual: '⏰',
                cta: 'Ativar lembretes de parcelas',
                ctaFn: "go('notifications')"
            }
        ]
    },
  
  // ==========================================
  // TRILHA 1: SOBREVIVÊNCIA BRASILEIRA (BÁSICO)
  // ==========================================
  {
    id: 'br_dividas', trilha: 'start', title: 'A Armadilha do Rotativo', sub: 'O maior vilão do brasileiro', emoji: '💳', dur: '5 min', xp: 50, ok: true, grad: 'linear-gradient(135deg,#2B0F1A,#5C1A33)',
    objective: 'Ensinar a reconhecer dívida destrutiva e trocar improviso caro por decisão financeiramente inteligente.',
    outcomeType: 'divida',
    maturityStage: 'sobreviver',
    behaviorGoal: 'Trocar o impulso de pagar mínimo por uma decisão de quitação inteligente e imediata.',
    associatedFeature: 'budget',
    activationContext: 'Quando cartão, fatura, parcela ou dívida cara ameaçam o mês atual.',
    triggerEvents: ['fatura_alta', 'divida_cara', 'mes_apertado'],
    references: ['Richard Thaler — Nudge', 'Morgan Housel — The Psychology of Money', 'Princípios de custo efetivo total e priorização de dívida'],
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
    objective: 'Construir a base de liquidez e proteção para que o usuário não transforme imprevisto em dívida cara.',
    outcomeType: 'reserva',
    maturityStage: 'proteger',
    behaviorGoal: 'Criar liquidez real antes de correr risco ou depender de crédito.',
    associatedFeature: 'planos',
    activationContext: 'Quando a pessoa ainda não tem colchão mínimo para atravessar imprevistos.',
    triggerEvents: ['sem_reserva', 'mes_apertado'],
    references: ['Liquidez diária e gestão de caixa pessoal', 'Hipótese do Ciclo de Vida — Modigliani', 'Princípios de reserva de emergência'],
    passos: [
      { tipo: 'teoria', titulo: 'Doença, Demissão e Carro Quebrado', conteudo: 'Emergências não são "SE vão acontecer", são "QUANDO vão acontecer". No Brasil, o SUS pode demorar e o seguro desemprego não mantém seu padrão de vida. Você precisa de 3 a 6 meses de seu custo de vida <strong style="color:#00D991">livre de risco</strong>.', visual: '☔' },
      { tipo: 'regra', titulo: 'Liquidez Diária (D+0)', conteudo: 'Dinheiro de emergência não pode ficar trancado em imóveis ou em ações que mudam de preço. Onde colocar? <strong style="color:#00D991">Tesouro Selic</strong>, contas do tipo <strong style="color:#00D991">Nubank/Mercado Pago</strong> (rendendo 100% do CDI) ou CDBs de Liquidez Diária de bancos sólidos.', exemplo: 'Se seu custo de vida é R$ 3.000, sua meta de reserva é entre R$ 9.000 e R$ 18.000.' },
      { tipo: 'exemplo', titulo: 'A Poupança = Perda de Dinheiro', conteudo: 'A velha Caderneta de Poupança rende abaixo da inflação (IPCA). Seu dinheiro perde poder de compra todo dia.', calculo: { simples: 'Poupança: Rende ~6% a.a.', composto: 'Tesouro Selic: Rende ~10% a.a.', delta: 'Proteção contra inflação' } },
      { tipo: 'quiz', pergunta: 'João juntou R$ 10.000 para sua Reserva de Emergência. Para proteger da inflação e ter segurança imediata num domingo à noite para pagar um hospital, onde ele DEVE ter guardado esse dinheiro?', opcoes: ['Ações da Petrobras (garantem altos dividendos).', 'Tesouro IPCA+ 2045 (protege perfeitamente da inflação).', 'CDB de liquidez diária batendo 100% do CDI ou Contas Remuneradas (D+0).', 'Caderneta de Poupança da Caixa.'], correta: 2, expl: 'Ações não têm garantia de valor (podem cair). Tesouro IPCA sofre marcação a mercado e você pode perder dinheiro se sacar antes. Poupança perde pra inflação. CDB 100% CDI ou Tesouro Selic (agora D+0 até em fins de semana em alguns bancos) é o único lugar correto.' },
      { tipo: 'acao', titulo: 'Defina sua Meta de Reserva', conteudo: 'Vá até o menu de Metas e cadastre "Reserva de Emergência" atrelada ao CDB.', cta: 'Configurar Metas', ctaFn: "go('planos')" }
    ]
  },
{
  id: 'br_saldo_seguro', trilha: 'start', title: 'Saldo Seguro até a Próxima Renda', sub: 'Quanto posso gastar hoje sem me enrolar', emoji: '🧮', dur: '5 min', xp: 65, ok: false, grad: 'linear-gradient(135deg,#10233D,#1E4F84)',
  objective: 'Ensinar o usuário a separar saldo disponível de dinheiro já comprometido antes da próxima entrada.',
  outcomeType: 'caixa',
  maturityStage: 'sobreviver',
  behaviorGoal: 'Parar de olhar saldo bruto e passar a decidir com base no que realmente está livre.',
  associatedFeature: 'cash_flow',
  activationContext: 'Quando a conta parece ter dinheiro, mas o próximo vencimento ainda não chegou.',
  triggerEvents: ['mes_apertado', 'fatura_alta', 'organizar_rotina'],
  references: [
    'Fluxo de caixa pessoal',
    'Contabilidade mental — Richard Thaler',
    'Princípios de calendário financeiro',
    'Banco Central do Brasil — Educação Financeira',
    'Sebrae — Gestão de fluxo de caixa para micro e pequenas empresas'
  ],
  passos: [
    { tipo: 'teoria', titulo: 'O erro que faz você perder dinheiro sem perceber', conteudo: 'Você já olhou para o saldo da conta, achou que tinha dinheiro disponível e gastou — só para descobrir dias depois que faltava para pagar algo essencial? <strong style="color:#E94560">Esse é o erro do saldo ilusório</strong>: confundir o número bruto na conta com o que realmente é livre para gastar.', visual: '💸' },
    { tipo: 'regra', titulo: 'Diagnóstico: onde isso aparece na sua vida', conteudo: 'Isso acontece quando você usa o Pix para pagar o mercado porque "tem saldo", mas esquece que o aluguel vence daqui a 3 dias. Ou quando parcelou aquele presente no cartão achando que "cabe no mês", sem contabilizar todas as outras parcelas que também vão cair. O erro está em não respeitar o calendário de compromissos.', exemplo: 'Situações comuns: usar o limite do cartão para supermercado quando o IPVA vence na semana que vem; sair para jantar porque "sobrou" na conta, mas esquecer do DAS do MEI que vence amanhã; comprar um presente parcelado achando que cada parcela é pequena, sem somar com as outras 8 que já estão comprometidas.' },
    { tipo: 'teoria', titulo: 'Conceito: Saldo Seguro em português simples', conteudo: '<strong style="color:#4A8BFF">Saldo seguro</strong> é o dinheiro que realmente está livre para você usar hoje, depois de reservar tudo aquilo que já está comprometido até o próximo dia que você receber dinheiro (seu salário, recebimento de cliente, etc.). É simples: o que entra até a próxima renda, menos o que sai até a próxima renda. O resto é seu para viver.', visual: '🛡️' },
    { tipo: 'exemplo', titulo: 'Exemplo brasileiro: Maria e o cálculo do mês', conteudo: 'Maria é autônoma e recebeu R$ 4.500 no dia 1º. No dia 15, ela olha a conta e vê R$ 3.200. Acha que pode gastar R$ 1.500 no mercado e mais R$ 800 num jantar. Mas vamos ao que realmente importa até o próximo recebimento (dia 30): - Contas fixas: aluguel R$ 800 + luz R$ 150 + internet R$ 100 = R$ 1.050 - Parcela do carro: 2x de R$ 350 = R$ 700 (já vencidas este mês) - Fatura do cartão (já fechada): R$ 600 - Próxima fatura (estimada): R$ 400 - DAS do MEI: R$ 250 - Mercado e essenciais estimados: R$ 600 - Margem de segurança: R$ 200 Total comprometido: R$ 3.800 Saldo seguro: R$ 4.500 - R$ 3.800 = R$ 700 (não R$ 3.200!) Se Maria gastar R$ 2.300 como planejou, vai faltar R$ 1.600 no final do mês.', visual: '👩‍💼', calculo: { simples: 'Saldo em conta: R$ 3.200', composto: 'Saldo seguro real: R$ 700', delta: 'Diferença ilusória: R$ 2.500 a menos!' } },
    { tipo: 'quiz', pergunta: 'João recebeu R$ 3.800 no dia 5 e hoje é dia 20. Ele vê R$ 2.900 na conta e pensa em comprar um presente de R$ 600 parcelado em 3x. O que ele DEVE verificar primeiro?', opcoes: ['Se o limite do cartão permite a compra.', 'Se as 3 parcelas de R$ 200 cabem no seu orçamento deste mês.', 'Quanto está comprometido até o próximo recebimento e se sobra R$ 600 livre.', 'Se a loja oferece desconto para pagamento à vista.'], correta: 2, expl: 'João precisa calcular seu saldo seguro: somar o que vai entrar até o próximo recebimento e subtrair tudo que já está comprometido (aluguel, contas, parcelas, DAS, etc.). Só assim saberá se realmente pode gastar R$ 600 agora sem prejudicar o mês.' },
    { tipo: 'acao', titulo: 'Ação imediata no app: Calcule seu saldo seguro agora', conteudo: 'Vá até o calendário financeiro, filtre para mostrar apenas até o próximo dia de recebimento, some todas as entradas previstas e subtraia todas as saídas obrigatórias. O resultado é seu saldo seguro real para usar hoje.', cta: 'Abrir calendário financeiro', ctaFn: "go('cash_flow')" },
    { tipo: 'acao', titulo: 'Reforço: Lembrete inteligente para o momento certo', conteudo: 'O app vai te lembrar de recalcular seu saldo seguro sempre que: 1) Você receber dinheiro novo; 2) Faltarem 3 dias para um vencimento grande (aluguel, IPVA, DAS); 3) Você for fazer uma compra acima de R$ 100 no Pix ou cartão. Esse reforço espaçado evita que você volte ao erro do saldo ilusório.', visual: '⏰', cta: 'Ativar lembretes inteligentes', ctaFn: "go('notifications')" }
  ]
},
{
  id: 'br_mes_apertado', trilha: 'start', title: 'Sair do Mês Apertado', sub: 'Plano de emergência para não cavar um buraco maior', emoji: '🆘', dur: '6 min', xp: 75, ok: false, grad: 'linear-gradient(135deg,#5C1A33,#E94560)',
  objective: 'Ensinar uma sequência prática de decisões para atravessar o mês apertado sem entrar em dívida ainda pior.',
  outcomeType: 'caixa',
  maturityStage: 'sobreviver',
  behaviorGoal: 'Priorizar sobrevivência financeira imediata antes de conforto, status ou consumo parcelado.',
  associatedFeature: 'budget',
  activationContext: 'Quando o dinheiro do mês não cobre compromissos essenciais e o usuário sente risco de entrar no rotativo.',
  triggerEvents: ['mes_apertado', 'fatura_alta', 'divida_cara'],
  references: ['Orçamento de crise e priorização de caixa', 'Banco Central do Brasil — educação financeira', 'Princípios de corte temporário e negociação de passivos'],
  passos: [
    { tipo: 'teoria', titulo: 'O objetivo agora não é perfeição', conteudo: 'Quando o mês apertou, o foco não é investir melhor nem otimizar mil detalhes. O foco é <strong style="color:#E94560">impedir dano maior</strong>: evitar rotativo, atraso caro e efeito dominó no caixa.', visual: '🚨' },
    { tipo: 'regra', titulo: 'Regra de prioridade em 4 níveis', conteudo: 'Nível 1: moradia, comida, remédio, transporte e contas críticas. Nível 2: dívidas que explodem juros. Nível 3: compromissos negociáveis. Nível 4: tudo que pode esperar. Em mês apertado, você não decide por culpa; decide por impacto.', exemplo: 'Antes de pagar streaming, roupa ou lazer, preserve aluguel, energia, transporte e parcelas que evitam juros destrutivos.' },
    { tipo: 'exemplo', titulo: 'Exemplo brasileiro: reorganizando R$ 2.800', conteudo: 'Ana tem R$ 2.800 para fechar o mês, mas precisa cobrir aluguel, mercado, energia, fatura mínima, internet, remédio e parcelas. Ao reorganizar por prioridade, ela corta gastos adiáveis, negocia uma conta e evita entrar no rotativo. O mês continua duro, mas ela impede uma crise maior no mês seguinte.', calculo: { simples: 'Caixa inicial: R$ 2.800', composto: 'Cortes + negociação: R$ 650 liberados', delta: 'Rotativo evitado: prejuízo futuro reduzido' } },
    { tipo: 'quiz', pergunta: 'Se faltar dinheiro para tudo, qual decisão vem primeiro?', opcoes: ['Manter todos os gastos para não perder padrão de vida.', 'Parcelar novas compras para aliviar emocionalmente o mês.', 'Priorizar essenciais e dívidas com juros destrutivos, negociando o restante.', 'Ignorar vencimentos e esperar o próximo mês.'], correta: 2, expl: 'Em crise de caixa, prioridade é sobrevivência e contenção de dano. O resto precisa ser renegociado, adiado ou cortado temporariamente.' },
    { tipo: 'acao', titulo: 'Monte o modo crise no app', conteudo: 'Abra o orçamento, marque gastos essenciais, pause categorias adiáveis e revise compromissos dos próximos 15 dias. O objetivo é visualizar o que ainda cabe sem gerar dano maior.', cta: 'Abrir orçamento', ctaFn: "go('budget')" }
  ]
},
{
  id: 'br_assinaturas', trilha: 'start', title: 'Assinaturas e Custo Invisível', sub: 'Pequenos vazamentos que somem com seu caixa', emoji: '🧾', dur: '5 min', xp: 60, ok: false, grad: 'linear-gradient(135deg,#7A3E00,#FFAD3B)',
  objective: 'Ensinar o usuário a identificar despesas recorrentes esquecidas que corroem o orçamento sem gerar valor real.',
  outcomeType: 'caixa',
  maturityStage: 'sobreviver',
  behaviorGoal: 'Revisar gastos recorrentes todo mês e cancelar o que não entrega valor proporcional.',
  associatedFeature: 'transactions',
  activationContext: 'Quando o orçamento aperta e vários pequenos débitos recorrentes passam despercebidos.',
  triggerEvents: ['mes_apertado', 'organizar_rotina', 'fatura_alta'],
  references: ['Behavioral leakage em finanças pessoais', 'Richard Thaler — mental accounting', 'Princípios de orçamento base zero'],
  passos: [
    { tipo: 'teoria', titulo: 'O vazamento silencioso', conteudo: 'O problema das assinaturas não é uma assinatura isolada. É o <strong style="color:#FFAD3B">efeito acumulado do pequeno recorrente</strong>: valores que parecem inofensivos sozinhos, mas juntos drenam caixa e reduzem liberdade de decisão.', visual: '💸' },
    { tipo: 'regra', titulo: 'Pergunta que corta ilusão', conteudo: 'Se esta cobrança renovasse hoje, eu assinaria de novo? Se a resposta for não, o gasto virou vazamento. Não é porque é barato que merece continuar.', exemplo: 'Streaming pouco usado, app premium esquecido, clube, academia parada, ferramenta duplicada.' },
    { tipo: 'quiz', pergunta: 'Qual é o maior risco das assinaturas recorrentes?', opcoes: ['Serem cobradas uma única vez.', 'Parecerem pequenas demais para importar isoladamente.', 'Sempre terem multa alta.', 'Nunca aparecerem na fatura.'], correta: 1, expl: 'O risco é psicológico: como cada valor parece pequeno, o usuário subestima o impacto acumulado mensal e anual.' },
    { tipo: 'acao', titulo: 'Faça uma faxina de recorrências', conteudo: 'Abra transações ou extrato, filtre cobranças recorrentes e marque as que não entregam valor claro. Some o total mensal e anual para enxergar o custo invisível.', cta: 'Abrir transações', ctaFn: "go('transactions')" }
  ]
},
{
  id: 'base_zbb', trilha: 'base', title: 'Orçamento Base Zero Prático', sub: 'Cada real precisa ter um destino', emoji: '📒', dur: '7 min', xp: 80, ok: false, grad: 'linear-gradient(135deg,#1E4F84,#4A8BFF)',
  objective: 'Ensinar o orçamento base zero como método operacional para distribuir a renda com intenção, evitando sobras ilusórias.',
  outcomeType: 'caixa',
  maturityStage: 'organizar',
  behaviorGoal: 'Planejar a renda inteira antes que ela seja consumida por impulsos e vazamentos.',
  associatedFeature: 'budget',
  activationContext: 'Quando o usuário quer parar de “ver no fim do mês” e passar a decidir antes de gastar.',
  triggerEvents: ['organizar_rotina', 'iniciar_planejamento', 'mes_apertado'],
  references: ['Zero-Based Budgeting', 'Princípios de cash allocation', 'Educação financeira aplicada ao orçamento doméstico'],
  passos: [
    { tipo: 'teoria', titulo: 'O que é base zero', conteudo: 'No orçamento base zero, sua renda menos suas decisões planejadas precisa resultar em zero. Isso não significa gastar tudo; significa <strong style="color:#4A8BFF">dar função para cada real</strong>: contas, reserva, metas, lazer e margem.', visual: '0️⃣' },
    { tipo: 'regra', titulo: 'Sobra sem destino vira dinheiro evaporado', conteudo: 'Quando você deixa parte da renda “sem nome”, ela tende a sumir em compras impulsivas, pequenos excessos e decisões reativas. Nomear o dinheiro antes protege o mês.', exemplo: 'Salário de R$ 4.000: R$ 2.300 essenciais, R$ 500 reserva, R$ 400 metas, R$ 300 lazer, R$ 500 variáveis = zero sem ilusão.' },
    { tipo: 'quiz', pergunta: 'No orçamento base zero, o resultado ideal da renda planejada menos alocação é:', opcoes: ['Um valor alto sobrando sem destino.', 'Zero, porque cada real recebeu uma função.', 'Negativo, para sobrar emoção.', 'Indefinido até o mês terminar.'], correta: 1, expl: 'Base zero é planejamento intencional. O zero significa que toda a renda foi conscientemente distribuída.' },
    { tipo: 'acao', titulo: 'Distribua sua renda no app', conteudo: 'Abra o orçamento e atribua limites para essenciais, estilo de vida, metas e proteção. Ajuste até toda a renda ter um papel claro no mês.', cta: 'Montar orçamento base zero', ctaFn: "go('budget')" }
  ]
},
{
  id: 'base_envelopes', trilha: 'base', title: 'Envelopes e Categorias', sub: 'Transforme orçamento em limite visível', emoji: '✉️', dur: '6 min', xp: 70, ok: false, grad: 'linear-gradient(135deg,#0F2B46,#2F62D9)',
  objective: 'Transformar o orçamento planejado em limites operacionais simples de acompanhar no dia a dia.',
  outcomeType: 'comportamento',
  maturityStage: 'organizar',
  behaviorGoal: 'Consultar limites por categoria antes de gastar, e não depois.',
  associatedFeature: 'budget',
  activationContext: 'Quando o usuário já entende orçamento, mas ainda estoura categorias por falta de visibilidade prática.',
  triggerEvents: ['organizar_rotina', 'iniciar_planejamento'],
  references: ['Sistema de envelopes', 'Cash allocation por categoria', 'Arquitetura de escolha e fricção positiva'],
  passos: [
    { tipo: 'teoria', titulo: 'O que é um envelope', conteudo: 'Envelope é um limite operacional para uma categoria. Ele transforma uma intenção abstrata em uma fronteira concreta: mercado, transporte, lazer, assinaturas, saúde.', visual: '📬' },
    { tipo: 'regra', titulo: 'Categoria sem limite vira desculpa', conteudo: 'Quando a categoria não tem teto, qualquer gasto parece justificável. O envelope cria atrito saudável e melhora a qualidade da decisão.', exemplo: 'Se lazer tem R$ 250 e já foram R$ 220, a próxima saída deixa de ser impulso e vira decisão consciente.' },
    { tipo: 'quiz', pergunta: 'Qual é a principal vantagem do sistema de envelopes?', opcoes: ['Eliminar todas as despesas do mês.', 'Mostrar limites por categoria antes do estouro.', 'Substituir reserva de emergência.', 'Evitar qualquer uso de cartão.'], correta: 1, expl: 'O sistema de envelopes ajuda a enxergar o limite da categoria antes do problema, não apenas depois.' },
    { tipo: 'acao', titulo: 'Configure envelopes reais', conteudo: 'Abra o orçamento e crie limites para as categorias que mais vazam no seu mês. Comece por mercado, transporte, lazer e assinaturas.', cta: 'Configurar envelopes', ctaFn: "go('budget')" }
  ]
},
{
  id: 'cont_dre_simplificada', trilha: 'contabilidade', title: 'DRE em português claro', sub: 'Descubra se sobrou lucro ou só movimento', emoji: '📑', dur: '7 min', xp: 85, ok: false, grad: 'linear-gradient(135deg,#0B3A35,#14B8A6)',
  objective: 'Ensinar a ler receita, custo, despesa e resultado sem linguagem contábil excessiva.',
  outcomeType: 'contabilidade',
  maturityStage: 'organizar',
  behaviorGoal: 'Fechar o mês entendendo onde o dinheiro girou e o que realmente virou resultado.',
  associatedFeature: 'analytics',
  activationContext: 'Quando entra dinheiro, mas a sensação é de que nunca sobra caixa real no fim do mês.',
  triggerEvents: ['organizar_rotina', 'negocio_sem_separacao', 'recebimento'],
  references: ['Contabilidade gerencial', 'DRE simplificada', 'Margem de contribuição e resultado operacional'],
  passos: [
    { tipo: 'teoria', titulo: 'DRE sem palavrão técnico', conteudo: 'A DRE responde uma pergunta simples: <strong style="color:#14B8A6">o que entrou virou lucro ou só passou pela conta?</strong> Receita não é sinônimo de sobra. Primeiro você tira custos, depois despesas, e só então aparece o resultado.', visual: '🧾' },
    { tipo: 'regra', titulo: 'Entrada de caixa não prova lucro', conteudo: 'Receber R$ 10 mil de clientes parece ótimo, mas se R$ 6 mil foram custo, R$ 2 mil foram despesas e R$ 1 mil ainda é imposto, o resultado real é bem menor. Confundir entrada com lucro gera decisões perigosas.', exemplo: 'Faturar bem e ainda assim terminar o mês sem caixa livre porque margem e despesas foram ignoradas.' },
    { tipo: 'exemplo', titulo: 'Exemplo prático de DRE', conteudo: 'Uma profissional liberal faturou R$ 12.000 no mês. Custos diretos: R$ 3.500. Despesas fixas e operacionais: R$ 4.000. Provisão de imposto: R$ 1.200. Resultado estimado: R$ 3.300. A leitura correta evita achar que os R$ 12 mil estavam livres para gastar.', calculo: { simples: 'Receita: R$ 12.000', composto: 'Resultado estimado: R$ 3.300', delta: 'Lucro é menor que entrada bruta' } },
    { tipo: 'quiz', pergunta: 'Qual frase descreve melhor a DRE?', opcoes: ['Mostra tudo que entrou na conta.', 'Mostra só o saldo bancário final.', 'Mostra como receita, custos e despesas se transformam em resultado.', 'Serve apenas para empresas grandes.'], correta: 2, expl: 'DRE é uma visão de formação do resultado. Ela transforma movimentação em leitura de desempenho real.' },
    { tipo: 'acao', titulo: 'Use a análise como fechamento do mês', conteudo: 'Abra as análises do app e leia o mês separando receita, despesa e sobra. O objetivo é sair da sensação para a leitura financeira objetiva.', cta: 'Abrir análises', ctaFn: "go('analytics')" }
  ]
},
{
  id: 'cont_pf_pj', trilha: 'contabilidade', title: 'Separar PF e negócio', sub: 'Mistura de dinheiro destrói clareza', emoji: '🧩', dur: '6 min', xp: 80, ok: false, grad: 'linear-gradient(135deg,#12324A,#2F62D9)',
  objective: 'Mostrar por que misturar conta pessoal com operação do negócio cria caos contábil e emocional.',
  outcomeType: 'contabilidade',
  maturityStage: 'organizar',
  behaviorGoal: 'Parar de usar o caixa do negócio como extensão da conta pessoal.',
  associatedFeature: 'business',
  activationContext: 'Quando o usuário trabalha por conta própria e não sabe se o negócio paga a própria operação.',
  triggerEvents: ['negocio_sem_separacao', 'organizar_rotina', 'imposto_sem_reserva'],
  references: ['Separação patrimonial', 'Contabilidade básica para MEI e PJ', 'Fluxo de caixa operacional'],
  passos: [
    { tipo: 'teoria', titulo: 'O erro que bagunça tudo', conteudo: 'Quando a mesma conta paga almoço da família, anúncio do negócio, parcela do carro e fornecedor, você perde a capacidade de saber <strong style="color:#2F62D9">quem está sustentando quem</strong>.', visual: '⚠️' },
    { tipo: 'regra', titulo: 'Negócio não é caixa pessoal', conteudo: 'Seu dinheiro pessoal pode vir do negócio, mas precisa sair como retirada definida, pró-labore ou distribuição planejada. Se tudo se mistura, o resultado vira ilusão.', exemplo: 'Cliente pagou hoje e o valor foi usado para mercado, assinatura e gasolina sem nenhuma classificação.' },
    { tipo: 'quiz', pergunta: 'Qual é o principal benefício de separar PF e PJ?', opcoes: ['Pagar menos imposto automaticamente.', 'Entender caixa e resultado real da operação.', 'Eliminar todas as despesas pessoais.', 'Não precisar registrar transações.'], correta: 1, expl: 'A separação existe para gerar clareza operacional. Sem isso, não dá para saber se o negócio é saudável.' },
    { tipo: 'acao', titulo: 'Organize a separação no app', conteudo: 'Classifique lançamentos por escopo pessoal e empresarial e use a visão de negócio para enxergar a operação sem ruído da vida pessoal.', cta: 'Abrir área empresarial', ctaFn: "go('business')" }
  ]
}

];
