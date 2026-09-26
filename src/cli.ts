#!/usr/bin/env node
import path from "node:path";
import { loadConfig } from "./config/index.js";
import { classifyTier } from "./core/classifier.js";
import { countLoc } from "./core/counter.js";
import { walkDirectory } from "./core/walker.js";
import { formatDeveloperReport } from "./reporters/developer.js";
import { formatProductOwnerReport } from "./reporters/productOwner.js";
import { parseArgs } from "node:util"
import { handleCliError } from "./cliError.js";

let parsed;
try {
  parsed = parseArgs({
    options: {
      dir: { type: "string", short: "d", default: "." },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
    allowPositionals: true,
  });
} catch (error: any) {
  handleCliError(error)
}
const { values, positionals } = parsed

if (values.help) {
  console.log("Usage: codevitals [options] [path] ...");
  process.exit(0);
}

if (values.version) {
  console.log("codevitals v0.1.0");
  process.exit(0);
}

const targetPath = positionals[0] ?? values.dir ?? ".";
const resolvedDir = path.resolve(process.cwd(), targetPath);

try {
  const config = await loadConfig(resolvedDir);
  const files = await walkDirectory(resolvedDir, { ignore: config.ignore, extensions: config.extensions });

  const locReport = await countLoc(files);
  const tier = classifyTier(locReport.totalSourceLines, 0, config.tiers);

  if (locReport.skipped.length > 0) {
    console.warn(`\n[CodeVitals] Skipped ${locReport.skipped.length} unreadable files:`);
    for (const s of locReport.skipped) {
      console.warn(`  • ${s.filePath} (${s.code ?? "UNKNOWN"})`);
    }
  }

console.log("\n" + formatDeveloperReport({
  tier,
  thresholds: tier !== "enterprise" ? config.tiers[tier] : undefined,
  locReport,
}));
  console.log("\n" + formatProductOwnerReport({
    tier,
  }) + "\n");
} catch (error: any) {
  handleCliError(error)
}