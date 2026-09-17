import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import type { AbilityRange } from '../contracts/abilities';
import { ABILITY_RANGE_GAP } from '../config/ability-ranges';

export const surfaceGap = (a: BodySnapshot, b: BodySnapshot) => Math.max(0,
  Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) - a.radius - b.radius);

export function inAbilityRange(owner: BodySnapshot, target: BodySnapshot, range: AbilityRange) {
  return range !== 0 && owner.id !== target.id && target.ownerId !== owner.id && surfaceGap(owner, target) <= ABILITY_RANGE_GAP[range];
}

/** Tier 0 deliberately cannot activate from proximity alone. */
export function abilityTarget(owner: BodySnapshot, bodies: readonly BodySnapshot[], range: AbilityRange) {
  return bodies.filter(b => inAbilityRange(owner, b, range)).sort((a, b) =>
    surfaceGap(owner, a) - surfaceGap(owner, b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
}

/** Center-to-center distance; stable entity-ID tie break, no random consumption. */
export function nearestTarget(owner: BodySnapshot, bodies: readonly BodySnapshot[], range: number): BodySnapshot | undefined {
  return bodies.filter(b => b.id !== owner.id && Math.hypot(b.position.x - owner.position.x, b.position.y - owner.position.y) <= range)
    .sort((a, b) => {
      const distance = (p: BodySnapshot) => Math.hypot(p.position.x - owner.position.x, p.position.y - owner.position.y);
      return distance(a) - distance(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    })[0];
}

/** Lead current movement, bounded by the arena. Future reflections/impacts are not predicted. */
export function projectileAim(owner: BodySnapshot, target: BodySnapshot, arena: ArenaDefinition,
  speed: number, projectileRadius: number, lifetimeSeconds: number, maxLeadSeconds = 1.2): Vec2 {
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
  const position = (time: number) => ({
    x: clamp(target.position.x + target.velocity.x * Math.min(time, maxLeadSeconds), target.radius, arena.width - target.radius),
    y: clamp(target.position.y + target.velocity.y * Math.min(time, maxLeadSeconds), target.radius, arena.height - target.radius),
  });
  const muzzle = owner.radius + projectileRadius + 1;
  const gap = (time: number) => { const p = position(time); return Math.hypot(p.x - owner.position.x, p.y - owner.position.y) - muzzle - speed * time; };
  // Scan in fixed intervals then bisect the first intercept. No frame-time or RNG dependency.
  const horizon = Math.min(lifetimeSeconds, 1.2);
  let aim = target.position, previous = 0;
  for (let i = 1; i <= 72; i++) {
    const end = horizon * i / 72;
    if (gap(end) <= 0) {
      let low = previous, high = end;
      for (let j = 0; j < 14; j++) { const middle = (low + high) / 2; if (gap(middle) > 0) low = middle; else high = middle; }
      aim = position(high); break;
    }
    previous = end;
  }
  const dx = aim.x - owner.position.x, dy = aim.y - owner.position.y, distance = Math.hypot(dx, dy);
  return distance > 1e-8 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };
}
