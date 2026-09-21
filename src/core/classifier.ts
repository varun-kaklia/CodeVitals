import type { ConfigurableTier, TierName, TierThreshold } from "../types/index.js";

/**
 * Pure function: Classifies codebase scale into lifecycle tiers using OR logic.
 *
 * @param loc - Total source lines of code
 * @param initialJsBytes - Total initial JavaScript bundle size in bytes (0 in Phase 1)
 * @param tiers - The resolved tier thresholds
 * @returns The classified TierName ('seed' | 'growth' | 'scale')
 */

/**
 * Classifies codebase scale into progressive lifecycle tiers using OR logic.
 * Note: 'enterprise' is the terminal, unbounded tier representing any codebase
 * that has scaled past the 'scale' threshold.
 */

export function classifyTier(
    loc: number,
    initialBytes: number,
    tiers: Record<ConfigurableTier, TierThreshold>
): TierName {

    // Check scale tier threshold first (escalates to enterprise)
    if (loc > tiers.scale.maxLoc || initialBytes > tiers.scale.maxInitialJsBytes) {
        return 'enterprise'
    }
    // Check growth tier threshold (escalates to scale)
    if (loc > tiers.growth.maxLoc || initialBytes > tiers.growth.maxInitialJsBytes) {
        return 'scale';
    }
    // Check seed tier threshold (escalates to growth)
    if (loc > tiers.seed.maxLoc || initialBytes > tiers.seed.maxInitialJsBytes) {
        return 'growth';
    }
    // Otherwise, remains within seed
    return 'seed'
}