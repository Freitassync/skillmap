import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../lib/logger';

/**
 * Run database migrations on startup
 */
export async function runMigrations(pool: Pool): Promise<void> {
  try {
    logger.info('Checking database migrations...');

    // Check if tables exist
    const tablesExist = await checkTablesExist(pool);

    if (tablesExist) {
      logger.info('Database tables already exist, skipping migrations');
      return;
    }

    logger.info('Running database migrations...');

    // Get migration files
    const migrationsDir = path.join(__dirname, '../../db/migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order

    // Run each migration file
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info({ file }, 'Running migration');
      await pool.query(sql);
      logger.info({ file }, 'Migration completed');
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error({ error }, 'Migration error');
    throw error;
  }
}

/**
 * Check if database tables already exist
 */
async function checkTablesExist(pool: Pool): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    return result.rows[0].exists;
  } catch (error) {
    logger.error({ error }, 'Error checking tables');
    return false;
  }
}
