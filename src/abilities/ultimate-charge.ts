import type { ChargeTrigger, UltimateDefinition } from '../contracts/abilities';
export type { ChargeTrigger } from '../contracts/abilities';
export function validateUltimate(d: UltimateDefinition) {
  if (d.counterLabel !== undefined && !d.counterLabel.trim()) throw new Error('Invalid ultimate counter label');
  if (d.activation !== undefined && d.activation !== 'impact') throw new Error('Invalid ultimate activation');
  if (d.resource !== undefined && !['attached-summons','status-stacks','ink-strokes'].includes(d.resource)) throw new Error('Invalid ultimate resource');
  if (d.resource === 'ink-strokes' && (d.maxCharge !== 3 || d.rules.length)) throw new Error('Invalid ink resource');
  if (d.resource==='status-stacks' && (!d.statusId?.trim()||d.rules.length||!Number.isInteger(d.maxCharge)||d.maxCharge<2||d.maxCharge>10)) throw new Error('Invalid status resource');
  if (!Number.isFinite(d.maxCharge) || d.maxCharge <= 0 || !Number.isInteger(d.windupTicks) || d.windupTicks < 1 ||
    !Number.isInteger(d.armedTicks) || d.armedTicks < 1 || (!d.rules.length && !d.resource) ||
    new Set(d.rules.map(r => r.trigger)).size !== d.rules.length || d.rules.some(r =>
      !['wall-impact', 'character-impact', 'time', 'basic-hit', 'basic-cast', 'passive-proc', 'wall-slam', 'charged-basic-hit', 'enemy-damage'].includes(r.trigger) ||
      !Number.isFinite(r.amount) || r.amount <= 0 || !Number.isInteger(r.intervalTicks) || r.intervalTicks < 1)) throw new Error('Invalid ultimate charge rules');
}
/** One meter per ability instance. Receives facts from simulation, never reads history. */
export class UltimateCharge {
  value = 0;
  private last = new Map<ChargeTrigger, number>();
  private definition: UltimateDefinition;
  constructor(definition: UltimateDefinition) { validateUltimate(definition); this.definition = structuredClone(definition); }
  get full() { return this.value >= this.definition.maxCharge; }
  signal(trigger: ChargeTrigger, tick: number, units = 1) {
    if (!Number.isFinite(units) || units <= 0) return;
    const rule = this.definition.rules.find(r => r.trigger === trigger);
    if (!rule || tick - (this.last.get(trigger) ?? (trigger === 'time' ? 0 : -Infinity)) < rule.intervalTicks) return;
    this.last.set(trigger, tick);
    this.value = Math.min(this.definition.maxCharge, this.value + rule.amount * units);
  }
  consume(tick: number) {
    if (!this.full) return false;
    this.value = 0;
    // A new charge cycle starts now, including timer-based rules.
    for (const rule of this.definition.rules) this.last.set(rule.trigger, tick);
    return true;
  }
  clear() { this.value = 0; this.last.clear(); }
}
