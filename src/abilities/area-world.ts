import type { AreaSnapshot, AbilityEvent } from '../contracts/abilities';
import type { DamageRequest } from '../contracts/combat';
import type { BodySnapshot, Vec2 } from '../contracts/types';

interface Area extends AreaSnapshot { hitIds: Set<string> }
/** Swept circle against a disk expanding linearly during this tick. */
function intersects(from: Vec2, to: Vec2, center: Vec2, startRadius: number, endRadius: number) {
  const x = from.x - center.x, y = from.y - center.y, dx = to.x - from.x, dy = to.y - from.y;
  const dr = endRadius - startRadius;
  const a = dx * dx + dy * dy - dr * dr;
  const b = 2 * (x * dx + y * dy - startRadius * dr), c = x * x + y * y - startRadius * startRadius;
  const at = (t: number) => a * t * t + b * t + c;
  return Math.min(c, at(1), a > 0 ? at(Math.max(0, Math.min(1, -b / (2 * a)))) : Infinity) <= 1e-8;
}
export class AreaWorld {
  private areas: Area[] = [];
  private nextId = 1;
  spawn(input: Omit<AreaSnapshot, 'id' | 'radius'>) {
    if (!input.ownerId || !input.abilityId || ![input.position.x, input.position.y, input.maxRadius, input.damage].every(Number.isFinite) ||
      input.maxRadius <= 0 || input.damage <= 0 || !Number.isInteger(input.spawnedTick) || input.spawnedTick < 0 ||
      !Number.isInteger(input.expiresTick) || input.expiresTick <= input.spawnedTick) throw new Error('Invalid area instance');
    if (this.areas.length >= 32) return false;
    this.areas.push({ ...structuredClone(input), id: `area-${this.nextId++}`, radius: 0, hitIds: new Set() });
    return true;
  }
  step(tick: number, bodies: readonly BodySnapshot[], emit: (event: Omit<AbilityEvent, 'id'>) => void): DamageRequest[] {
    this.areas = this.areas.filter(a => tick <= a.expiresTick && bodies.some(b => b.id === a.ownerId));
    const requests: DamageRequest[] = [];
    for (const area of this.areas) {
      const previous = area.radius;
      area.radius = area.maxRadius * Math.min(1, (tick - area.spawnedTick) / (area.expiresTick - area.spawnedTick));
      for (const body of bodies) {
        if (body.id === area.ownerId || body.ownerId === area.ownerId || area.hitIds.has(body.id)) continue;
        const from = tick === area.spawnedTick ? body.position : body.previousPosition;
        if (!intersects(from, body.position, area.position, previous + body.radius, area.radius + body.radius)) continue;
        area.hitIds.add(body.id);
        requests.push({ tick, targetId: body.id, amount: area.damage,
          source: { kind: 'area', attackerId: area.ownerId, abilityId: area.abilityId, areaId: area.id } });
        emit({ tick, ownerId: area.ownerId, abilityId: area.abilityId, targetId: body.id, kind: 'hit', point: body.position });
      }
    }
    return requests;
  }
  removeOwners(living: ReadonlySet<string>) { this.areas = this.areas.filter(a => living.has(a.ownerId)); }
  clear() { this.areas = []; }
  snapshot(): AreaSnapshot[] { return this.areas.map(({ hitIds: _hitIds, ...a }) => structuredClone(a)); }
}
