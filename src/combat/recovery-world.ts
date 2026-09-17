import type { CombatantState, DamageResult, RecoveryEvent, RecoveryProfile } from '../contracts/combat';

/** Post-damage recovery never revives a defeated fighter and never creates damage requests. */
export class RecoveryWorld {
  private history: RecoveryEvent[] = [];
  private recent: { ownerId: string; tick: number; amount: number }[] = [];
  private nextId = 1;
  payCost(tick:number,owner:CombatantState|undefined,amount:number) {
    if(!owner?.alive||!Number.isFinite(amount)||amount<=0)return 0;
    const cost=Math.min(amount,Math.max(0,owner.hp-1));
    if(cost>0){const before=owner.hp;owner.hp-=cost;this.history.push({id:this.nextId++,tick,ownerId:owner.id,kind:'health-cost',amount:cost,hpBefore:before,hpAfter:owner.hp});if(this.history.length>64)this.history.shift();}
    return cost;
  }
  rewind(tick:number,owner:CombatantState|undefined,amount:number,ceiling:number) {
    if(!owner?.alive || !Number.isFinite(amount) || amount<=0 || !Number.isFinite(ceiling))return 0;
    const restored=Math.min(amount,Math.max(0,Math.min(ceiling,owner.maxHP)-owner.hp));
    if(restored>0){const before=owner.hp;owner.hp+=restored;
      this.history.push({id:this.nextId++,tick,ownerId:owner.id,kind:'time-rewind',amount:restored,hpBefore:before,hpAfter:owner.hp});
      if(this.history.length>64)this.history.shift();}
    return restored;
  }
  resolve(tick: number, states: Map<string, CombatantState>, results: readonly DamageResult[], profiles: ReadonlyMap<string, RecoveryProfile>) {
    this.recent = this.recent.filter(e => tick - e.tick < 60);
    for (const [id, profile] of profiles) {
      const owner = states.get(id);
      if (!owner?.alive) continue;
      const hits = results.filter(r => r.outcome === 'applied' && r.appliedDamage > 0 && r.request.source.attackerId === id &&
        r.request.targetId !== id && r.request.source.kind !== 'status' && r.request.source.kind !== 'summon');
      if (!hits.length) continue;
      // One cost per successful ability, including contacts with several targets in the same tick.
      const used = new Set(hits.flatMap(r => r.request.source.kind === 'collision' ? [] : [r.request.source.abilityId]));
      const costFraction = [...used].reduce((n, ability) => n + (profile.costs.get(ability) ?? 0), 0);
      const cost = Math.min(Math.max(0, owner.hp - 1), owner.maxHP * costFraction);
      if (cost > 0) {
        const before = owner.hp; owner.hp -= cost;
        this.history.push({ id: this.nextId++, tick, ownerId: id, kind: 'health-cost', amount: cost, hpBefore: before, hpAfter: owner.hp });
      }
      const d = profile.lifesteal;
      const ratio = Math.min(d.maxRatio, d.baseRatio + d.missingHPRatio * (1 - owner.hp / owner.maxHP) + profile.bonusRatio);
      const budget = Math.max(0, owner.maxHP * d.maxHPPerSecond - this.recent.filter(e => e.ownerId === id).reduce((n, e) => n + e.amount, 0));
      const heal = Math.min(owner.maxHP - owner.hp, budget, hits.reduce((n, r) => n + r.appliedDamage, 0) * ratio * profile.healingMultiplier);
      if (heal > 0) {
        const before = owner.hp; owner.hp += heal;
        this.recent.push({ ownerId: id, tick, amount: heal });
        this.history.push({ id: this.nextId++, tick, ownerId: id, kind: 'lifesteal', amount: heal, hpBefore: before, hpAfter: owner.hp });
      }
    }
    if (this.history.length > 64) this.history.splice(0, this.history.length - 64);
  }
  snapshot() { return structuredClone(this.history); }
}
