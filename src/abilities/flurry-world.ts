import type { AbilityEffect, AbilityEvent, FlurrySnapshot } from '../contracts/abilities';
import type { BodySnapshot } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';

type FlurryEffect = Extract<AbilityEffect, { kind: 'flurry' }>;
export function validateFlurry(e: FlurryEffect) {
  if (!Number.isFinite(e.radius) || e.radius <= 0 || e.radius > 600 ||
    !Number.isInteger(e.hits) || e.hits < 2 || e.hits > 12 ||
    !Number.isInteger(e.intervalTicks) || e.intervalTicks < 4 || e.intervalTicks > 60 ||
    !Number.isInteger(e.delayTicks) || e.delayTicks < 1 || e.delayTicks > 120 ||
    !Number.isFinite(e.finisherWeight) || e.finisherWeight < 1 || e.finisherWeight > 5) throw new Error('Invalid flurry');
}
/** Timed hit volumes fixed at release. Animation frames never deliver damage. */
export class FlurryWorld {
  private active: (FlurrySnapshot & { effect: FlurryEffect; damage: number })[] = [];
  private nextId = 1;
  hasOwner(id: string) { return this.active.some(f => f.ownerId === id); }
  spawn(tick: number, ownerId: string, abilityId: string, target: BodySnapshot, effect: FlurryEffect, multiplier: number) {
    if (this.active.length >= 8 || this.hasOwner(ownerId)) return false;
    this.active.push({ id: `flurry-${this.nextId++}`, ownerId, abilityId, position: { ...target.position }, radius: effect.radius,
      spawnedTick: tick, endsTick: tick + effect.delayTicks + (effect.hits - 1) * effect.intervalTicks,
      nextTick: tick + effect.delayTicks, hitIndex: 0, hits: effect.hits, effect: { ...effect }, damage: effect.damage * multiplier });
    return true;
  }
  step(tick: number, bodies: readonly BodySnapshot[], emit: (event: Omit<AbilityEvent, 'id'>) => void): DamageRequest[] {
    const requests: DamageRequest[] = [];
    for (const f of this.active) {
      if (!bodies.some(b => b.id === f.ownerId) || tick < f.nextTick) continue;
      const last = f.hitIndex === f.hits - 1;
      const amount = f.damage * (last ? f.effect.finisherWeight : 1) / (f.hits - 1 + f.effect.finisherWeight);
      emit({ tick, ownerId: f.ownerId, abilityId: f.abilityId, kind: last ? 'finisher' : 'slash', point: f.position, reason: String(f.hitIndex) });
      for (const target of bodies) {
        if (target.id === f.ownerId || Math.hypot(target.position.x - f.position.x, target.position.y - f.position.y) > f.radius + target.radius) continue;
        requests.push({ tick, targetId: target.id, source: { kind: 'melee', attackerId: f.ownerId, abilityId: f.abilityId }, amount });
        emit({ tick, ownerId: f.ownerId, abilityId: f.abilityId, targetId: target.id, kind: 'hit', point: target.position });
      }
      f.hitIndex++; f.nextTick += f.effect.intervalTicks;
    }
    this.active = this.active.filter(f => f.hitIndex < f.hits && bodies.some(b => b.id === f.ownerId));
    return requests;
  }
  cleanup(living: ReadonlySet<string>, finished: boolean) { this.active = this.active.filter(f => !finished && living.has(f.ownerId)); }
  snapshot(): FlurrySnapshot[] { return this.active.map(({ effect: _effect, damage: _damage, ...f }) => structuredClone(f)); }
}
