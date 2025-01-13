import 'dotenv/config';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

import * as supaAuthSchema from './supaAuthSchema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema: { ...schema, ...relations } });

export const supaAuthDb = drizzle(client, { schema: supaAuthSchema });
