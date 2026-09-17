import type { Vec2 } from './geometry';

/** Clockwise wind turns moving bodies/projectiles without changing their speed. */
export interface VortexField {position:Vec2;radius:number;eyeRadius:number;turnRate:number}

/** Simulation-space force, independent of artwork and ability IDs. */
export interface RadialForce {
  ownerId: string; targetId?: string; position: Vec2; radius: number; acceleration: number;
}
export interface PullDefinition { radius: number; acceleration: number; durationTicks: number }
export interface KnockbackDefinition { strength: number; wallSlam?: { damage: number; windowTicks: number } }
export interface KnockbackRequest { ownerId: string; targetId: string; direction: Vec2; strength: number; selfRebound?: true }
export function validateKnockback(d: KnockbackDefinition) {
  if (!Number.isFinite(d.strength) || d.strength <= 0 || d.strength > 1200 || (d.wallSlam &&
    (!Number.isFinite(d.wallSlam.damage) || d.wallSlam.damage <= 0 || !Number.isInteger(d.wallSlam.windowTicks) || d.wallSlam.windowTicks < 1 || d.wallSlam.windowTicks > 120))) throw new Error('Invalid knockback');
}

export function validatePull(p: PullDefinition) {
  if (!Number.isFinite(p.radius) || p.radius <= 0 || !Number.isFinite(p.acceleration) || p.acceleration <= 0 || p.acceleration > 1800 ||
    !Number.isInteger(p.durationTicks) || p.durationTicks < 1 || p.durationTicks > 600) throw new Error('Invalid pull definition');
}
