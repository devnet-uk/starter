import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("Missing DATABASE_URL");
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./drizzle/schema/postgres.ts",
	out: "./drizzle/migrations",
	casing: "snake_case",
	migrations: {
		table: "drizzle_migrations",
		schema: "public",
	},
	dbCredentials: {
		url: databaseUrl,
	},
	verbose: true,
	strict: true,
});
