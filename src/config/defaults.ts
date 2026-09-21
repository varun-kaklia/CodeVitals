import type { CodeVitalsConfig } from "../types/index.js";

export const DEFAULT_CONFIG: CodeVitalsConfig = {
    tiers: {
        seed: {
            maxLoc: 15_000,
            maxInitialJsBytes: 250 * 1024, // 250 KB
        },
        growth: {
            maxLoc: 50_000,
            maxInitialJsBytes: 500 * 1024, // 500 KB
        },
        scale: {
            maxLoc: 150_000,
            maxInitialJsBytes: 1024 * 1024, // 1 MB
        },
    },
    ignore: [
        "node_modules",
        ".git",
        "dist",
        "build",
        "coverage",
        ".next",
        ".cache",
        ".turbo",
    ],
};

// Supported extensions for Phase 1
export const DEFAULT_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
]);
