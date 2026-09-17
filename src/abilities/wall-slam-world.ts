import type { DamageRequest } from '../contracts/combat';
import type { PhysicsEvent } from '../contracts/types';

interface PendingSlam { ownerId: string; targetId: string; abilityId: string; damage: number; appliedTick: number; expiresTick: number }
/** Latest successful push owns a target. Other impacts cancel attribution; corners cannot award twice. */
export class WallSlamWorld {
  private pending = new Map<string, PendingSlam>();
  disarm(targetId: string) { this.pending.delete(targetId); }
  arm(slam: PendingSlam) { this.pending.set(slam.targetId, { ...slam }); }
  resolve(tick: number, events: readonly Omit<PhysicsEvent, 'id'>[], living: ReadonlySet<string>) {
    this.cleanup(tick, living, false);
    const hits: { request: DamageRequest; point: PhysicsEvent['point'] }[] = [];
    for (const e of events) {
      if (!e.impulseApplied || e.impactSpeed <= 0) continue;
      for (const id of [e.bodyId, ...(e.type === 'contact' && e.otherId ? [e.otherId] : [])]) {
        const p = this.pending.get(id);
        if (!p || tick <= p.appliedTick) continue;
        this.pending.delete(id);
        if (e.type === 'wall') hits.push({ point: { ...e.point }, request: { tick, targetId: id, amount: p.damage,
          source: { kind: 'status', attackerId: p.ownerId, abilityId: p.abilityId, statusId: 'wall-slam' } } });
      }
    }
    return hits;
  }
  cleanup(tick: number, living: ReadonlySet<string>, finished: boolean) {
    for (const [id, p] of this.pending) if (finished || tick >= p.expiresTick || !living.has(id) || !living.has(p.ownerId)) this.pending.delete(id);
  }
}
