import type { TierName, TierThreshold, LocReport } from "../types/index.js";

/**
 * Pinned to "en-US" so output is byte-identical on every machine and in CI.
 * Bare toLocaleString() inherits the host locale (e.g. "2,00,000" on an
 * Indian-locale machine vs "200,000" in US CI), which breaks the
 * "same input -> same output" guarantee Phase 3 diffs and Phase 5 rely on.
 */
const fmt = (n: number) => n.toLocaleString("en-US");

export interface DeveloperReportData {
    tier: TierName;
    thresholds?: TierThreshold;
    locReport: LocReport;
}

export function formatDeveloperReport(data: DeveloperReportData): string {
    const { tier, thresholds, locReport } = data
    const maxLocStr = (!thresholds || thresholds.maxLoc === Infinity)
        ? "Unlimited"
        : fmt(thresholds.maxLoc);
    return [
        "========================================",
        " 🛠️  CODEVITALS: DEVELOPER METRICS",
        "========================================",
        `• Classified Tier: ${tier.toUpperCase()}`,
        `• Files Analyzed:  ${locReport.totalFiles}`,
        `• Physical Lines:  ${fmt(locReport.totalPhysicalLines)}`,
        `• Source Lines:    ${fmt(locReport.totalSourceLines)} (Max: ${maxLocStr})`,
        "========================================",
    ].join("\n");
}