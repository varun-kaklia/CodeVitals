export type TierName = "seed" | "growth" | "scale" | "enterprise";
export type ConfigurableTier = Exclude<TierName, "enterprise">;

export interface TierThreshold {
  /** Upper boundary for this tier before escalating to the next tier */
  maxLoc: number;
  maxInitialJsBytes: number;
}

export interface CodeVitalsConfig {
  tiers: Record<ConfigurableTier, TierThreshold>;
  ignore: string[];
}

/**
 * Partial configuration that can be supplied by the user via a config file.
 * Every field and sub-field is optional.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? U[] // If it's an array, keep it as an array of U, don't make items inside optional!
    : T[P] extends object
    ? DeepPartial<T[P]> // If it's a normal object, recurse
    : T[P]; // Primitive (number, string, etc.)
};

export type UserCodeVitalsConfig = DeepPartial<CodeVitalsConfig>;