import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';


const connectionString = process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error('POSTGRES_URL_NON_POOLING is not set in environment variables');
}



// The connection string from Azure already contains the sslmode=require parameter,
// so we can rely on the postgres library to handle the SSL connection automatically.
// Explicitly enabling SSL in the connection options is more robust for Azure.
// This ensures the library uses TLS, which Azure requires.
export const client = postgres(connectionString, {
  ssl: 'require',
});

export const db = drizzle(client, { schema });
