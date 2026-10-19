import "dotenv/config";
import postgres from "postgres";
import type { TestProject } from "vitest/node";
import { migrateDatabase } from "../db/migrator";
import { seedDatabase } from "../db/seeder";
import { databaseName, testDatabaseUrl } from "./database-url";

declare module "vitest" {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

// Перед прогоном: тестовая база (src/test/database-url.ts) создаётся, если её нет,
// и приводится к актуальной схеме с данными сида. База разработки тестами не трогается.
export default async function setup(project: TestProject) {
  const url = testDatabaseUrl(process.env);
  await createDatabaseIfMissing(url);
  await migrateDatabase(url.toString());
  await seedDatabase(url.toString());
  project.provide("testDatabaseUrl", url.toString());
}

async function createDatabaseIfMissing(url: URL) {
  const name = databaseName(url);
  const server = new URL(url);
  server.pathname = "/postgres";
  const sql = postgres(server.toString(), { max: 1 });
  try {
    const [exists] = await sql`select 1 from pg_database where datname = ${name}`;
    if (!exists) await sql`create database ${sql(name)}`;
  } finally {
    await sql.end();
  }
}
