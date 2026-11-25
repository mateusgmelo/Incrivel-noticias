/**
 * Roda o agregador pela linha de comando (mesmo código do painel e do cron).
 *   npm run ingest
 */
import "./load-env";
import { closeDb } from "../src/server/db/client";
import { ingestService } from "../src/server/modules/ingest/ingest.service";

ingestService
  .runAsSystem()
  .then((r) => {
    console.log(`✔ ${r.created} novas (${r.published} publicadas direto) · ${r.skipped} já existiam · ${r.blocked} fora da licença`);
    for (const s of r.results.filter((x) => x.error)) console.log(`  ✖ ${s.source}: ${s.error}`);
  })
  .catch((err) => {
    console.error("✖ falha na importação:", err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
