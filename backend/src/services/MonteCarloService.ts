// MonteCarloService — Motor de simulação estocástica para projeções de patrimônio.

/**
 * MonteCarloService
 * 
 * Motor de simulação estocástica para projeções de patrimônio.
 * Substitui projeções lineares por bandas de probabilidade (Quantis).
 */

interface MonteCarloInput {
  initialCapital: number;
  monthlyContribution: number;
  years: number;
  expectedAnnualReturn: number;
  annualVolatility: number; // Desvio padrão anual
  iterations?: number;
}

interface SimulationPoint {
  month: number;
  p5: number;   // 5th percentile (Pessimista)
  p50: number;  // 50th percentile (Mediana/Esperado)
  p95: number;  // 95th percentile (Otimista)
}

export class MonteCarloService {
  /**
   * Executa a simulação de Monte Carlo
   */
  public simulate(input: MonteCarloInput): SimulationPoint[] {
    const {
      initialCapital,
      monthlyContribution,
      years,
      expectedAnnualReturn,
      annualVolatility,
      iterations = 1000
    } = input;

    const months = years * 12;
    
    // Converter taxas anuais para mensais
    // Usamos a aproximação de juros compostos para a média e volatilidade
    const monthlyReturn = Math.pow(1 + expectedAnnualReturn, 1 / 12) - 1;
    const monthlyVolatility = annualVolatility / Math.sqrt(12);

    const allSimulations: number[][] = [];

    for (let i = 0; i < iterations; i++) {
      const simulationPath: number[] = [initialCapital];
      let currentCapital = initialCapital;

      for (let m = 1; m <= months; m++) {
        // Gerar retorno aleatório baseado na distribuição normal (Box-Muller)
        const rand = this.generateNormalRandom(monthlyReturn, monthlyVolatility);
        
        currentCapital = (currentCapital + monthlyContribution) * (1 + rand);
        
        // Evitar capital negativo (simplificação)
        if (currentCapital < 0) currentCapital = 0;
        
        simulationPath.push(currentCapital);
      }
      allSimulations.push(simulationPath);
    }

    // Processar resultados para extrair quantis por mês
    const results: SimulationPoint[] = [];

    for (let m = 0; m <= months; m++) {
      // Extrair todos os valores do mês 'm' de todas as simulações
      const monthValues = allSimulations.map(sim => sim[m]).sort((a, b) => a - b);
      
      results.push({
        month: m,
        p5: monthValues[Math.floor(iterations * 0.05)],
        p50: monthValues[Math.floor(iterations * 0.50)],
        p95: monthValues[Math.floor(iterations * 0.95)]
      });
    }

    return results;
  }

  /**
   * Gerador de números aleatórios com distribuição normal (Box-Muller Transform)
   */
  private generateNormalRandom(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converter [0,1) para (0,1)
    while (v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }
}
