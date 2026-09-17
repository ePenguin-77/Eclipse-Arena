import type { AbilityEvent, ZoneSnapshot } from '../contracts/abilities';
import type { DamageRequest } from '../contracts/combat';
import type { RadialForce } from '../contracts/forces';
import type { BodySnapshot } from '../contracts/types';
import { validateStatus } from '../combat/status-world';
import { zoneRadius } from './zone-radius';

/** A fixed warning disk. Only occupants at detonation take damage, once per cast. */
export class ZoneWorld {
  private zones: ZoneSnapshot[] = [];
  private nextId = 1;
  spawn(input: Omit<ZoneSnapshot, 'id'>) {
    if(input.collapseRadius!==undefined&&(!Number.isFinite(input.collapseRadius)||input.collapseRadius<30||input.collapseRadius>input.radius))throw new Error('Invalid domain radius');
    if (input.triggerUntilTick !== undefined && (!Number.isInteger(input.triggerUntilTick) || input.triggerUntilTick <= input.detonatesTick || input.triggerUntilTick - input.detonatesTick > 600)) throw new Error('Invalid trap window');
    if (input.fieldStatus) validateStatus(input.fieldStatus);
    if (!input.ownerId || !input.abilityId || ![input.position.x, input.position.y, input.radius, input.damage, input.pullAcceleration].every(Number.isFinite) ||
      input.radius <= 0 || input.damage <= 0 || input.pullAcceleration < 0 || input.pullAcceleration > 1800 ||
      !Number.isInteger(input.spawnedTick) || input.spawnedTick < 0 || !Number.isInteger(input.detonatesTick) || input.detonatesTick <= input.spawnedTick)
      throw new Error('Invalid zone instance');
    if (this.zones.length >= 32) return false;
    this.zones.push({ ...structuredClone(input), id: `zone-${this.nextId++}` });
    return true;
  }
  forces(tick: number): RadialForce[] {
    return this.zones.filter(z => z.spawnedTick < tick && tick < z.detonatesTick && z.pullAcceleration > 0)
      .map(z => ({ ownerId: z.ownerId, position: { ...z.position }, radius: zoneRadius(z,tick), acceleration: z.pullAcceleration }));
  }
  fieldApplications(tick: number, bodies: readonly BodySnapshot[]) {
    return this.zones.flatMap(z => !z.fieldStatus || tick <= z.spawnedTick || tick >= z.detonatesTick || !bodies.some(b => b.id === z.ownerId) ? [] :
      bodies.filter(b => b.id !== z.ownerId && b.ownerId !== z.ownerId && Math.hypot(b.position.x - z.position.x, b.position.y - z.position.y) <= z.radius + b.radius)
        .map(b => ({ sourceId: z.ownerId, targetId: b.id, abilityId: z.abilityId, definition: z.fieldStatus! })));
  }
  step(tick: number, bodies: readonly BodySnapshot[], emit: (event: Omit<AbilityEvent, 'id'>) => void): DamageRequest[] {
    const requests: DamageRequest[] = [];
    this.zones = this.zones.filter(z => {
      if (!bodies.some(b => b.id === z.ownerId)) return false;
      if (z.triggerUntilTick !== undefined && tick >= z.triggerUntilTick) {
        emit({ tick, ownerId: z.ownerId, abilityId: z.abilityId, kind: 'expired', point: { ...z.position }, reason: 'trap-expired' });
        return false;
      }
      if (tick < z.detonatesTick) return true;
      if (z.triggerUntilTick !== undefined && !bodies.some(b => b.id !== z.ownerId && b.ownerId !== z.ownerId && Math.hypot(b.position.x - z.position.x, b.position.y - z.position.y) <= z.radius + b.radius)) return true;
      emit({ tick, ownerId: z.ownerId, abilityId: z.abilityId, kind: 'detonate', point: { ...z.position } });
      for (const body of bodies) {
        if (body.id === z.ownerId || body.ownerId === z.ownerId || Math.hypot(body.position.x - z.position.x, body.position.y - z.position.y) > zoneRadius(z,tick) + body.radius) continue;
        requests.push({ tick, targetId: body.id, amount: z.damage,
          source: { kind: 'area', attackerId: z.ownerId, abilityId: z.abilityId, areaId: z.id } });
        emit({ tick, ownerId: z.ownerId, abilityId: z.abilityId, targetId: body.id, kind: 'hit', point: { ...body.position } });
      }
      return false;
    });
    return requests;
  }
  removeOwners(living: ReadonlySet<string>) { this.zones = this.zones.filter(z => living.has(z.ownerId)); }
  clear() { this.zones = []; }
  snapshot() { return structuredClone(this.zones); }
}
