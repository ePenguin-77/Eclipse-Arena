import type { CombatRules } from '../contracts/combat';

// Phase 3 prototype tuning, not claimed as Afterimage War balance values.
export const DEFAULT_MAX_HP = 100;
export const COMBAT_RULES: Readonly<CombatRules> = Object.freeze({
  damageScale: 0.38,
  minDamage: 8,
  maxDamage: 20,
  minImpactSpeed: 260,
  maxImpactSpeed: 660,
  collisionCooldownTicks: 27, // 0.45 s at the established 60 Hz simulation rate.
  historyLimit: 64,
});
export const scaledDamage = (amount: number) => Math.round(amount * (COMBAT_RULES.damageScale ?? 1) * 100) / 100;
