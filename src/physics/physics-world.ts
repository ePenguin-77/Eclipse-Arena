import { PHYSICS } from '../config/physics';
import type { ArenaDefinition, PhysicsEvent } from '../contracts/types';
import { atSpeed, magnitude } from '../math/vector';
import { createBody, enforceSpeedBand, snapshotBody, type BodySpawn, type PhysicsBody } from './body';
import { resolveContact } from './collision-solver';
import { resolveWalls } from './wall-solver';
import { resolveObstacle } from './obstacle-solver';
import { clearOfArena, validateBoundary } from '../arenas/arena-registry';
import type { KnockbackRequest, RadialForce } from '../contracts/forces';
import type { DashRequest, DashResult } from '../contracts/motion';
import { DashMotion } from './dash-motion';
import {vortexVelocity} from './vortex';
import type {VortexField} from '../contracts/forces';

export class PhysicsWorld {
  applyVortices(fields:readonly VortexField[],dt:number){
    for(const body of this.bodies)if(!body.immobilized)body.velocity=vortexVelocity(body.position,body.velocity,fields,dt);
  }
  tryTeleport(id: string, point: { x: number; y: number }) {
    const body = this.bodies.find(b => b.id === id);
    if (!body || body.immobilized || !clearOfArena(this.arena, point, body.radius) ||
      this.bodies.some(b => b.id !== id && Math.hypot(b.position.x-point.x,b.position.y-point.y) <= b.radius+body.radius+1)) return false;
    body.position = { ...point }; body.previousPosition = { ...point };
    this.dashes.remove(new Set([id]));
    this.touching = new Set([...this.touching].filter(key => !(JSON.parse(key) as string[]).includes(id)));
    return true;
  }
  private frozenVelocity = new Map<string, { x: number; y: number }>();
  setMotionLocks(ids: ReadonlySet<string>) {
    this.dashes.remove(ids);
    for (const body of this.bodies) {
      if (ids.has(body.id)) {
        if (!body.immobilized) this.frozenVelocity.set(body.id, { ...body.velocity });
        body.immobilized = true;
        body.velocity = { x: 0, y: 0 };
        body.previousPosition = { ...body.position };
      } else if (body.immobilized) {
        body.immobilized = false;
        body.velocity = atSpeed(this.frozenVelocity.get(body.id) ?? { x: 1, y: 0 }, body.targetSpeed);
        this.frozenVelocity.delete(body.id);
      }
    }
  }
  private travelled = new Map<string, number>();
  movementDistances() { return new Map(this.travelled); }
  private dashes = new DashMotion();
  private dashResults: DashResult[] = [];
  startDashes(requests: readonly DashRequest[], tick: number) { this.dashes.start(requests.filter(r => !this.bodies.find(b => b.id === r.ownerId)?.immobilized), tick, this.bodies); }
  takeDashResults() { const results = this.dashResults; this.dashResults = []; return results; }
  cancelDashes(ids:ReadonlySet<string>) { this.dashes.cancel(ids,this.bodies); }
  /** Applied after confirmed damage; never teleports bodies or bypasses shared wall/contact solvers. */
  applyKnockbacks(requests: readonly KnockbackRequest[], resistance: ReadonlyMap<string, number> = new Map()) {
    for (const r of requests) {
      const factor = resistance.get(r.targetId) ?? 1;
      if (![r.direction.x, r.direction.y, r.strength, factor].every(Number.isFinite) || r.strength <= 0 || r.strength > 1200 || factor <= 0 || factor > 1) throw new Error('Invalid knockback request');
      const body = this.bodies.find(b => b.id === r.targetId);
      if (!body || body.immobilized || (r.ownerId === r.targetId && !r.selfRebound) || !this.bodies.some(b => b.id === r.ownerId)) continue;
      const length = Math.hypot(r.direction.x, r.direction.y);
      if (length < 1e-8) continue;
      this.dashes.block(body.id);
      const strength = r.strength * factor / body.mass;
      body.velocity.x += r.direction.x / length * strength;
      body.velocity.y += r.direction.y / length * strength;
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      if (speed > body.maxSpeed) { body.velocity.x *= body.maxSpeed / speed; body.velocity.y *= body.maxSpeed / speed; }
    }
  }
  private bodies: PhysicsBody[];
  private touching = new Set<string>();
  private baseSpeeds = new Map<string, { targetSpeed: number; minSpeed: number; maxSpeed: number }>();
  private speedFactors = new Map<string, number>();
  private forced = new Set<string>();
  substeps = 1;
  constructor(readonly arena: Readonly<ArenaDefinition>, spawns: readonly BodySpawn[]) {
    validateBoundary(arena);
    this.arena = structuredClone(arena);
    if (new Set(spawns.map(s => s.id)).size !== spawns.length) throw new Error('Duplicate entity ID');
    this.bodies = spawns.map(createBody);
    for (const b of this.bodies) this.baseSpeeds.set(b.id, { targetSpeed: b.targetSpeed, minSpeed: b.minSpeed, maxSpeed: b.maxSpeed });
    for (const body of this.bodies) {
      if (!clearOfArena(arena, body.position, body.radius)) throw new Error(`Spawn blocked by arena: ${body.id}`);
      if (body.radius * 2 >= Math.min(arena.width, arena.height) || body.position.x < body.radius ||
        body.position.x > arena.width - body.radius || body.position.y < body.radius || body.position.y > arena.height - body.radius) {
        throw new Error(`Spawn outside arena: ${body.id}`);
      }
    }
  }
  removeBodies(ids: ReadonlySet<string>) {
    this.dashes.remove(ids);
    for (const id of ids) { this.baseSpeeds.delete(id); this.speedFactors.delete(id); this.frozenVelocity.delete(id); }
    this.bodies = this.bodies.filter(body => !ids.has(body.id));
    this.touching = new Set([...this.touching].filter(key => !(JSON.parse(key) as string[]).some(id => ids.has(id))));
  }
  /** Derive bands from immutable spawn stats; transitions preserve direction and relative momentum. */
  setSpeedModifiers(factors: ReadonlyMap<string, number>) {
    for (const body of this.bodies) {
      const factor = factors.get(body.id) ?? 1;
      if (!Number.isFinite(factor) || factor < 0.2 || factor > 3) throw new Error('Invalid physics speed modifier');
    }
    for (const body of this.bodies) {
      const factor = factors.get(body.id) ?? 1, previous = this.speedFactors.get(body.id) ?? 1;
      const base = this.baseSpeeds.get(body.id)!;
      body.targetSpeed = base.targetSpeed * factor; body.minSpeed = base.minSpeed * factor; body.maxSpeed = base.maxSpeed * factor;
      body.velocity.x *= factor / previous; body.velocity.y *= factor / previous;
      this.speedFactors.set(body.id, factor);
    }
  }
  /** Sum all influences once, mass-aware and bounded; walls/collisions retain their shared solver. */
  applyForces(forces: readonly RadialForce[], dt: number) {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 1 / 30 || forces.some(f =>
      ![f.position.x, f.position.y, f.radius, f.acceleration].every(Number.isFinite) || f.radius <= 0 || f.acceleration < 0 || f.acceleration > 1800))
      throw new Error('Invalid physics force');
    this.forced.clear();
    for (const body of this.bodies) {
      if (body.immobilized) continue;
      let x = 0, y = 0;
      for (const force of forces) {
        if (body.id === force.ownerId || (force.targetId && force.targetId !== body.id) || !this.bodies.some(b => b.id === force.ownerId)) continue;
        const dx = force.position.x - body.position.x, dy = force.position.y - body.position.y, distance = Math.hypot(dx, dy);
        if (distance < 1 || distance > force.radius) continue;
        // Ease near the center to prevent unstable direction flips.
        const strength = force.acceleration * Math.min(1, distance / (body.radius * 2));
        x += dx / distance * strength; y += dy / distance * strength;
      }
      const length = Math.hypot(x, y), scale = Math.min(1, 1800 / Math.max(1, length)) * dt / body.mass;
      if (length <= 1e-8) continue;
      this.forced.add(body.id);
      body.velocity.x += x * scale; body.velocity.y += y * scale;
      // Permit braking through zero while controlled; otherwise the minimum-speed
      // reset would make an outward-moving fighter immune to inward force.
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      if (speed > body.maxSpeed) { body.velocity.x *= body.maxSpeed / speed; body.velocity.y *= body.maxSpeed / speed; }
    }
  }
  step(dt: number, tick: number, emit: (event: Omit<PhysicsEvent, 'id'>) => void,
    onContact?: (event: Omit<PhysicsEvent, 'id'>) => void) {
    this.travelled.clear();
    let maxRatio = 1;
    for (const body of this.bodies) {
      body.previousPosition = { ...body.position };
      if (!this.dashes.drive(body) && !this.forced.has(body.id)) enforceSpeedBand(body);
      maxRatio = Math.max(maxRatio, magnitude(body.velocity) * dt / (body.radius * PHYSICS.maxTravelRadiusFraction));
    }
    this.substeps = Math.ceil(maxRatio);
    const delta = dt / this.substeps;
    const wall = (body: PhysicsBody) => {
      if (body.immobilized) return;
      const result = resolveWalls(body, this.arena);
      if (result) { this.dashes.block(body.id); emit({ ...result, type: 'wall', bodyId: body.id, tick, impulseApplied: true }); }
    };
    const obstacles = (body: PhysicsBody, from?: { x: number; y: number }) => {
      if (body.immobilized) return;
      for (const obstacle of this.arena.obstacles ?? []) {
        const result = resolveObstacle(body, obstacle, from, delta);
        if (result) { this.dashes.block(body.id); emit({ ...result, type: 'obstacle', bodyId: body.id, tick }); }
      }
    };
    for (let step = 0; step < this.substeps; step++) {
      for (const body of this.bodies) {
        if (body.immobilized) continue;
        const from = { ...body.position };
        body.position.x += body.velocity.x * delta;
        body.position.y += body.velocity.y * delta;
        obstacles(body, from);
        wall(body);
        // Integrator travel only: penetration correction and teleports cannot grant distance charge.
        const distance = Math.min(Math.hypot(body.position.x-from.x, body.position.y-from.y), Math.hypot(body.velocity.x,body.velocity.y)*delta);
        this.travelled.set(body.id,(this.travelled.get(body.id)??0)+distance);
      }
      const touching = new Set<string>();
      for (let i = 0; i < this.bodies.length; i++) {
        for (let j = i + 1; j < this.bodies.length; j++) {
          const a = this.bodies[i]!;
          const b = this.bodies[j]!;
          if (this.dashes.phases(a.id, b.id)) continue;
          const contact = resolveContact(a, b);
          if (!contact) continue;
          if (contact.impulseApplied) { this.dashes.block(a.id); this.dashes.block(b.id); }
          const key = JSON.stringify([a.id, b.id]);
          touching.add(key);
          onContact?.({ ...contact, type: 'contact', bodyId: a.id, otherId: b.id, tick });
          if (!this.touching.has(key)) emit({ ...contact, type: 'contact', bodyId: a.id, otherId: b.id, tick });
        }
      }
      this.touching = touching;
      for (const body of this.bodies) { obstacles(body); wall(body); }
    }
    this.forced.clear();
    this.dashResults = this.dashes.finish(tick, this.bodies);
    // Re-entry contacts use the same solver and event pipeline as ordinary movement.
    const ended = new Set(this.dashResults.map(r => r.ownerId));
    if (ended.size) {
      for (let i = 0; i < this.bodies.length; i++) for (let j = i + 1; j < this.bodies.length; j++) {
        const a = this.bodies[i]!, b = this.bodies[j]!;
        if ((!ended.has(a.id) && !ended.has(b.id)) || this.dashes.phases(a.id, b.id)) continue;
        const contact = resolveContact(a, b);
        if (!contact) continue;
        const event = { ...contact, type: 'contact' as const, bodyId: a.id, otherId: b.id, tick };
        onContact?.(event);
        const key = JSON.stringify([a.id, b.id]);
        if (!this.touching.has(key)) emit(event);
        this.touching.add(key);
      }
      for (const body of this.bodies) { obstacles(body); wall(body); }
    }
  }
  snapshot() { return this.bodies.map(snapshotBody); }
  get maxOverlap() {
    let overlap = 0;
    for (let i = 0; i < this.bodies.length; i++) for (let j = i + 1; j < this.bodies.length; j++) {
      const a = this.bodies[i]!; const b = this.bodies[j]!;
      overlap = Math.max(overlap, a.radius + b.radius - Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y));
    }
    return overlap;
  }
}
