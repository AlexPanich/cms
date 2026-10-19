import "dotenv/config";
import { inject } from "vitest";

// Интеграционные тесты ходят в отдельную базу, её готовит src/test/global-setup.ts.
// env() читается лениво, поэтому подмена до первого запроса к БД действует на db().
process.env.DATABASE_URL = inject("testDatabaseUrl");
