import type { PullDefinition } from './forces';
/** Shared, serializable effects. No character IDs or rendering callbacks. */
export type StatusEffect =
  | { kind:'drowsy'; immunityTicks:number; ultimateId:string; bonusMultiplier:number }
  /** Sleep has no time limit; actual HP loss wakes the target. */
  | { kind:'sleep'; immunityTicks:number; ultimateId:string; bonusMultiplier:number }
  | { kind:'sleep-resist' }
  | { kind:'charm';steerTicks:number;acceleration:number }
  | { kind:'go-mark';basicId:string;ultimateId:string;bonusPerStack:number }
  | { kind:'crescent-mark';basicId:string;ultimateId:string;bonusPerStack:number;threshold:number;lowHealthMultiplier:number }
  | { kind: 'star-mark'; basicId: string; ultimateId: string; bonusPerStack: number }
  | { kind: 'skill-evasion'; once: boolean }
  | { kind: 'periodic-damage'; amount: number; intervalTicks: number; healingMultiplier?: number }
  | { kind: 'damage-modifier'; outgoing: number; incoming: number }
  | { kind: 'source-ability-vulnerability'; multiplier: number }
  | { kind: 'speed-modifier'; reductionPerStack: number; group?: string }
  | { kind: 'mark'; pull: PullDefinition }
  | { kind: 'collision-guard'; multiplier: number }
  | { kind: 'direct-guard'; multiplier: number }
  | { kind: 'ability-lock' }
  | { kind: 'freeze'; immunityTicks: number };
export interface StatusDefinition {
  /** Sleep ignores durationTicks and remains until actual HP loss. Other effects are timed. */
  id: string; name: string; durationTicks: number; effect: StatusEffect;
  /** One instance per target + status ID (marks also scope by source); refresh never resets tick cadence. */
  stacking: 'refresh' | 'stack'; maxStacks?: number; vfxClipId?: string; vfxColor?: string;
  sourceScoped?: boolean;
}
export interface PassiveProc { sourceId: string; targetId: string; pull: PullDefinition }
export interface SkillDodge { ownerId:string; attackerId:string; abilityId:string; tick:number }
export interface StatusState {
  targetId: string; sourceId: string; abilityId: string; definition: StatusDefinition;
  appliedTick: number; expiresTick: number; nextTick: number; stacks: number;
}
export interface LifestealDefinition { baseRatio: number; missingHPRatio: number; maxRatio: number; maxHPPerSecond: number }
export type PassiveDefinition = {
  aura?: { clipId: string; sizeScale: number; opacity: number };
  id: string; name: string; description: string;
} & ({ trigger: 'collision-received'; cooldownTicks: number; status: StatusDefinition } | { trigger: 'direct-damage'; lifesteal: LifestealDefinition; status?: never } | { trigger: 'basic-hit' | 'ability-hit'; status: StatusDefinition } | { trigger: 'field-contact'; status: StatusDefinition } | { trigger: 'dash-cross'; status: StatusDefinition } | { trigger: 'guard-block' | 'stance-cast' | 'hook-contact' | 'weapon-tip' | 'projectile-wall' | 'decoy-hit'; status?: never } | { trigger: 'summon-hit'; status?: never } | { trigger: 'summon-attachment'; status?: never } | { trigger: 'distance'; status?: never } | { trigger: 'physics'; knockbackMultiplier: number; status?: never });
