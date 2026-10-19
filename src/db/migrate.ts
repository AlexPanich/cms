import "dotenv/config";
import { parseEnv } from "../env";
import { migrateDatabase } from "./migrator";

async function main() {
  await migrateDatabase(parseEnv(process.env).DATABASE_URL);
  console.log("Миграции применены");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
