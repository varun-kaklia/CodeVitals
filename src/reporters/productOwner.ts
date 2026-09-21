import type { TierName } from "../types/index.js"

export interface ProductOwnerReportData {
    tier: TierName;
}

export function formatProductOwnerReport(data: ProductOwnerReportData): string {
    const { tier } = data

    const descriptions: Record<TierName, { status: string; advice: string }> = {
        seed: {
            status: "🟢 Healthy (Early Stage)",
            advice: "Codebase is lean and agile. Prioritize product velocity; lightweight governance is sufficient.",
        },
        growth: {
            status: "🟡 Maturing (Growth Stage)",
            advice: "System is expanding. Start monitoring module boundaries and team code ownership.",
        },
        scale: {
            status: "🟠 High Complexity (Scale Stage)",
            advice: "Large codebase requiring automated architectural guards to prevent velocity decay.",
        },
        enterprise: {
            status: "🔴 Mission Critical (Enterprise Stage)",
            advice: "Strict governance active. Architectural changes require rigorous automated validation.",
        },
    }

    const summary = descriptions[tier];
    return [
        "----------------------------------------",
        " 📊 PRODUCT OWNER SUMMARY",
        "----------------------------------------",
        `Health Status: ${summary.status}`,
        `Current Stage: ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`,
        `Recommendation: ${summary.advice}`,
        "----------------------------------------",
    ].join("\n");
}