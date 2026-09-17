import type { EntityId } from './entity';
import type { StatusState } from './status';
import type { LifestealDefinition } from './status';

export interface RecoveryProfile { lifesteal: LifestealDefinition; bonusRatio: number; healingMultiplier: number; costs: ReadonlyMap<string, number> }
export interface RecoveryEvent { id: number; tick: number; ownerId: string; kind: 'lifesteal' | 'health-cost' | 'time-rewind'; amount: number; hpBefore: number; hpAfter: number }

export interface CombatantDefinition { id: EntityId; maxHP: number; damageMultiplier: number; collisionDamageMultiplier?: number }
export interface CombatantState extends CombatantDefinition { hp: number; alive: boolean }
export interface CombatRules {
  /** Global tuning applied once to every damage source. Omitted means unscaled. */
  damageScale?: number;
  minDamage: number;
  maxDamage: number;
  minImpactSpeed: number;
  maxImpactSpeed: number;
  collisionCooldownTicks: number;
  historyLimit: number;
}
export interface CombatSetup { rules: CombatRules; combatants: CombatantDefinition[] }
export interface CollisionImpact { bodyId: EntityId; otherId: EntityId; impactSpeed: number; impulseApplied: boolean }
export interface DamageRequest {
  maskStrike?: {face:'wrath'|'sorrow'|'smile';empowered:boolean};
  dodged?: true;
  tick: number;
  source: { kind: 'collision'; attackerId: EntityId } | { kind: 'melee'; attackerId: EntityId; abilityId: string } |
    { kind: 'projectile'; attackerId: EntityId; abilityId: string; projectileId: string } |
    { kind: 'area'; attackerId: EntityId; abilityId: string; areaId: string } |
    { kind: 'summon'; attackerId: EntityId; abilityId: string; summonId: string } |
    { kind: 'status'; attackerId: EntityId; abilityId: string; statusId: string };
  targetId: EntityId;
  amount: number;
}
export interface DamageResult {
  request: DamageRequest;
  appliedDamage: number;
  hpBefore: number;
  hpAfter: number;
  defeated: boolean;
  outcome: 'applied' | 'dodged' | 'invalid-request' | 'unknown-entity' | 'source-defeated' | 'target-defeated';
}
export interface CombatSnapshot {
  recoveryEvents?: RecoveryEvent[];
  statuses?: StatusState[];
  combatants: CombatantState[];
  results: (DamageResult & { id: number })[];
  totalDamage: number;
  status: 'active' | 'finished';
  winnerId: EntityId | null;
  finishedTick: number | null;
  rules: CombatRules;
}
