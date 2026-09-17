import type { AbilityDefinition, AbilityEvent, ThornTrapSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, PhysicsEvent, Vec2 } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';

type Emit = (event: Omit<AbilityEvent, 'id'>) => void;
type Side = ThornTrapSnapshot['side'];
type Trap = ThornTrapSnapshot & { damage: number };
type Garden = { ownerId: string; abilityId: string; endsTick: number; halfWidth: number; damage: number; cooldownTicks: number };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const vertical = (side: Side) => side === 'left' || side === 'right';
const coordinate = (point: Vec2, side: Side) => vertical(side) ? point.y : point.x;
export const thornPoint = (side: Side, at: number, arena: ArenaDefinition): Vec2 =>
  side === 'left' ? { x: 0, y: at } : side === 'right' ? { x: arena.width, y: at } : side === 'top' ? { x: at, y: 0 } : { x: at, y: arena.height };

/** Predict one real outer-wall rebound from current velocity, never a pillar. */
export function nextThornWall(target: BodySnapshot, arena: ArenaDefinition): { side: Side; at: number } {
  const { position: p, velocity: v, radius: r } = target;
  const candidates: { side: Side; time: number }[] = [];
  if (v.x < -.01) candidates.push({ side: 'left', time: (r - p.x) / v.x });
  if (v.x > .01) candidates.push({ side: 'right', time: (arena.width - r - p.x) / v.x });
  if (v.y < -.01) candidates.push({ side: 'top', time: (r - p.y) / v.y });
  if (v.y > .01) candidates.push({ side: 'bottom', time: (arena.height - r - p.y) / v.y });
  const hit = candidates.filter(c => c.time >= 0).sort((a, b) => a.time - b.time)[0];
  const side = hit?.side ?? ([['left', p.x], ['right', arena.width - p.x], ['top', p.y], ['bottom', arena.height - p.y]] as [Side, number][]).sort((a, b) => a[1] - b[1])[0]![0];
  const point = { x: p.x + v.x * (hit?.time ?? 0), y: p.y + v.y * (hit?.time ?? 0) };
  return { side, at: clamp(coordinate(point, side), 35, (vertical(side) ? arena.height : arena.width) - 35) };
}

export function validateThorn(d: AbilityDefinition) {
  const e = d.effect;
  if (e.kind !== 'thorn-plant' && e.kind !== 'thorn-garden') return;
  if (!Number.isFinite(e.damage) || e.damage <= 0 || e.damage > 60 || d.range === 0 || !Number.isFinite(e.halfWidth) || e.halfWidth < 30 || e.halfWidth > 170) throw Error('Invalid thorn geometry');
  if (e.kind === 'thorn-plant' && (d.ultimate || !Number.isInteger(e.armTicks) || e.armTicks < 18 || e.armTicks > 90 || !Number.isInteger(e.lifetimeTicks) || e.lifetimeTicks < 180 || e.lifetimeTicks > 1800)) throw Error('Invalid thorn trap');
  if (e.kind === 'thorn-garden' && (!d.ultimate || !Number.isInteger(e.durationTicks) || e.durationTicks < 60 || e.durationTicks > 480 || !Number.isInteger(e.cooldownTicks) || e.cooldownTicks < 36 || e.cooldownTicks > 120)) throw Error('Invalid thorn garden');
}

export class ThornWorld {
  private traps: Trap[] = [];
  private gardens: Garden[] = [];
  private hitReady = new Map<string, number>();
  private serial = 0;
  hasOwner(ownerId: string) { return this.gardens.some(g => g.ownerId === ownerId); }
  remaining(ownerId: string, tick: number) { return Math.max(0, ...this.gardens.filter(g => g.ownerId === ownerId).map(g => g.endsTick - tick)); }

  plant(tick: number, owner: BodySnapshot, target: BodySnapshot, definition: AbilityDefinition, multiplier: number, arena: ArenaDefinition, emit: Emit) {
    if (definition.effect.kind !== 'thorn-plant') return;
    const e = definition.effect, destination = nextThornWall(target, arena);
    const owned = this.traps.filter(t => t.ownerId === owner.id);
    if (owned.length >= 4) this.traps = this.traps.filter(t => t.id !== owned[0]!.id);
    const edgeLength = vertical(destination.side) ? arena.height : arena.width;
    // Spread new buds along the same wall instead of hiding multiple traps under one sprite.
    const candidates = [0, 130, -130, 260, -260].map(offset => clamp(destination.at + offset, 35, edgeLength - 35));
    destination.at = candidates.find(at => !this.traps.some(t => t.ownerId === owner.id && t.side === destination.side && Math.abs(coordinate(t.position, t.side) - at) < 110)) ?? destination.at;
    const position = thornPoint(destination.side, destination.at, arena);
    this.traps.push({ id: `thorn-${++this.serial}`, ownerId: owner.id, abilityId: definition.id, position, origin: { ...owner.position }, side: destination.side,
      plantedTick: tick, armedTick: tick + e.armTicks, expiresTick: tick + e.lifetimeTicks, halfWidth: e.halfWidth, flashTick: -1000, damage: e.damage * multiplier });
    emit({ tick, ownerId: owner.id, abilityId: definition.id, kind: 'area', point: position, reason: 'thorn-plant' });
  }

  startGarden(tick: number, owner: BodySnapshot, target: BodySnapshot | undefined, definition: AbilityDefinition, basic: AbilityDefinition, multiplier: number, arena: ArenaDefinition, emit: Emit) {
    if (definition.effect.kind !== 'thorn-garden' || this.hasOwner(owner.id)) return false;
    const e = definition.effect;
    // A spent set of traps must not waste a fully charged ultimate.
    if (!this.traps.some(t => t.ownerId === owner.id) && target) {
      this.plant(tick, owner, target, basic, multiplier, arena, emit);
      const opposite = { ...target, velocity: { x: -target.velocity.x || 1, y: -target.velocity.y } };
      this.plant(tick, owner, opposite, basic, multiplier, arena, emit);
    }
    this.gardens.push({ ownerId: owner.id, abilityId: definition.id, endsTick: tick + e.durationTicks, halfWidth: e.halfWidth, damage: e.damage * multiplier, cooldownTicks: e.cooldownTicks });
    for (const t of this.traps.filter(t => t.ownerId === owner.id)) t.expiresTick = Math.max(t.expiresTick, tick + e.durationTicks + 1);
    return true;
  }

  step(tick: number, bodies: readonly BodySnapshot[], locked: ReadonlySet<string>, impacts: readonly Omit<PhysicsEvent, 'id'>[], emit: Emit): DamageRequest[] {
    const living = new Set(bodies.map(b => b.id));
    this.cleanup(living, false);
    this.gardens = this.gardens.filter(g => tick < g.endsTick && !locked.has(g.ownerId));
    this.traps = this.traps.filter(t => tick < t.expiresTick);
    for (const [key, ready] of this.hitReady) if (tick >= ready) this.hitReady.delete(key);
    const requests: DamageRequest[] = [];
    for (const event of impacts) {
      if (event.type !== 'wall' || event.tick !== tick || !event.impulseApplied || event.impactSpeed <= 0) continue;
      const target = bodies.find(b => b.id === event.bodyId);
      if (!target) continue;
      for (const trap of [...this.traps]) {
        if (target.id === trap.ownerId || target.ownerId === trap.ownerId || locked.has(trap.ownerId) || tick < trap.armedTick) continue;
        const garden = this.gardens.find(g => g.ownerId === trap.ownerId);
        const key = `${trap.ownerId}:${target.id}`;
        if (this.hitReady.has(key)) continue;
        const onSide = event.wall === trap.side || event.wall === 'corner' && (
          trap.side === 'left' ? event.normal.x > 0 : trap.side === 'right' ? event.normal.x < 0 : trap.side === 'top' ? event.normal.y > 0 : event.normal.y < 0);
        if (!onSide || Math.abs(coordinate(event.point, trap.side) - coordinate(trap.position, trap.side)) > (garden?.halfWidth ?? trap.halfWidth)) continue;
        const abilityId = garden?.abilityId ?? trap.abilityId;
        requests.push({ tick, targetId: target.id, amount: garden?.damage ?? trap.damage, source: { kind: 'area', attackerId: trap.ownerId, abilityId, areaId: trap.id } });
        this.hitReady.set(key, tick + (garden?.cooldownTicks ?? 36));
        trap.flashTick = tick;
        emit({ tick, ownerId: trap.ownerId, abilityId, kind: 'hit', targetId: target.id, point: { ...target.position }, end: { ...trap.position }, reason: 'thorn-bloom' });
        if (!garden) this.traps = this.traps.filter(t => t.id !== trap.id);
      }
    }
    return requests;
  }
  cleanup(living: ReadonlySet<string>, finished: boolean) {
    this.traps = this.traps.filter(t => !finished && living.has(t.ownerId));
    this.gardens = this.gardens.filter(g => !finished && living.has(g.ownerId));
    if (finished) this.hitReady.clear();
  }
  snapshot() {
    return { thornTraps: this.traps.map(({ damage, ...t }) => { const garden = this.gardens.find(g => g.ownerId === t.ownerId); return { ...structuredClone(t), halfWidth: garden?.halfWidth ?? t.halfWidth, empowered: !!garden }; }),
      thornGardens: this.gardens.map(g => ({ ownerId: g.ownerId, endsTick: g.endsTick })) };
  }
}
