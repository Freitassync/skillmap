import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';
import logger from '../lib/logger';

dotenv.config();

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database error');
  process.exit(-1);
});

/**
 * Get a client from the pool
 */
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

/**
 * Execute a query
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ text: text.substring(0, 50), duration, rows: res.rowCount }, 'Executed query');
    return res;
  } catch (error) {
    logger.error({ error }, 'Query error');
    throw error;
  }
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW()');
    logger.info({ time: result.rows[0].now }, 'Database connection test successful');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection test failed');
    return false;
  }
};

export default pool;
