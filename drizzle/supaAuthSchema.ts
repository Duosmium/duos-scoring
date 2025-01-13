import { pgSchema, uuid, varchar } from 'drizzle-orm/pg-core';

export const auth = pgSchema('auth');

export const User = auth.table('users', {
	id: uuid('id').primaryKey(),
	email: varchar('email')
});
