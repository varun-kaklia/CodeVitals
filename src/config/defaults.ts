import type { CodeVitalsConfig } from "../types/index.js";

// Supported extensions for Phase 1
export const DEFAULT_EXTENSIONS = [
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
];

export const DEFAULT_CONFIG: CodeVitalsConfig = {
    tiers: {
        seed: {
            maxLoc: 15_000,
            maxInitialBytes: 250 * 1024, // 250 KB
        },
        growth: {
            maxLoc: 50_000,
            maxInitialBytes: 500 * 1024, // 500 KB
        },
        scale: {
            maxLoc: 150_000,
            maxInitialBytes: 1024 * 1024, // 1 MB
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
    extensions: DEFAULT_EXTENSIONS
};
