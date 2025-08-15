import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Prefer pooled connection string if available, otherwise fall back to non-pooled
const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error('POSTGRES_URL or POSTGRES_URL_NON_POOLING is not set in environment variables');
}

// During dev/HMR, prevent creating multiple pools by caching on globalThis
declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: ReturnType<typeof postgres> | undefined;
}

const maxPool = Number(process.env.POSTGRES_POOL_MAX ?? '5');

// The connection string from Azure already contains the sslmode=require parameter,
// so we can rely on the postgres library to handle the SSL connection automatically.
// Use a small pool and disable prepared statements for PgBouncer compatibility.
export const client = globalThis.__postgresClient ?? postgres(connectionString, {
  ssl: 'require',
  max: maxPool,
  idle_timeout: 20, // seconds
  connect_timeout: 10, // seconds
  prepare: false,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__postgresClient = client;
}

export const db = drizzle(client, { schema });
