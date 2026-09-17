import type { CombatSnapshot } from './combat';
import type { EntityId } from './entity';
import type { Vec2 } from './geometry';
import type { AbilitySnapshot } from './abilities';
import type { BodyDefinition } from './physics';
import type { CharacterSnapshot } from './characters';
import type { ArenaDefinition } from './arenas';

export type { EntityId } from './entity';
export type { Vec2 } from './geometry';
export type { ArenaDefinition } from './arenas';
export type { BodyDefinition } from './physics';
export interface BodySnapshot extends BodyDefinition {
  /** Affiliation for target-only proxies, never added to character physics. */
  ownerId?: EntityId;
  id: EntityId;
  position: Vec2;
  previousPosition: Vec2;
  velocity: Vec2;
  speed: number;
}
export type WallSide = 'left' | 'right' | 'top' | 'bottom' | 'corner';
export interface PhysicsEvent {
  id: number;
  tick: number;
  type: 'wall' | 'contact' | 'obstacle';
  bodyId: EntityId;
  otherId?: EntityId;
  obstacleId?: string;
  wall?: WallSide;
  point: Vec2;
  normal: Vec2;
  impactSpeed: number;
  impulseApplied: boolean;
}
export interface WorldSnapshot {
  characters: CharacterSnapshot[];
  abilities: AbilitySnapshot | null;
  combat: CombatSnapshot | null;
  tick: number;
  time: number;
  seed: number;
  arena: ArenaDefinition;
  bodies: BodySnapshot[];
  events: PhysicsEvent[];
  wallCount: number;
  contactCount: number;
  obstacleCount: number;
  substeps: number;
  maxOverlap: number;
}
