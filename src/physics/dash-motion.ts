import type { DashRequest, DashResult } from '../contracts/motion';
import type { PhysicsBody } from './body';
import { normalizeTarget } from './body';

interface Motion extends DashRequest { direction: { x: number; y: number }; endsTick: number; blocked: boolean }
/** Physics owns transient velocity and pair phasing. Walls and obstacles remain solid. */
export class DashMotion {
  private active = new Map<string, Motion>();
  start(requests: readonly DashRequest[], tick: number, bodies: readonly PhysicsBody[]) {
    for (const r of requests) {
      if (!Number.isFinite(r.speed) || r.speed <= 0 || r.speed > 1400 || !Number.isInteger(r.durationTicks) || r.durationTicks < 1 || r.durationTicks > 30) throw new Error('Invalid dash motion');
      const owner = bodies.find(b => b.id === r.ownerId), target = bodies.find(b => b.id === r.targetId);
      if (!owner || (!target && !r.direction) || owner === target || this.active.has(owner.id)) continue;
      const x = r.direction?.x ?? target!.position.x - owner.position.x, y = r.direction?.y ?? target!.position.y - owner.position.y, length = Math.hypot(x, y);
      if (!Number.isFinite(length)) throw new Error('Invalid dash direction');
      if (length < 1e-6) continue;
      this.active.set(owner.id, { ...r, direction: { x: x / length, y: y / length }, endsTick: tick + r.durationTicks - 1, blocked: false });
    }
  }
  drive(body: PhysicsBody) {
    const motion = this.active.get(body.id);
    if (!motion || motion.blocked) return false;
    body.velocity = { x: motion.direction.x * motion.speed, y: motion.direction.y * motion.speed };
    return true;
  }
  phases(a: string, b: string) {
    const first=this.active.get(a),second=this.active.get(b);
    return (first?.targetId === b && first.phaseTarget !== false) || (second?.targetId === a && second.phaseTarget !== false);
  }
  block(id: string) { const motion = this.active.get(id); if (motion) motion.blocked = true; }
  finish(tick: number, bodies: readonly PhysicsBody[]): DashResult[] {
    const results: DashResult[] = [];
    for (const [id, motion] of this.active) {
      const owner = bodies.find(b => b.id === id), target = bodies.find(b => b.id === motion.targetId);
      if (!owner) { this.active.delete(id); continue; }
      const crossed = !!target && (owner.position.x - target.position.x) * motion.direction.x +
        (owner.position.y - target.position.y) * motion.direction.y >= owner.radius + target.radius;
      if (!motion.blocked && (!crossed || motion.endOnCross === false) && tick < motion.endsTick) continue;
      normalizeTarget(owner);
      results.push({ ownerId: id, abilityId: motion.abilityId, crossed: crossed && !motion.blocked });
      this.active.delete(id);
    }
    return results;
  }
  remove(ids: ReadonlySet<string>) { for (const id of ids) this.active.delete(id); }
  cancel(ids:ReadonlySet<string>,bodies:readonly PhysicsBody[]) {
    for(const id of ids)if(this.active.delete(id)){const body=bodies.find(b=>b.id===id);if(body)normalizeTarget(body);}
  }
}
