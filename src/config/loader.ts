import fs from "node:fs/promises";
import path from "node:path";
import type { CodeVitalsConfig, TierName, TierThreshold, UserCodeVitalsConfig } from "../types/index.js";
import { DEFAULT_CONFIG } from "./defaults.js";
import { CodeVitalError } from "../core/errors.js";

/**
 * Normalizes one extension to lowercase, dot-prefixed form, so ".TS", "ts"
 * and " .ts " all match what path.extname() returns.
 */
function normalizeExtension(ext: string): string {
    const trimmed = ext.trim().toLowerCase();
    return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

/**
 * Pure function: deeply merges user overrides on top of the base configuration
 */
export function deepMergeConfig(
    base: CodeVitalsConfig,
    override: UserCodeVitalsConfig
): CodeVitalsConfig {
    const result: CodeVitalsConfig = {
        tiers: {
            seed: { ...base.tiers.seed, ...(override.tiers?.seed ?? {}) },
            growth: { ...base.tiers.growth, ...(override.tiers?.growth ?? {}) },
            scale: { ...base.tiers.scale, ...(override.tiers?.scale ?? {}) },
        },
        ignore: override.ignore
            ? Array.from(new Set([...base.ignore, ...override.ignore]))
            : base.ignore,
        // REPLACE, don't union. Someone analysing Python wants [".py"] INSTEAD
        // of the JS defaults. `ignore` unions because you always want the
        // built-in ignores; extensions are the opposite case.
        extensions: override.extensions && override.extensions.length > 0
            ? Array.from(new Set(override.extensions))
            : base.extensions,
    }
    return result;
}

/** 
* Creating pure sanitizer/validator function
* So, that if user enter something that didn't create bug during run time.
*As Typescript didn't protest against runtime bugs because JSON.parse returns any.
*/

/**
 * Helper to check if a value is a valid positive number
 */
function isValidPositiveNumber(val: unknown): val is number {
    return typeof val === "number" && Number.isFinite(val) && val >= 0;
}

/**
 * Sanitizes untrusted config input, dropping invalid types so defaults survive
 */
export function sanitizeUserConfig(raw: unknown): UserCodeVitalsConfig {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        return {};
    }

    const input = raw as Record<string, unknown>;
    const sanitized: UserCodeVitalsConfig = {};

    // 1. Validate ignore array
    if (Array.isArray(input.ignore)) {
        sanitized.ignore = input.ignore.filter(
            (item): item is string => typeof item === "string" && item.trim().length > 0
        );
    }

    if (Array.isArray(input.extensions)) {
        sanitized.extensions = input.extensions
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map(normalizeExtension);
    }

    // 2. Validate EVERY tier
    if (typeof input.tiers === "object" && input.tiers !== null && !Array.isArray(input.tiers)) {
        const rawTiers = input.tiers as Record<string, unknown>;
        const tierNames: TierName[] = ["seed", "growth", "scale"];
        const tiersObj: Partial<Record<TierName, Partial<TierThreshold>>> = {};

        for (const name of tierNames) {
            const rawTier = rawTiers[name];
            if (typeof rawTier === "object" && rawTier !== null && !Array.isArray(rawTier)) {
                const t = rawTier as Record<string, unknown>;
                const threshold: Partial<TierThreshold> = {};

                // Validate maxLoc
                if (isValidPositiveNumber(t.maxLoc)) {
                    threshold.maxLoc = t.maxLoc;
                }

                // Validate maxInitialBytes
                if (isValidPositiveNumber(t.maxInitialBytes)) {
                    threshold.maxInitialBytes = t.maxInitialBytes;
                }

                // Only attach if at least one valid property was provided
                if (Object.keys(threshold).length > 0) {
                    tiersObj[name] = threshold;
                }
            }
        }

        // Only attach tiers if at least one tier had valid overrides
        if (Object.keys(tiersObj).length > 0) {
            sanitized.tiers = tiersObj as any;
        }
    }

    return sanitized;
}

/**
 * Discovers and loads codevitals.config.json from the target directory.
 * If not found, gracefully falls back to DEFAULT_CONFIG.
 */
export async function loadConfig(
    targetDir: string = process.cwd()
): Promise<CodeVitalsConfig> {
    const configPath = path.resolve(targetDir, "codevitals.config.json");
    try {
        const rawContent = await fs.readFile(configPath, "utf-8");
        const parsed: UserCodeVitalsConfig = JSON.parse(rawContent);

        const validated = sanitizeUserConfig(parsed);
        return deepMergeConfig(DEFAULT_CONFIG, validated);
    } catch (error: any) {
        if (error?.code === "ENOENT") {
            return DEFAULT_CONFIG;
        }
        throw new CodeVitalError(
            `Failed to parse ${configPath}: ${error.message}`,
            "ECONFIG_PARSE"
        );
    }
}