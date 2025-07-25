import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';


if (!process.env.POSTGRES_URL_NON_POOLING) {
  throw new Error('POSTGRES_URL_NON_POOLING is not set in environment variables');
}

export const client = postgres(process.env.POSTGRES_URL_NON_POOLING, { ssl: 'require' });
export const db = drizzle(client, { schema });
