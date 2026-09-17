import type { PassiveProc } from '../contracts/status';
import { validatePull, type RadialForce } from '../contracts/forces';
import type { BodySnapshot } from '../contracts/types';

/** Short target-specific pulls follow the source; instances never outlive either body. */
export class PullWorld {
  private pulls: (PassiveProc & { expiresTick: number })[] = [];
  add(tick: number, proc: PassiveProc) {
    validatePull(proc.pull);
    if (!Number.isInteger(tick) || tick < 0 || !proc.sourceId || !proc.targetId || proc.sourceId === proc.targetId) throw new Error('Invalid pull instance');
    this.pulls = this.pulls.filter(p => p.sourceId !== proc.sourceId || p.targetId !== proc.targetId);
    if (this.pulls.length < 32) this.pulls.push({ ...structuredClone(proc), expiresTick: tick + proc.pull.durationTicks });
  }
  sample(tick: number, bodies: readonly BodySnapshot[]): RadialForce[] {
    const living = new Map(bodies.map(b => [b.id, b]));
    this.pulls = this.pulls.filter(p => tick <= p.expiresTick && living.has(p.sourceId) && living.has(p.targetId));
    return this.pulls.map(p => ({ ownerId: p.sourceId, targetId: p.targetId, position: { ...living.get(p.sourceId)!.position },
      radius: p.pull.radius, acceleration: p.pull.acceleration }));
  }
  clear() { this.pulls = []; }
}
