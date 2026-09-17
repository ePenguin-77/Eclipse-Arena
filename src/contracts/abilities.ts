import type { EntityId } from './entity';
import type { Vec2 } from './geometry';
import type { SummonDefinition, SummonEmpowerment, SummonSnapshot } from './summons';
import type { KnockbackDefinition } from './forces';
import type { StatusDefinition } from './status';

export type ChargeTrigger = 'wall-impact' | 'character-impact' | 'time' | 'basic-hit' | 'basic-cast' | 'passive-proc' | 'wall-slam' | 'charged-basic-hit' | 'enemy-damage';
export interface ChargeRule { trigger: ChargeTrigger; amount: number; intervalTicks: number }
export interface GatesSnapshot {ownerId:string;count:number;activeGates:number;phase:'idle'|'approach'|'combo';ultimate:boolean;hitIndex:number;hits:number}
export type MaskFace = 'wrath' | 'sorrow' | 'smile';
export interface MasksSnapshot {ownerId:string;face:MaskFace;charge:number;remaining:MaskFace[];phase:'idle'|'windup'|'dash'|'guard';guardHits:number}
export interface UltimateDefinition { maxCharge: number; rules: ChargeRule[]; windupTicks: number; armedTicks: number; resource?: 'attached-summons' | 'status-stacks' | 'ink-strokes'; statusId?: string; activation?: 'impact'; counterLabel?: string }
export interface ContactDefense { collisionMultiplier: number; knockbackMultiplier: number; wallSlamMultiplier?: number }
export interface ProjectileReflection { remaining: number; damageMultiplier: number }
export interface ReboundStrike { strength: number; delayTicks: number; radius: number; maxHitsPerTarget: number }

export type AbilityEffect = { kind: 'melee'; damage: number } | { kind: 'status-burst'; damage: number } | { kind: 'dash'; damage: number; speed: number; durationTicks: number }
  | {kind:'gates-punch'|'gates-combo';damage:number}
  | {kind:'masks-shift'|'masks-awaken';damage:number}
  | {kind:'automaton-command';damage:number;maxHP:number;speed:number;refillRadius:number}
  | {kind:'automaton-awaken';damage:number;durationTicks:number;speed:number;radius:number;intervalTicks:number}
  | {kind:'retrace-follow';damage:number;delayTicks:number;recordTicks:number;radius:number}
  | {kind:'retrace-return';damage:number;historyTicks:number;warningTicks:number;intervalTicks:number;durationTicks:number;radius:number}
  | {kind:'thorn-plant';damage:number;halfWidth:number;armTicks:number;lifetimeTicks:number}
  | {kind:'thorn-garden';damage:number;halfWidth:number;durationTicks:number;cooldownTicks:number}
  | {kind:'wind-fan';damage:number;radius:number;arcDegrees:number;activeTicks:number;push:number}
  | {kind:'wind-storm';damage:number;radius:number;eyeRadius:number;durationTicks:number;intervalTicks:number;turnRate:number}
  | {kind:'cannon-shot';damage:number;speed:number;blastRadius:number;recoil:number}
  | {kind:'cannon-salvo';damage:number;speed:number;blastRadius:number;recoil:number;intervalTicks:number;finalDamage:number;finalRadius:number}
  | {kind:'crystal-lance';damage:number;speed:number;splitMultiplier:number}
  | {kind:'crystal-array';damage:number;lineDamage:number;radius:number;intervalTicks:number;lineWidth:number}
  | {kind:'dream-wave';damage:number;radius:number;growthTicks:number;delayTicks:number;speed:number}
  | {kind:'feather-shot';damage:number;speed:number}
  | {kind:'feather-recall';damage:number;speed:number;intervalTicks:number}
  | { kind:'lantern';damage:number;receiveTicks:number;reduction:number;counterMultiplier:number }
  | { kind:'soul-release';damage:number;intervalTicks:number;speed:number;guideTicks:number;lifetimeTicks:number }
  | { kind:'time-rewind'; damage:number; durationTicks:number; radius:number; healRatio:number; healCap:number }
  | { kind:'portal';damage:number;durationTicks:number;bodyUses:number;projectileUses:number;shots:number }
  | { kind:'beam'; damage:number; width:number; chargeTicks:number; recoveryTicks:number; aimLockTicks:number }
  | { kind:'script-return';damage:number }
  | { kind:'fox-hunt';damage:number;speed:number;radius:number;dashTicks:number;pauseTicks:number;emberDamage:number;emberRadius:number;emberDelay:number;charmBonus:number }
  | { kind:'bell'; damage:number; radius:number; growthTicks:number; pulses:number; intervalTicks:number; reduction:number; guardTicks:number; bonusRadiusPerStack:number }
  | { kind:'go-stone'; damage:number; speed:number; lifetimeTicks:number; lineDamage:number; lineWidth:number; lineCooldownTicks:number }
  | { kind:'go-board'; damage:number; radius:number; lineDamage:number; lineWidth:number; intervalTicks:number }
  | { kind:'sweep'; damage:number; radius:number; arcDegrees:number; activeTicks:number; tipStart:number; tipMultiplier:number; dash?:{speed:number;durationTicks:number} }
  | { kind: 'returning-weapon'; damage: number; reach: number; radius: number; outboundTicks: number; returnSpeed: number; lifetimeTicks: number; curve: number; heldReduction: number }
  | { kind: 'guard-burst'; damage: number; durationTicks: number; reduction: number; bonusCap: number; radius: number }
  | { kind: 'hook'; damage: number; speed: number; radius: number; lifetimeTicks: number; angles: number[];
      pullTicks: number; acceleration: number; contactDamage: number; distanceBonus: number;
      constriction?: { intervalTicks:number; pulseDamage:number; finisherDamage:number } }
  | { kind: 'thrust'; damage: number; length: number; radius: number; tipStart: number; tipMultiplier: number; activeTicks?: number;
      lunge?: { speed: number; durationTicks: number; burstDamage: number; burstRadius: number } }
  | { kind: 'impact-form'; damage: number; speedMultiplier: number; durationTicks: number; hits: number; pairCooldownTicks: number; endCondition?: 'duration'; strikeCooldownTicks?: number; strikeRange?: 0 | 1 | 2; defense?: ContactDefense; lifestealBonus?: number; formName?: string; rebound?: ReboundStrike }
  | { kind: 'flurry'; damage: number; radius: number; hits: number; intervalTicks: number; delayTicks: number; finisherWeight: number } | {
  kind: 'projectile'; damage: number; speed: number; radius: number; lifetimeTicks: number;
  timeMark?: { durationTicks:number; ratio:number; cap:number };
  fateThread?: { mode:'mark'|'tether'; durationTicks:number; bonusDamage:number; jerkDamage?:number; maxJerks?:number; jerkIntervalTicks?:number; strength?:number; slack?:number };
  /** Optional release-time interception; projectile stays straight after release. */
  aiming?: 'predictive';
  maxLeadSeconds?: number;
  pierce?: number;
  retreat?: { range: number; strength: number; cooldownTicks: number };
  volley?: { count: number; spreadDegrees: number };
  reflection?: ProjectileReflection;
} | {
  kind: 'projectile-sequence'; damage: number; speed: number; radius: number; lifetimeTicks: number;
  angles: number[]; intervalTicks: number; finisherMultiplier: number; finisherRadius: number;
  finisherReflection?: ProjectileReflection;
  finisherLifetimeTicks?: number;
  reflection?: ProjectileReflection;
} | { kind: 'area'; damage: number; radius: number; durationTicks: number }
  | { kind: 'zone'; damage: number; radius: number; delayTicks: number; aimLeadSeconds: number; placementOrbitRadius?: number; pullAcceleration?: number;
      placement?: 'caster'; triggerWindowTicks?: number; fieldStatus?: StatusDefinition; collapseRadius?: number }
  | { kind: 'decoy'; damage: number; lifetimeTicks: number; swapDelayTicks: number; distance: number }
  | { kind: 'ink-stroke'; damage: number; length: number; radius: number; lifetimeTicks: number; fieldStatus: StatusDefinition }
  | { kind: 'ink-dragons'; damage: number; speed: number; radius: number; lifetimeTicks: number }
  | { kind: 'summon'; damage: number; summon: SummonDefinition; empowerment?: SummonEmpowerment; detonation?: boolean };
export type AbilityRange = 0 | 1 | 2 | 3 | 4 | 5;
export interface BasicChargeDefinition {
  name: string; maxStacks: number; intervalTicks: number; damagePerStack: number;
  /** Power spends all accumulated damage stacks; recharge spends one use and refills sequentially. */
  mode?: 'power' | 'recharge' | 'distance';
  distancePerStack?: number;
  speedPerStack?: number;
  afterHitBoost?: { multiplier: number; durationTicks: number };
  /** Full stored power protects the spending contact, then a successful hit's escape window. */
  defense?: ContactDefense;
}
export interface AbilityContact {
  bodyId: EntityId; otherId: EntityId; point: Vec2; impulseApplied: boolean; impactSpeed: number;
}
export interface AbilityDefinition {
  /** Range is a tier, not a distance. Tier 0 is an immediate physical-impact trigger. */
  id: string; name: string; range: AbilityRange; castTicks: number; cooldownTicks: number; effect: AbilityEffect;
  /** Optional presentation label for small HUD gauges; never used by combat. */
  shortName?: string;
  description?: string;
  /** A nonlethal HP cost, paid once per tick only after this ability actually deals damage. */
  healthCostOnHit?: number;
  onHitStatus?: StatusDefinition;
  selfStatus?: StatusDefinition;
  ultimate?: UltimateDefinition;
  /** Presentation describes the resource, independently of how simulation awards it. */
  ultimatePresentation?: { kind: 'energy' | 'count'; label?: string; statusCounter?: { statusId: string; maximum: number } };
  basicCharge?: BasicChargeDefinition;
  knockback?: KnockbackDefinition;
}
export interface AbilitySetup {
  definitions: AbilityDefinition[];
  loadouts: { ownerId: EntityId; abilityIds: string[]; slots?: { basic: string; ultimate: string | null } }[];
  autoCast: boolean;
  maxProjectiles: number;
}
export interface ProjectileSnapshot {
  maskStrike?: {face:MaskFace;empowered:boolean};
  prismSeed?:boolean;
  seeking?: { targetId:string;endsTick:number;turnRate:number };
  portalHops?:number;
  visualAbilityId?:string;
  pierce?: number;
  hitTargets?: string[];
  reflection?: ProjectileReflection;
  visualScale?: number;
  hitGroup?: string;
  id: string; ownerId: EntityId; abilityId: string; position: Vec2; previousPosition: Vec2; velocity: Vec2;
  radius: number; damage: number; spawnedTick: number; expiresTick: number;
}
export interface AreaSnapshot {
  id: string; ownerId: EntityId; abilityId: string; position: Vec2;
  radius: number; maxRadius: number; damage: number; spawnedTick: number; expiresTick: number;
}
export interface ZoneSnapshot {
  collapseRadius?: number;
  /** Optional armed proximity window; otherwise the zone detonates at its scheduled tick. */
  triggerUntilTick?: number;
  fieldStatus?: StatusDefinition;
  id: string; ownerId: string; abilityId: string; position: Vec2; radius: number;
  damage: number; spawnedTick: number; detonatesTick: number; pullAcceleration: number;
}
export interface AbilityEvent {
  projectileId?:string;
  id: number; tick: number; ownerId: EntityId; abilityId: string; targetId?: EntityId;
  kind: 'dodge' | 'thrust' | 'lunge-burst' | 'decoy-spawn' | 'decoy-swap' | 'decoy-break' | 'cast' | 'melee' | 'slash' | 'finisher' | 'projectile' | 'area' | 'detonate' | 'summon' | 'summon-pulse' | 'hit' | 'miss' | 'cancelled' | 'rejected' | 'wall' | 'obstacle' | 'expired';
  point: Vec2; end?: Vec2; reason?: string;
}
export interface AbilityRuntimeSnapshot {
  recordedAbilityId?:string;recordedMode?:ScribeMode;
  ownerId: EntityId; abilityId: string; status: 'ready' | 'casting' | 'cooldown' | 'defeated' | 'charging' | 'empowered' | 'active';
  cooldownRemaining: number; castRemaining: number; casts: number; queued: boolean;
  charge?: number; maxCharge?: number; armedRemaining?: number;
  basicStacks?: number; basicMaxStacks?: number; basicRechargeProgress?: number;
  activeHitsRemaining?: number; activeTicksRemaining?: number;
}
export interface DecoySnapshot {
  id: string; ownerId: string; abilityId: string; position: Vec2; radius: number;
  spawnedTick: number; expiresTick: number; swapTick: number; swapped: boolean;
}
export interface AutomatonSnapshot {
 id:string;ownerId:string;abilityId:string;position:Vec2;previousPosition:Vec2;velocity:Vec2;radius:number;
 hp:number;maxHP:number;mode:'turret'|'warrior';angle:number;spawnedTick:number;transformedTick:number;warriorUntil:number;
 charged:boolean;chargeTick:number;shotTick:number;shotBoosted:boolean;
 swing?:{origin:Vec2;angle:number;startedTick:number;hitTick:number;endsTick:number};
}
export interface RetracePoint { x:number; y:number; connected:boolean }
export interface RetraceSwordSnapshot {
  id:string;ownerId:string;abilityId:string;ultimate:boolean;startedTick:number;launchTick:number;endsTick:number;
  position:Vec2;previousPosition:Vec2;angle:number;path:RetracePoint[];cursor:number;radius:number;
}
export interface ThornTrapSnapshot {
  id:string;ownerId:string;abilityId:string;position:Vec2;origin:Vec2;
  side:'left'|'right'|'top'|'bottom';plantedTick:number;armedTick:number;expiresTick:number;
  halfWidth:number;flashTick:number;empowered?:boolean;
}
export interface AbilitySnapshot {
  masks?: MasksSnapshot[];
  maskMarks?: {ownerId:string;targetId:string;expiresTick:number}[];
  gates?: GatesSnapshot[];
  automatons?:AutomatonSnapshot[];
  retraceSwords?:RetraceSwordSnapshot[];
  thornTraps?:ThornTrapSnapshot[];
  thornGardens?:{ownerId:string;endsTick:number}[];
  windStorms?:{id:string;ownerId:string;abilityId:string;position:Vec2;radius:number;eyeRadius:number;startedTick:number;endsTick:number}[];
  crystalPrisms?: {id:string;ownerId:string;position:Vec2;startedTick:number;flashTick:number}[];
  crystalArrays?: {id:string;ownerId:string;points:Vec2[];center:Vec2;startedTick:number;endsTick:number}[];
  crystalLines?: GoLineSnapshot[];
  dreamWaves?: {ownerId:string;abilityId:string;position:Vec2;radius:number;startedTick:number;endsTick:number}[];
  lanterns?: LanternSnapshot[];
  featherPins?: FeatherPin[];
  featherRecalls?: FeatherRecall[];
  soulReleases?: SoulReleaseSnapshot[];
  soulFuel?: {ownerId:string;amount:number}[];
  timeMarks?: TimeMarkSnapshot[];
  timeRewinds?: TimeRewindSnapshot[];
  timeEchoes?: TimeEchoSnapshot[];
  portals?:PortalPairSnapshot[];
  threadMarks?: ThreadMarkSnapshot[];
  fateThreads?: FateThreadSnapshot[];
  scribeMemories?:ScribeMemorySnapshot[];scribeCasts?:ScribeCastSnapshot[];scribeStrikes?:ScribeStrikeSnapshot[];
  foxHunts?:FoxHuntSnapshot[];
  foxEmbers?:FoxEmberSnapshot[];
  bellWaves?:BellWaveSnapshot[];
  bellForms?:BellFormSnapshot[];
  beams?: BeamSnapshot[];
  goStones?: GoStoneSnapshot[];
  goLines?: GoLineSnapshot[];
  returningWeapons?: ReturningWeaponSnapshot[];
  guards?: GuardSnapshot[];
  chains?: ChainSnapshot[];
  inkStrokes?: InkStrokeSnapshot[];
  decoys?: DecoySnapshot[];
  flurries?: FlurrySnapshot[];
  summons?: SummonSnapshot[];
  definitions: AbilityDefinition[]; runtimes: AbilityRuntimeSnapshot[];
  projectiles: ProjectileSnapshot[]; areas?: AreaSnapshot[]; zones?: ZoneSnapshot[]; events: AbilityEvent[]; autoCast: boolean;
}
export interface BellWaveSnapshot { id:string;ownerId:string;abilityId:string;position:Vec2;radius:number;maxRadius:number;startedTick:number;endsTick:number;ultimate:boolean;final:boolean }
export interface ThreadMarkSnapshot {ownerId:string;targetId:string;abilityId:string;startedTick:number;endsTick:number}
export interface FateThreadSnapshot {id:string;ownerId:string;targetId:string;abilityId:string;anchor:Vec2;length:number;startedTick:number;endsTick:number;jerks:number;maxJerks:number;lastJerkTick:number;empowered:boolean}
export interface BellFormSnapshot { ownerId:string;abilityId:string;position:Vec2;startedTick:number;endsTick:number }
export interface BeamSnapshot { ownerId:string; abilityId:string; start:Vec2; end:Vec2; width:number; startedTick:number; releaseTick:number; endsTick:number; phase:'charge'|'fire'; ultimate:boolean }
export interface GoStoneSnapshot { id:string; ownerId:string; abilityId:string; position:Vec2; previousPosition:Vec2; color:0|1; flying:boolean; spawnedTick:number; expiresTick:number }
export interface GoLineSnapshot { id:string; ownerId:string; abilityId:string; start:Vec2; end:Vec2; width:number; startsTick:number; endsTick:number; ultimate:boolean }
export interface ReturningWeaponSnapshot {
  id: string; ownerId: string; abilityId: string; position: Vec2; previousPosition: Vec2;
  radius: number; spawnedTick: number; returning: boolean;
}
export interface GuardSnapshot {
  ownerId: string; abilityId: string; startedTick: number; endsTick: number; absorbed: number; bonusCap: number;
}
export interface ChainSnapshot {
  id: string; ownerId: string; targetId: string; abilityId: string;
  spawnedTick: number; expiresTick: number;
}
export interface InkStrokeSnapshot {
  id: string; ownerId: string; abilityId: string; position: Vec2; angle: number;
  length: number; radius: number; spawnedTick: number; expiresTick: number; fieldStatus: StatusDefinition;
}
export interface FlurrySnapshot {
  id: string; ownerId: string; abilityId: string; position: Vec2; radius: number;
  spawnedTick: number; endsTick: number; nextTick: number; hitIndex: number; hits: number;
}

export interface FoxHuntSnapshot {ownerId:string;targetId:string;abilityId:string;startedTick:number;endsTick:number;phase:number;dashUntil:number;position:Vec2;direction:Vec2}
export interface FoxEmberSnapshot {id:string;ownerId:string;abilityId:string;position:Vec2;radius:number;startedTick:number;detonatesTick:number;final:boolean}

export type ScribeMode='projectile'|'melee'|'field'|'beam'|'summon';
export interface ScribeMemorySnapshot {ownerId:string;sourceId:string;abilityId:string;mode:ScribeMode;recordedTick:number}
export interface ScribeCastSnapshot {ownerId:string;abilityId:string;recordedAbilityId?:string;mode:ScribeMode;position:Vec2;startedTick:number;endsTick:number}
export interface ScribeStrikeSnapshot {id:string;ownerId:string;abilityId:string;recordedAbilityId?:string;mode:ScribeMode;position:Vec2;end:Vec2;radius:number;startedTick:number;releasesTick:number;endsTick:number}

export interface PortalPairSnapshot {id:string;ownerId:string;abilityId:string;entry:Vec2;exit:Vec2;radius:number;ultimate:boolean;startedTick:number;endsTick:number;bodyUses:number;projectileUses:number;lastTransitTick:number}
export interface TimeMarkSnapshot { ownerId:string;targetId:string;abilityId:string;startedTick:number;endsTick:number;storedDamage:number }
export interface TimeRewindSnapshot { ownerId:string;abilityId:string;anchor:Vec2;startedTick:number;endsTick:number;receivedDamage:number;path:Vec2[] }
export interface TimeEchoSnapshot { ownerId:string;abilityId:string;point:Vec2;path:Vec2[];startedTick:number;endsTick:number;radius:number }
export interface LanternSnapshot {ownerId:string;abilityId:string;position:Vec2;previousPosition:Vec2;radius:number;startedTick:number;endsTick:number;received:boolean}
export interface FeatherPin {id:string;ownerId:string;abilityId:string;position:Vec2;angle:number;tick:number}
export interface FeatherRecall {ownerId:string;abilityId:string;pins:FeatherPin[];startedTick:number;endsTick:number;total:number}
export interface SoulReleaseSnapshot {ownerId:string;abilityId:string;position:Vec2;startedTick:number;endsTick:number;total:number;remaining:number}
