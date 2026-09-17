import type { AbilityEvent, DecoySnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import { clearOfArena } from '../arenas/arena-registry';
import { sweepCircle } from '../math/sweep-circle';

type Emit = (event: Omit<AbilityEvent, 'id'>) => void;
/** Target-only illusions. They never enter the combat HP roster or physics solver. */
export class DecoyWorld {
  private decoys: DecoySnapshot[] = [];
  private nextId = 1;
  hasOwner(id: string) { return this.decoys.some(d => d.ownerId === id); }
  spawn(tick: number, owner: BodySnapshot, abilityId: string, lifetime: number, swapDelay: number,
    distance: number, arena: ArenaDefinition, bodies: readonly BodySnapshot[]) {
    if (this.hasOwner(owner.id) || this.decoys.length >= 8) return null;
    const enemy = bodies.filter(b => b.id !== owner.id && b.ownerId !== owner.id)
      .sort((a,b) => Math.hypot(a.position.x-owner.position.x,a.position.y-owner.position.y)-Math.hypot(b.position.x-owner.position.x,b.position.y-owner.position.y))[0];
    const base = enemy ? Math.atan2(enemy.position.y-owner.position.y,enemy.position.x-owner.position.x) : Math.atan2(owner.velocity.y, owner.velocity.x);
    // Try a finite deterministic set, keeping the real body's full radius clear.
    const position = [0, Math.PI / 2, -Math.PI / 2, Math.PI].map(offset => ({
      x: owner.position.x + Math.cos(base + offset) * distance,
      y: owner.position.y + Math.sin(base + offset) * distance,
    })).find(p => clearOfArena(arena, p, owner.radius) && bodies.every(b => Math.hypot(b.position.x-p.x,b.position.y-p.y) > b.radius+owner.radius+2));
    if (!position) return null;
    const decoy: DecoySnapshot = { id: `decoy-${this.nextId++}`, ownerId: owner.id, abilityId,
      position, radius: owner.radius, spawnedTick: tick, expiresTick: tick + lifetime,
      swapTick: tick + swapDelay, swapped: false };
    this.decoys.push(decoy);
    return structuredClone(decoy);
  }
  prepare(tick: number, bodies: readonly BodySnapshot[], locked: ReadonlySet<string>,
    teleport: (id: string, point: Vec2) => boolean, emit: Emit) {
    this.decoys = this.decoys.filter(d => {
      const owner = bodies.find(b => b.id === d.ownerId);
      if (!owner || tick >= d.expiresTick) {
        emit({ tick, ownerId: d.ownerId, abilityId: d.abilityId, kind: 'expired', point: d.position, reason: 'decoy-expired' });
        return false;
      }
      if (!d.swapped && tick >= d.swapTick) {
        d.swapped = true;
        const destination = { ...d.position };
        if (!locked.has(owner.id) && teleport(owner.id, destination)) {
          d.position = { ...owner.position };
          emit({ tick, ownerId: owner.id, abilityId: d.abilityId, kind: 'decoy-swap', point: destination, end: d.position });
        } else emit({ tick, ownerId: owner.id, abilityId: d.abilityId, kind: 'miss', point: owner.position, reason: 'swap-blocked' });
      }
      return true;
    });
  }
  break(id: string, attackerId: string, tick: number, emit: Emit) {
    const d = this.decoys.find(d => d.id === id);
    if (!d || d.ownerId === attackerId || tick >= d.expiresTick) return null;
    this.decoys = this.decoys.filter(other => other.id !== id);
    emit({tick,ownerId:d.ownerId,abilityId:d.abilityId,targetId:attackerId,kind:'decoy-break',point:d.position});
    return d.ownerId;
  }
  contacts(tick: number, bodies: readonly BodySnapshot[], emit: Emit): string[] {
    const charged: string[] = [];
    for (const d of [...this.decoys]) for (const b of bodies) {
      if (b.id === d.ownerId || b.ownerId === d.ownerId) continue;
      if (sweepCircle({x:b.previousPosition.x-d.position.x,y:b.previousPosition.y-d.position.y},
        {x:b.position.x-d.position.x,y:b.position.y-d.position.y}, b.radius+d.radius) === null) continue;
      const owner = this.break(d.id,b.id,tick,emit);
      if (owner) charged.push(owner);
      break;
    }
    return charged;
  }
  targets(): BodySnapshot[] {
    return this.decoys.map(d => ({ id:d.id,ownerId:d.ownerId,position:{...d.position},previousPosition:{...d.position},
      radius:d.radius,velocity:{x:0,y:0},speed:0,mass:1,targetSpeed:0,minSpeed:0,maxSpeed:0,restitution:0 }));
  }
  cleanup(living: ReadonlySet<string>, finished: boolean) { this.decoys = this.decoys.filter(d => !finished && living.has(d.ownerId)); }
  snapshot() { return structuredClone(this.decoys); }
}
