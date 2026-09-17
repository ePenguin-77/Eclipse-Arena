import type { CollisionImpact, CombatantState, CombatSetup, CombatSnapshot, DamageRequest, DamageResult } from '../contracts/combat';
import { resolveDamageBatch } from './damage-system';
import { RecoveryWorld } from './recovery-world';
import type { RecoveryProfile } from '../contracts/combat';

export class CombatWorld {
  private recovery = new RecoveryWorld();
  private auxiliaryIds = new Set<string>();
  /** Keep companion HP in the shared damage pipeline, outside match victory and HUD roster. */
  syncAuxiliaries(definitions: readonly { id: string; maxHP: number; damageMultiplier: number }[]) {
    const next = new Set(definitions.map(d => d.id));
    if (next.size !== definitions.length || definitions.some(d => !d.id.trim() || this.setup.combatants.some(c => c.id === d.id) ||
      !Number.isFinite(d.maxHP) || d.maxHP <= 0 || !Number.isFinite(d.damageMultiplier) || d.damageMultiplier <= 0)) throw new Error('Invalid auxiliary combatant');
    for (const id of this.auxiliaryIds) if (!next.has(id)) this.states.delete(id);
    for (const d of definitions) {
      if (!this.states.has(d.id)) this.states.set(d.id, { ...d, hp: d.maxHP, alive: true });
    }
    this.auxiliaryIds = next;
  }
  auxiliaryStates() { return [...this.states.values()].filter(s => this.auxiliaryIds.has(s.id)).map(s => ({ ...s })); }
  private states: Map<string, CombatantState>;
  private setup: CombatSetup;
  private cooldowns = new Map<string, number>();
  private results: CombatSnapshot['results'] = [];
  private nextId = 1;
  private totalDamage = 0;
  private finishedTick: number | null = null;
  private winnerId: string | null = null;
  private tickResults: DamageResult[] = [];
  constructor(setup: CombatSetup) {
    const r = setup.rules;
    if (!Object.values(r).every(Number.isFinite) || (r.damageScale ?? 1) <= 0 || r.minDamage <= 0 || r.maxDamage < r.minDamage || r.minImpactSpeed < 0 ||
      r.maxImpactSpeed <= r.minImpactSpeed || !Number.isInteger(r.collisionCooldownTicks) || r.collisionCooldownTicks < 1 ||
      !Number.isInteger(r.historyLimit) || r.historyLimit < 1 || setup.combatants.length < 2 ||
      new Set(setup.combatants.map(s => s.id)).size !== setup.combatants.length ||
      setup.combatants.some(s => !Number.isFinite(s.maxHP) || s.maxHP <= 0 || !Number.isFinite(s.damageMultiplier) || s.damageMultiplier <= 0 || !Number.isFinite(r.maxDamage * s.damageMultiplier))) {
      throw new Error('Invalid combat setup');
    }
    this.setup = structuredClone(setup);
    if (setup.combatants.some(c=>c.collisionDamageMultiplier!==undefined && (!Number.isFinite(c.collisionDamageMultiplier)||c.collisionDamageMultiplier<0||c.collisionDamageMultiplier>10))) throw new Error('Invalid collision damage multiplier');
    this.states = new Map(this.setup.combatants.map(s => [s.id, { ...s, hp: s.maxHP, alive: true }]));
  }
  get finished() { return this.finishedTick !== null; }
  payCastCost(tick:number,id:string,amount:number){return this.finished?0:this.recovery.payCost(tick,this.states.get(id),amount);}
  rewindHealth(tick:number,id:string,amount:number,ceiling:number) {
    return this.finished?0:this.recovery.rewind(tick,this.states.get(id),amount,ceiling);
  }
  get lastResults(): readonly DamageResult[] { return structuredClone(this.tickResults); }
  resolveTick(tick: number, impacts: readonly CollisionImpact[], abilityRequests: readonly DamageRequest[] = [], modifiers: ReadonlyMap<string, { outgoing: number; incoming: number }> = new Map(), mitigate: (request: DamageRequest) => DamageRequest = r => r, recoveryProfiles: ReadonlyMap<string, RecoveryProfile> = new Map()): string[] {
    if (this.finished) return [];
    const requests: DamageRequest[] = [];
    const rules = this.setup.rules;
    for (const impact of impacts) {
      const a = this.states.get(impact.bodyId), b = this.states.get(impact.otherId);
      if (!a?.alive || !b?.alive || a.id === b.id || !impact.impulseApplied || !Number.isFinite(impact.impactSpeed) ||
        impact.impactSpeed <= 0 || impact.impactSpeed < rules.minImpactSpeed) continue;
      const key = JSON.stringify([a.id, b.id].sort());
      if (tick < (this.cooldowns.get(key) ?? -Infinity)) continue;
      this.cooldowns.set(key, tick + rules.collisionCooldownTicks);
      const ratio = Math.min(1, Math.max(0, (impact.impactSpeed - rules.minImpactSpeed) / (rules.maxImpactSpeed - rules.minImpactSpeed)));
      const amount = rules.minDamage + (rules.maxDamage - rules.minDamage) * ratio;
      if ((a.collisionDamageMultiplier??1)>0) requests.push({ tick, source: { kind: 'collision', attackerId: a.id }, targetId: b.id, amount: amount * a.damageMultiplier * (a.collisionDamageMultiplier??1) });
      if ((b.collisionDamageMultiplier??1)>0) requests.push({ tick, source: { kind: 'collision', attackerId: b.id }, targetId: a.id, amount: amount * b.damageMultiplier * (b.collisionDamageMultiplier??1) });
    }
    requests.push(...abilityRequests);
    const results = resolveDamageBatch(this.states, requests.map(r => this.states.get(r.targetId)?.alive && this.states.get(r.source.attackerId)?.alive &&
      r.targetId !== r.source.attackerId && Number.isFinite(r.amount) && r.amount > 0 ? mitigate(r) : r).map(r => ({ ...r,
      amount: r.amount * (rules.damageScale ?? 1) * (modifiers.get(r.source.attackerId)?.outgoing ?? 1) * (modifiers.get(r.targetId)?.incoming ?? 1) })));
    this.tickResults = results;
    this.recovery.resolve(tick, this.states, results, recoveryProfiles);
    const defeated: string[] = [];
    for (const result of results) {
      this.results.push({ ...result, id: this.nextId++ });
      this.totalDamage += result.appliedDamage;
      if (result.defeated) defeated.push(result.request.targetId);
    }
    if (this.results.length > rules.historyLimit) this.results.splice(0, this.results.length - rules.historyLimit);
    for (const [key, expires] of this.cooldowns) if (expires <= tick) this.cooldowns.delete(key);
    const survivors = [...this.states.values()].filter(s => s.alive && !this.auxiliaryIds.has(s.id));
    if (survivors.length <= 1) { this.finishedTick = tick; this.winnerId = survivors[0]?.id ?? null; }
    return defeated;
  }
  snapshot(): CombatSnapshot {
    return { recoveryEvents: this.recovery.snapshot(), combatants: [...this.states.values()].filter(s => !this.auxiliaryIds.has(s.id)).map(s => ({ ...s })), results: structuredClone(this.results), totalDamage: this.totalDamage,
      status: this.finished ? 'finished' : 'active', winnerId: this.winnerId, finishedTick: this.finishedTick, rules: { ...this.setup.rules } };
  }
}
