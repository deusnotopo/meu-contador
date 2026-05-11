import { db } from '../lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../lib/logger.js';

const execAsync = promisify(exec);

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  compress: boolean;
}

const defaultConfig: BackupConfig = {
  backupDir: process.env.BACKUP_DIR || '/tmp/backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  compress: true,
};

/**
 * Cria um backup do banco de dados
 */
export async function createBackup(config: BackupConfig = defaultConfig) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = path.join(config.backupDir, filename);

  try {
    // Garantir que o diretório de backup existe
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }

    // Extrair detalhes de conexão do DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL!;
    
    // Se for SQLite, usar comando cp
    if (databaseUrl.startsWith('file:')) {
      const dbPath = databaseUrl.replace('file:', '');
      const targetPath = config.compress ? `${filepath}.gz` : filepath;
      
      if (config.compress) {
        await execAsync(`gzip -c ${dbPath} > ${targetPath}`);
      } else {
        fs.copyFileSync(dbPath, filepath);
      }
    } else {
      // Caso contrário, assumir PostgreSQL
      const dbUrl = new URL(databaseUrl);
      const pgDumpCmd = `pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -f ${filepath}`;
      
      await execAsync(pgDumpCmd, {
        env: { ...process.env, PGPASSWORD: dbUrl.password },
      });

      if (config.compress) {
        await execAsync(`gzip ${filepath}`);
      }
    }

    const finalFilepath = config.compress ? `${filepath}.gz` : filepath;
    const finalFilename = config.compress ? `${filename}.gz` : filename;

    // Log backup
    await db.auditLog.create({
      data: {
        action: 'BACKUP_CREATED',
        resource: 'database',
        metadata: JSON.stringify({ 
          filename: finalFilename,
          size: fs.statSync(finalFilepath).size,
          timestamp: new Date().toISOString(),
          compressed: config.compress,
        }),
      },
    });

    return { success: true, filename: finalFilename, filepath: finalFilepath };
  } catch (error) {
    logger.error('[Backup] Backup failed', error);
    
    // Log failure
    await db.auditLog.create({
      data: {
        action: 'BACKUP_FAILED',
        resource: 'database',
        metadata: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    throw error;
  }
}

/**
 * Remove backups antigos
 */
export async function cleanupOldBackups(config: BackupConfig = defaultConfig) {
  try {
    const files = fs.readdirSync(config.backupDir);
    const now = Date.now();
    const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    for (const file of files) {
      if (!file.startsWith('backup-') || (!file.endsWith('.sql') && !file.endsWith('.sql.gz'))) {
        continue;
      }
      
      const filepath = path.join(config.backupDir, file);
      const stats = fs.statSync(filepath);
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > retentionMs) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      await db.auditLog.create({
        data: {
          action: 'BACKUP_CLEANUP',
          resource: 'database',
          metadata: JSON.stringify({ 
            deletedCount,
            retentionDays: config.retentionDays,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    }
    
    return { success: true, deletedCount };
  } catch (error) {
    logger.error('[Backup] Backup cleanup failed', error);
    throw error;
  }
}

/**
 * Função de backup manual para execução imediata
 */
export async function runManualBackup() {
  logger.info('[Backup] Starting manual backup...');
  try {
    const result = await createBackup();
    logger.info(`[Backup] Manual backup completed: ${result.filename}`);
    return result;
  } catch (error) {
    logger.error('[Backup] Manual backup failed', error);
    throw error;
  }
}