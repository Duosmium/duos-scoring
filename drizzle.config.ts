import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	out: './drizzle',
	schema: './drizzle/schema.ts',
	dbCredentials: {
		url: process.env.DIRECT_URL!
	},
	schemaFilter: ['scoring'],
	// Print all statements
	verbose: true,
	// Always ask for confirmation
	strict: true
});
