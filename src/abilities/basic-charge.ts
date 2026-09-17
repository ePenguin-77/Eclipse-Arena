import type { BasicChargeDefinition } from '../contracts/abilities';
import { validateContactDefense } from './contact-defense';

export function validateBasicCharge(d: BasicChargeDefinition) {
  if (d.defense) { validateContactDefense(d.defense); if (d.mode !== 'distance') throw new Error('Contact defense requires distance charge'); }
  if (!d.name.trim() || !Number.isSafeInteger(d.maxStacks) || d.maxStacks < 1 ||
    !Number.isInteger(d.intervalTicks) || d.intervalTicks < 1 || !Number.isFinite(d.damagePerStack) || d.damagePerStack < 0 ||
    (d.mode !== undefined && !['power', 'recharge', 'distance'].includes(d.mode)) || (d.mode === 'recharge' && d.damagePerStack !== 0) ||
    !Number.isFinite(1 + d.maxStacks * d.damagePerStack)) throw new Error('Invalid basic charge');
  if (d.mode === 'distance' && (!Number.isFinite(d.distancePerStack) || d.distancePerStack! <= 0 || !Number.isFinite(d.speedPerStack) || d.speedPerStack! < 0 || d.speedPerStack! * d.maxStacks > .8)) throw new Error('Invalid distance charge');
  if (d.afterHitBoost && (d.mode !== 'distance' || !Number.isFinite(d.afterHitBoost.multiplier) || d.afterHitBoost.multiplier < 1 || d.afterHitBoost.multiplier > 2 || !Number.isInteger(d.afterHitBoost.durationTicks) || d.afterHitBoost.durationTicks < 1 || d.afterHitBoost.durationTicks > 120)) throw new Error('Invalid speed burst');
}
/** Fixed-tick time or measured travel only. An activation snapshots and spends stored power. */
export class BasicCharge {
  private spentAt = 0;
  private cleared = false;
  private charges: number;
  private refillAt: number | null = null;
  private distance = 0;
  addDistance(distance: number) {
    if (!Number.isFinite(distance) || distance < 0) throw new Error('Invalid travelled distance');
    if (!this.cleared && this.definition.mode === 'distance') this.distance = Math.min(this.definition.maxStacks * this.definition.distancePerStack!, this.distance + distance);
  }
  constructor(private readonly definition: BasicChargeDefinition) {
    validateBasicCharge(definition); this.definition = structuredClone(definition); this.charges = definition.maxStacks;
  }
  /** Derive recharge state without mutating simulation during snapshots/render sampling. */
  private recharge(tick: number) {
    const elapsed = this.refillAt === null ? 0 : Math.max(0, Math.floor((tick - this.refillAt) / this.definition.intervalTicks) + 1);
    const count = Math.min(this.definition.maxStacks, this.charges + elapsed);
    const next = count === this.definition.maxStacks || this.refillAt === null ? null : this.refillAt + elapsed * this.definition.intervalTicks;
    return { count, next };
  }
  stacks(tick: number) {
    if (this.cleared) return 0;
    if (this.definition.mode === 'distance') return Math.min(this.definition.maxStacks, Math.floor(this.distance / this.definition.distancePerStack!));
    return this.definition.mode === 'recharge' ? this.recharge(tick).count
      : Math.min(this.definition.maxStacks, Math.max(0, Math.floor((tick - this.spentAt) / this.definition.intervalTicks)));
  }
  canActivate(tick: number) { return !this.cleared && (this.definition.mode !== 'recharge' || this.stacks(tick) > 0); }
  rechargeProgress(tick: number) {
    if (this.cleared || this.definition.mode !== 'recharge') return 0;
    const { next } = this.recharge(tick);
    return next === null ? 0 : Math.max(0, Math.min(1, 1 - (next - tick) / this.definition.intervalTicks));
  }
  consume(tick: number) {
    if (!this.canActivate(tick)) throw new Error('Basic charge is not ready');
    if (this.definition.mode === 'recharge') {
      const { count, next } = this.recharge(tick);
      this.charges = count - 1; this.refillAt = next ?? tick + this.definition.intervalTicks;
      return 1;
    }
    const multiplier = 1 + this.stacks(tick) * this.definition.damagePerStack; this.spentAt = tick; this.distance = 0; return multiplier;
  }
  clear() { this.cleared = true; }
}
