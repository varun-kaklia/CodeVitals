import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { countLinesInContent } from "../src/core/counter.js";
import { classifyTier } from "../src/core/classifier.js";
import { deepMergeConfig, sanitizeUserConfig, loadConfig } from "../src/config/loader.js";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { CodeVitalError } from "../src/core/errors.js";
import { formatDeveloperReport } from "../src/reporters/developer.js";

// =======================================================
// Suite 1: Lines of Code (LOC) Counter
// =======================================================
describe("core/counter", () => {
  test("counts empty string as 0 lines", () => {
    const res = countLinesInContent("");
    assert.deepEqual(res, { total: 0, source: 0 });
  });

  test("handles file without trailing newline", () => {
    const res = countLinesInContent("line 1\nline 2");
    assert.deepEqual(res, { total: 2, source: 2 });
  });

  test("does not inflate lines on trailing newline (POSIX/wc -l compliance)", () => {
    // Crucial: 'a\nb\n' has 2 lines of text, not 3!
    const res = countLinesInContent("line 1\nline 2\n");
    assert.deepEqual(res, { total: 2, source: 2 });
  });

  test("correctly filters whitespace-only source lines", () => {
    // 4 physical lines, but 2 are blank/whitespace: source should be 2
    const res = countLinesInContent("line 1\n   \n\t\nline 2\n");
    assert.deepEqual(res, { total: 4, source: 2 });
  });
});

// =======================================================
// Suite 2: Tier Classifier (OR Logic & Boundaries)
// =======================================================
describe("core/classifier", () => {
  test("classifies seed tier within boundaries", () => {
    assert.equal(classifyTier(0, 0, DEFAULT_CONFIG.tiers), "seed");
    assert.equal(classifyTier(15_000, 0, DEFAULT_CONFIG.tiers), "seed");
    assert.equal(classifyTier(10_000, 250 * 1024, DEFAULT_CONFIG.tiers), "seed");
  });

  test("escalates to growth when LOC exceeds seed threshold", () => {
    // 15,001 LOC exceeds seed.maxLoc (15,000)
    assert.equal(classifyTier(15_001, 0, DEFAULT_CONFIG.tiers), "growth");
  });

  test("escalates to growth via OR logic when JS bytes exceeds seed threshold", () => {
    // LOC is small (10k), but JS bytes exceeds 250 KB
    assert.equal(
      classifyTier(10_000, 250 * 1024 + 1, DEFAULT_CONFIG.tiers),
      "growth"
    );
  });

  test("escalates to scale and enterprise", () => {
    assert.equal(classifyTier(50_001, 0, DEFAULT_CONFIG.tiers), "scale");
    assert.equal(classifyTier(150_001, 0, DEFAULT_CONFIG.tiers), "enterprise");
  });
});

// =======================================================
// Suite 3: Config Loader (Sanitization, Merging & Errors)
// =======================================================
describe("config/loader sanitize and merge", () => {
  test("strips invalid types and prevents pollution", () => {
    const raw = {
      ignore: "not-an-array", // Should be stripped
      tiers: {
        seed: { maxLoc: "invalid-string", maxInitialJsBytes: -50 }, // Both invalid!
      },
    };
    const sanitized = sanitizeUserConfig(raw);

    // Because all properties in raw were invalid, sanitized should be clean
    assert.deepEqual(sanitized, {});
  });

  test("deeply merges valid overrides without dropping defaults", () => {
    const user = sanitizeUserConfig({
      ignore: ["custom_dir"],
      tiers: {
        seed: { maxLoc: 20_000 },
      },
    });
    const merged = deepMergeConfig(DEFAULT_CONFIG, user);

    // seed.maxLoc was overridden to 20,000
    assert.equal(merged.tiers.seed.maxLoc, 20_000);

    // seed.maxInitialJsBytes should retain its DEFAULT value!
    assert.equal(
      merged.tiers.seed.maxInitialJsBytes,
      DEFAULT_CONFIG.tiers.seed.maxInitialJsBytes
    );

    // growth should remain intact
    assert.equal(merged.tiers.growth.maxLoc, DEFAULT_CONFIG.tiers.growth.maxLoc);

    // ignore should contain both custom_dir and default node_modules
    assert.ok(merged.ignore.includes("custom_dir"));
    assert.ok(merged.ignore.includes("node_modules"));
  });

  test("Issue #3 guard: user providing enterprise tier does not crash or pollute config", () => {
    const user = sanitizeUserConfig({
      tiers: {
        enterprise: { maxLoc: 999_999 },
      } as any,
    });
    const merged = deepMergeConfig(DEFAULT_CONFIG, user);

    // enterprise is not in ConfigurableTier so it is discarded
    assert.equal((merged.tiers as any).enterprise, undefined);
  });

  test("Issue #6 guard: malformed JSON config file throws CodeVitalError", async () => {
    // 1. Arrange: Create a temporary directory with broken JSON
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codevitals-test-"));
    const badConfigPath = path.join(tempDir, "codevitals.config.json");
    await fs.writeFile(badConfigPath, "{ this is not valid json }", "utf-8");

    try {
      // 2. Act & Assert: loadConfig should reject with CodeVitalError
      await assert.rejects(
        async () => {
          await loadConfig(tempDir);
        },
        (error: unknown) => {
          assert.ok(error instanceof CodeVitalError);
          assert.equal(error.code, "ECONFIG_PARSE");
          return true;
        }
      );
    } finally {
      // Clean up the temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

// =======================================================
// Suite 4: Developer Reporter
// =======================================================
describe("reporters/developer", () => {
  const locReport = {
    totalPhysicalLines: 200_000,
    totalSourceLines: 200_000,
    totalFiles: 1,
    files: [],
    skipped: [],
  };

  test("Issue #12 guard: number formatting is locale-independent", () => {
    const out = formatDeveloperReport({
      tier: "scale",
      thresholds: { maxLoc: 150_000, maxInitialJsBytes: 1024 * 1024 },
      locReport,
    });

    assert.match(out, /200,000/);
    assert.doesNotMatch(out, /2,00,000/); // Indian grouping from host locale
    assert.match(out, /Max: 150,000/);
  });

  test("enterprise tier renders an unbounded maximum", () => {
    const out = formatDeveloperReport({ tier: "enterprise", locReport });

    assert.match(out, /Max: Unlimited/);
    assert.match(out, /ENTERPRISE/);
  });
});