import { db } from '../lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

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

export async function createBackup(config: BackupConfig = defaultConfig) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = path.join(config.backupDir, filename);

  try {
    // Ensure backup directory exists
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }

    // Extract connection details from DATABASE_URL
    const dbUrl = new URL(process.env.DATABASE_URL!);
    
    // Create backup using pg_dump
    const pgDumpCmd = `pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -f ${filepath}`;
    
    await execAsync(pgDumpCmd, {
      env: { ...process.env, PGPASSWORD: dbUrl.password },
    });

    // Compress if enabled
    if (config.compress) {
      await execAsync(`gzip ${filepath}`);
      const compressedPath = `${filepath}.gz`;
      
      // Log backup
      await db.auditLog.create({
        data: {
          action: 'BACKUP_CREATED',
          resource: 'database',
          metadata: JSON.stringify({ 
            filename: `${filename}.gz`,
            size: fs.statSync(compressedPath).size,
            timestamp: new Date().toISOString(),
            compressed: true,
          }),
        },
      });

      return { success: true, filename: `${filename}.gz`, filepath: compressedPath };
    }

    // Log backup
    await db.auditLog.create({
      data: {
        action: 'BACKUP_CREATED',
        resource: 'database',
        metadata: JSON.stringify({ 
          filename,
          size: fs.statSync(filepath).size,
          timestamp: new Date().toISOString(),
          compressed: false,
        }),
      },
    });

    return { success: true, filename, filepath };
  } catch (error) {
    console.error('Backup failed:', error);
    
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
    console.error('Backup cleanup failed:', error);
    throw error;
  }
}

// Schedule daily backup at 2 AM
import cron from 'node-cron';

export function startBackupScheduler() {
  // Run backup daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting scheduled backup...');
    try {
      await createBackup();
      console.log('Backup completed successfully');
      
      // Cleanup old backups weekly (Sunday at 3 AM)
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 3) {
        await cleanupOldBackups();
        console.log('Backup cleanup completed');
      }
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  });
  
  console.log('Backup scheduler started');
}

// Manual backup function for immediate execution
export async function runManualBackup() {
  console.log('Starting manual backup...');
  try {
    const result = await createBackup();
    console.log('Manual backup completed:', result.filename);
    return result;
  } catch (error) {
    console.error('Manual backup failed:', error);
    throw error;
  }
}