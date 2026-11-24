import { afterAll } from "vitest";
import { assertLocalDatabase } from "./guard";

assertLocalDatabase();

afterAll(async () => {
  const { closeDb } = await import("@/server/db/client");
  await closeDb();
});
