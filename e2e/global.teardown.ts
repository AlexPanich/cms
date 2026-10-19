import { test as teardown } from "@playwright/test";
import { cleanupE2EData } from "./fixtures";

teardown("удаление данных E2E", async () => {
  await cleanupE2EData();
});
