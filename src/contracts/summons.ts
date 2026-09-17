import type { Vec2 } from './geometry';

/** A companion is not a match participant or a character physics body. */
export interface SummonDefinition {
  id: string; name: string; maxHP?: number; radius: number; speed: number;
  lifetimeTicks: number; attackIntervalTicks: number; attackRange: number;
  contactDamage: number; contactCooldownTicks: number;
  attachment?: { maxCount: number; impactsToDispel: number };
}
export interface SummonEmpowerment { durationTicks: number; damageMultiplier: number; attackIntervalTicks: number; pulseRadius: number }
export interface SummonSnapshot {
  id: string; ownerId: string; abilityId: string; name: string;
  position: Vec2; previousPosition: Vec2; velocity: Vec2; radius: number;
  hp?: number; maxHP?: number; spawnedTick: number; expiresTick: number;
  impactsRemaining?: number; impactsToDispel?: number;
  targetId?: string; empoweredUntil: number; empowermentAbilityId?: string;
  attachedTo?: string;
}
