// import { drizzle } from "drizzle-orm/node-postgres";
// import * as schema from "./schema/postgres";

// // Check the drizzle documentation for more information on how to connect to your preferred database provider
// // https://orm.drizzle.team/docs/get-started-postgresql

// const databaseUrl = process.env.DATABASE_URL as string;

// if (!databaseUrl) {
// 	throw new Error("DATABASE_URL is not set");
// }

// export const db = drizzle(databaseUrl, {
// 	schema,
// });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("Missing DATABASE_URL");
}

export const connection = postgres(databaseUrl, {
	max: process.env.DB_MIGRATING || process.env.DB_SEEDING ? 1 : undefined,
	onnotice: process.env.DB_SEEDING ? () => {} : undefined,
});

export const db = drizzle(connection, {
	schema,
	logger: true,
});

export type db = typeof db;

export default db;
