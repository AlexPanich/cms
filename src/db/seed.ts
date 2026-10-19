import "dotenv/config";
import { parseEnv } from "../env";
import { seedDatabase } from "./seeder";

// pnpm db:seed — системные роли, меню и тексты лейаута (src/db/seeder.ts).
async function main() {
  await seedDatabase(parseEnv(process.env).DATABASE_URL);
  console.log("Сид применён");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
