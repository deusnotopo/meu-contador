import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { logger } from '@/lib/logger';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

export class DuckDBService {
  private static instance: DuckDBService;
  private db: duckdb.AsyncDuckDB | null = null;
  private conn: duckdb.AsyncDuckDBConnection | null = null;
  private initPromise: Promise<void> | null = null;

  // Mutex simples: garante que apenas uma operação de INSERT rode por vez,
  // evitando os erros de ENTRY_ALREADY_EXISTS em chamadas concorrentes.
  private insertMutex: Promise<void> = Promise.resolve();

  private constructor() {}

  public static getInstance(): DuckDBService {
    if (!DuckDBService.instance) {
      DuckDBService.instance = new DuckDBService();
    }
    return DuckDBService.instance;
  }

  public async init(): Promise<void> {
    if (this.db && this.conn) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker!);
        const duckLogger = new duckdb.ConsoleLogger();

        this.db = new duckdb.AsyncDuckDB(duckLogger, worker);
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        this.conn = await this.db.connect();

        logger.info('[DuckDBService] Inicializado via WebAssembly no Browser.');
      } catch (err) {
        // Reseta a promise para permitir nova tentativa se o componente remontar
        this.initPromise = null;
        this.db = null;
        this.conn = null;
        logger.error('[DuckDBService] Erro ao instanciar o backend de banco em WASM', err);
        throw err;
      }
    })();

    return this.initPromise;
  }

  public async insertTransactions(data: Record<string, unknown>[]): Promise<void> {
    // Guard: não insere dados vazios — evita o erro "The document is empty"
    if (!data || data.length === 0) {
      logger.debug('[DuckDBService] insertTransactions: array vazio — ignorado.');
      return;
    }

    // Mutex: encadeia a próxima inserção na anterior via promise chain.
    // Assim, mesmo que `insertTransactions` seja chamado múltiplas vezes em
    // paralelo pelo React, as execuções serão serializadas.
    this.insertMutex = this.insertMutex.then(() => this._doInsert(data)).catch(() => {
      // Swallow error in the queue so the chain doesn't break for future calls
    });

    return this.insertMutex;
  }

  private async _doInsert(data: Record<string, unknown>[]): Promise<void> {
    if (!this.conn || !this.db) {
      await this.init();
    }

    try {
      // Dropa a tabela anterior (se existir) antes de criar uma nova versão limpa
      await this.conn!.query('DROP TABLE IF EXISTS transactions');

      // Registra o JSON no sistema de arquivos virtual do WASM
      const jsonString = JSON.stringify(data);
      await this.db!.registerFileText('transactions.json', jsonString);

      // Cria a tabela a partir do JSON
      await this.conn!.insertJSONFromPath('transactions.json', { name: 'transactions' });

      // Limpa o arquivo da memória virtual para não vazar recursos
      await this.db!.dropFile('transactions.json');

      logger.info(`[DuckDBService] Tabela "transactions" recriada com ${data.length} linha(s).`);
    } catch (err) {
      logger.error('[DuckDBService] Falha ao inserir transações no WASM', err);
      throw err;
    }
  }

  public async query(sql: string): Promise<Record<string, unknown>[]> {
    if (!this.conn) {
      await this.init();
    }
    try {
      const arrowResult = await this.conn!.query(sql);
      // Converte de Apache Arrow para JSON array JS-friendly
      return arrowResult.toArray().map((row) => row.toJSON());
    } catch (err) {
      logger.error('[DuckDBService] Erro na query', { sql, err });
      throw err;
    }
  }

  public async getAIContextualSnapshot(): Promise<string> {
    if (!this.conn) {
      await this.init();
    }
    try {
      // Verify if transactions table exists
      const tables = await this.query("SHOW TABLES");
      const hasTransactions = tables.some((t: Record<string, unknown>) => t.name === 'transactions');
      
      if (!hasTransactions) {
        return JSON.stringify({ message: "Nenhum dado financeiro indexado no motor." });
      }

      // 1. Top categories
      const topCategories = await this.query(`
        SELECT category, SUM(amount) as total
        FROM transactions
        WHERE type = 'expense'
        GROUP BY category
        ORDER BY total DESC
        LIMIT 3
      `);

      // 2. Recent items
      const recentItems = await this.query(`
        SELECT date, category, amount, description
        FROM transactions
        WHERE type = 'expense'
        ORDER BY date DESC
        LIMIT 5
      `);

      // 3. Cash flow balance
      const flow = await this.query(`
        SELECT type, SUM(amount) as total
        FROM transactions
        GROUP BY type
      `);

      return JSON.stringify({
        context_source: "DuckDB_WASM_Analytics",
        generated_at: new Date().toISOString(),
        top_expense_categories: topCategories,
        recent_expenses: recentItems,
        cash_flow: flow
      });
    } catch (err) {
      logger.error('[DuckDBService] Erro ao construir snapshot da IA', err);
      return JSON.stringify({ error: "Falha na construção do contexto RAG pelo DuckDB." });
    }
  }

  public async close() {
    if (this.conn) await this.conn.close();
    if (this.db) await this.db.terminate();
    this.conn = null;
    this.db = null;
    this.initPromise = null;
    logger.info('[DuckDBService] Conexão encerrada.');
  }
}

export const analyticsDB = DuckDBService.getInstance();
