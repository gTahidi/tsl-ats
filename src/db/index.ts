import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';


if (!process.env.POSTGRES_URL_NON_POOLING) {
  throw new Error('POSTGRES_URL_NON_POOLING is not set in environment variables');
}

// The connection string from Azure already contains the sslmode=require parameter,
// so we can rely on the postgres library to handle the SSL connection automatically.
export const client = postgres(process.env.POSTGRES_URL_NON_POOLING);
export const db = drizzle(client, { schema });
