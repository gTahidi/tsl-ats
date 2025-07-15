import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

if (!process.env.POSTGRES_PRISMA_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.POSTGRES_PRISMA_URL);
export const db = drizzle(client, { schema });
