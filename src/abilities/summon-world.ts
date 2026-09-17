import type { AbilityEvent } from '../contracts/abilities';
import type { CombatantState, DamageRequest } from '../contracts/combat';
import type { SummonDefinition, SummonEmpowerment, SummonSnapshot } from '../contracts/summons';
import type { ArenaDefinition, BodySnapshot, PhysicsEvent } from '../contracts/types';
import { sweepCircle } from '../math/sweep-circle';
import { resolveObstacle } from '../physics/obstacle-solver';

type Emit = (event: Omit<AbilityEvent, 'id'>) => void;
interface Companion extends SummonSnapshot {
  definition: SummonDefinition; damage: number; nextAttack: number;
  empowerment?: SummonEmpowerment; empoweredDamage: number; contacts: Map<string, number>;
}
const isAlive = (s: Companion) => s.definition.attachment ? (s.impactsRemaining ?? 0) > 0 : (s.hp ?? 0) > 0;
export function validateSummon(d: SummonDefinition, empowerment?: SummonEmpowerment) {
  if (d.attachment && (!Number.isSafeInteger(d.attachment.maxCount) || d.attachment.maxCount < 1 || d.attachment.maxCount > 8 ||
    !Number.isSafeInteger(d.attachment.impactsToDispel) || d.attachment.impactsToDispel < 1 || d.attachment.impactsToDispel > 100)) throw new Error('Invalid attachment');
  if (d.attachment ? d.maxHP !== undefined : !Number.isFinite(d.maxHP) || d.maxHP! <= 0 || d.maxHP! > 1000) throw new Error('Invalid summon durability');
  if (!d.id?.trim() || !d.name?.trim() || [d.radius, d.speed, d.contactDamage].some(n => !Number.isFinite(n) || n <= 0) ||
    d.radius > 80 || d.speed > 800 || !Number.isFinite(d.attackRange) || d.attackRange < 0 || d.attackRange > 100 ||
    [d.lifetimeTicks, d.attackIntervalTicks, d.contactCooldownTicks].some(n => !Number.isSafeInteger(n) || n < 1) || d.lifetimeTicks > 3600) throw new Error('Invalid summon');
  if (empowerment && ([empowerment.durationTicks, empowerment.attackIntervalTicks].some(n => !Number.isSafeInteger(n) || n < 1) ||
    empowerment.durationTicks > 1200 || !Number.isFinite(empowerment.damageMultiplier) || empowerment.damageMultiplier <= 0 || empowerment.damageMultiplier > 5 ||
    !Number.isFinite(empowerment.pulseRadius) || empowerment.pulseRadius <= 0 || empowerment.pulseRadius > 400)) throw new Error('Invalid summon empowerment');
}

/** Tick-owned companions; no per-character branches and no dependency on sprites. */
export class SummonWorld {
  private companions: Companion[] = [];
  private nextId = 1;
  has(ownerId: string) { return this.companions.some(s => s.ownerId === ownerId); }
  canSpawn(ownerId: string, d: SummonDefinition) { return this.companions.filter(s => s.ownerId === ownerId).length < (d.attachment?.maxCount ?? 1); }
  attachedCount(ownerId: string) { return this.companions.filter(s => s.ownerId === ownerId && s.attachedTo && isAlive(s)).length; }
  consumeAttached(ownerId: string) {
    const attached = this.companions.filter(s => s.ownerId === ownerId && s.attachedTo && isAlive(s));
    this.companions = this.companions.filter(s => !attached.includes(s));
    return attached.map(s => ({ targetId: s.attachedTo!, point: { ...s.position }, summonId: s.id }));
  }
  applyHostImpacts(events: readonly Omit<PhysicsEvent, 'id'>[]) {
    const seen = new Set<string>();
    for (const e of events) {
      if (!e.impulseApplied || e.impactSpeed <= 0) continue;
      const pair = e.type === 'contact' ? [e.bodyId, e.otherId].sort().join(':') : `${e.bodyId}:${e.wall ?? e.obstacleId}`;
      const key = `${e.tick}:${e.type}:${pair}`;
      if (seen.has(key)) continue;
      seen.add(key);
      for (const s of this.companions) if (s.definition.attachment && s.attachedTo &&
        (s.attachedTo === e.bodyId || (e.type === 'contact' && s.attachedTo === e.otherId)))
        s.impactsRemaining = Math.max(0, s.impactsRemaining! - 1);
    }
    this.companions = this.companions.filter(isAlive);
  }
  private constrain(s: Companion, arena: ArenaDefinition) {
    const body = { ...s, mass: 1, targetSpeed: s.definition.speed, minSpeed: 1, maxSpeed: s.definition.speed, restitution: 1 };
    for (const obstacle of arena.obstacles ?? []) resolveObstacle(body, obstacle, s.previousPosition);
    s.position = { x: Math.max(s.radius, Math.min(arena.width - s.radius, body.position.x)), y: Math.max(s.radius, Math.min(arena.height - s.radius, body.position.y)) };
    s.velocity = body.velocity;
  }
  spawn(tick: number, owner: BodySnapshot, abilityId: string, definition: SummonDefinition, damage: number, arena: ArenaDefinition,
    empowerment?: SummonEmpowerment, basicAbilityId = abilityId): boolean {
    validateSummon(definition, empowerment);
    if (!Number.isFinite(damage) || damage < 0 || (damage === 0 && !definition.attachment)) throw new Error('Invalid summon damage');
    if (definition.attachment && !this.canSpawn(owner.id, definition)) return false;
    let s = definition.attachment ? undefined : this.companions.find(c => c.ownerId === owner.id);
    if (s && !empowerment) return false;
    if (!s) {
      if (this.companions.length >= 16) return false;
      const position = { x: owner.position.x + owner.radius + definition.radius + 8, y: owner.position.y };
      s = { id: `summon-${this.nextId++}`, ownerId: owner.id, abilityId: basicAbilityId, name: definition.name,
        definition: structuredClone(definition), position, previousPosition: { ...position }, velocity: { x: 0, y: 0 }, radius: definition.radius,
        ...(definition.attachment ? { impactsRemaining: definition.attachment.impactsToDispel, impactsToDispel: definition.attachment.impactsToDispel } : { hp: definition.maxHP!, maxHP: definition.maxHP! }),
        spawnedTick: tick, expiresTick: tick + definition.lifetimeTicks,
        damage, nextAttack: tick + 24, empoweredUntil: 0, empoweredDamage: 0, contacts: new Map() };
      this.constrain(s, arena); s.previousPosition = { ...s.position };
      this.companions.push(s);
    }
    if (empowerment) {
      s.empowerment = structuredClone(empowerment); s.empoweredUntil = tick + empowerment.durationTicks;
      s.empowermentAbilityId = abilityId; s.empoweredDamage = damage * empowerment.damageMultiplier;
      s.expiresTick = Math.max(s.expiresTick, s.empoweredUntil);
      s.nextAttack = Math.min(s.nextAttack, tick + 18);
    }
    return true;
  }
  step(tick: number, dt: number, arena: ArenaDefinition, bodies: readonly BodySnapshot[], emit: Emit, evadeAttachment?: (targetId:string,ownerId:string)=>boolean): DamageRequest[] {
    this.companions = this.companions.filter(s => isAlive(s) && (s.attachedTo ? bodies.some(b => b.id === s.attachedTo) : tick < s.expiresTick) && bodies.some(b => b.id === s.ownerId));
    const requests: DamageRequest[] = [];
    for (const s of this.companions) {
      if (s.attachedTo) {
        const host = bodies.find(b => b.id === s.attachedTo)!;
        const siblings = this.companions.filter(c => c.attachedTo === host.id);
        const angle = -Math.PI / 2 + siblings.indexOf(s) * Math.PI * 2 / Math.max(3, siblings.length);
        s.previousPosition = { ...s.position };
        s.position = { x: host.position.x + Math.cos(angle) * host.radius * .8, y: host.position.y + Math.sin(angle) * host.radius * .8 };
        s.velocity = { ...host.velocity };
        continue;
      }
      // Attached spirits need a fighter host whose wall/contact impacts can dispel them.
      const enemies = bodies.filter(b => b.id !== s.ownerId && b.ownerId !== s.ownerId && (!s.definition.attachment || !b.ownerId));
      const distance = (b: BodySnapshot) => Math.hypot(b.position.x - s.position.x, b.position.y - s.position.y);
      const target = [...enemies].sort((a, b) => distance(a) - distance(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
      s.targetId = target?.id; s.previousPosition = { ...s.position };
      if (!target) continue;
      const dx = target.position.x - s.position.x, dy = target.position.y - s.position.y, length = Math.hypot(dx, dy);
      const travel = Math.min(length, s.definition.speed * dt);
      s.velocity = length ? { x: dx / length * s.definition.speed, y: dy / length * s.definition.speed } : { x: 0, y: 0 };
      if (length) { s.position.x += dx / length * travel; s.position.y += dy / length * travel; }
      this.constrain(s, arena);
      if (s.definition.attachment) {
        const hit = sweepCircle({ x: s.previousPosition.x - target.previousPosition.x, y: s.previousPosition.y - target.previousPosition.y },
          { x: s.position.x - target.position.x, y: s.position.y - target.position.y }, s.radius + target.radius);
        if (hit !== null) {
          if(evadeAttachment?.(target.id,s.ownerId)){s.impactsRemaining=0;s.expiresTick=tick;}
          else {s.attachedTo = target.id; s.position = { ...target.position }; s.previousPosition = { ...s.position };}
        }
        continue; // Attaching never deals damage and does not receive contact/projectile damage.
      }
      const empowered = !!s.empowerment && tick < s.empoweredUntil;
      if (tick >= s.nextAttack && (empowered || distance(target) <= s.radius + target.radius + s.definition.attackRange)) {
        const abilityId = empowered ? s.empowermentAbilityId! : s.abilityId;
        const victims = empowered ? enemies.filter(b => distance(b) <= s.empowerment!.pulseRadius + b.radius) : [target];
        // Fixed pulse cadence even if nobody is in range; misses never charge the ultimate.
        s.nextAttack = tick + (empowered ? s.empowerment!.attackIntervalTicks : s.definition.attackIntervalTicks);
        if (empowered) emit({ tick, ownerId: s.ownerId, abilityId, kind: 'summon-pulse', point: { ...s.position } });
        for (const victim of victims) {
          requests.push({ tick, targetId: victim.id, amount: empowered ? s.empoweredDamage : s.damage,
            source: { kind: 'summon', attackerId: s.ownerId, abilityId, summonId: s.id } });
          emit({ tick, ownerId: s.ownerId, abilityId, kind: 'hit', targetId: victim.id, point: { ...victim.position } });
        }
      }
      for (const enemy of enemies) {
        const hit = sweepCircle({ x: s.previousPosition.x - enemy.previousPosition.x, y: s.previousPosition.y - enemy.previousPosition.y },
          { x: s.position.x - enemy.position.x, y: s.position.y - enemy.position.y }, s.radius + enemy.radius);
        if (hit === null || tick < (s.contacts.get(enemy.id) ?? 0)) continue;
        requests.push({ tick, targetId: s.id, amount: s.definition.contactDamage,
          source: { kind: 'collision', attackerId: enemy.id } });
        s.contacts.set(enemy.id, tick + s.definition.contactCooldownTicks);
      }
    }
    return requests;
  }
  combatants() { return this.companions.filter(s => !s.definition.attachment).map(s => ({ id: s.id, maxHP: s.maxHP!, damageMultiplier: 1 })); }
  targets(): BodySnapshot[] { return this.companions.filter(s => !s.definition.attachment).map(s => ({ id: s.id, ownerId: s.ownerId, position: { ...s.position }, previousPosition: { ...s.previousPosition },
    velocity: { ...s.velocity }, radius: s.radius, mass: 1, targetSpeed: s.definition.speed, minSpeed: 1, maxSpeed: s.definition.speed, restitution: 1, speed: Math.hypot(s.velocity.x, s.velocity.y) })); }
  afterCombat(states: readonly CombatantState[], living: ReadonlySet<string>, finished: boolean) {
    for (const s of this.companions) if (!s.definition.attachment) s.hp = states.find(c => c.id === s.id)?.hp ?? s.hp;
    this.companions = this.companions.filter(s => !finished && living.has(s.ownerId) && (!s.attachedTo || living.has(s.attachedTo)) && isAlive(s));
  }
  snapshot(): SummonSnapshot[] { return this.companions.map(({ definition: _definition, damage: _damage, nextAttack: _next, empowerment: _empowerment,
    empoweredDamage: _powered, contacts: _contacts, ...s }) => structuredClone(s)); }
}
