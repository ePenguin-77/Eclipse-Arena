import type { CombatantState, DamageRequest, DamageResult } from '../contracts/combat';

/** All attackers alive at tick start may deal damage, including mutual lethal hits. */
export function resolveDamageBatch(states: Map<string, CombatantState>, requests: readonly DamageRequest[]): DamageResult[] {
  const livingAtStart = new Set([...states.values()].filter(s => s.alive).map(s => s.id));
  return requests.map(request => {
    const target = states.get(request.targetId);
    const attacker = states.get(request.source.attackerId);
    const result: DamageResult = { request: structuredClone(request), hpBefore: target?.hp ?? 0, hpAfter: target?.hp ?? 0,
      appliedDamage: 0, defeated: false, outcome: 'applied' };
    if (!Number.isFinite(request.amount) || (request.amount <= 0 && !(request.dodged && request.amount===0)) || !Number.isInteger(request.tick) || request.tick < 0 ||
      !['collision', 'melee', 'projectile', 'area', 'summon', 'status'].includes(request.source.kind) || request.source.attackerId === request.targetId ||
      (request.source.kind === 'summon' && !request.source.summonId) ||
      (request.source.kind !== 'collision' && !request.source.abilityId) || (request.source.kind === 'projectile' && !request.source.projectileId) ||
      (request.source.kind === 'status' && !request.source.statusId) || (request.source.kind === 'area' && !request.source.areaId)) {
      result.outcome = 'invalid-request';
    } else if (!target || !attacker) result.outcome = 'unknown-entity';
    else if (!livingAtStart.has(attacker.id)) result.outcome = 'source-defeated';
    else if (!target.alive) result.outcome = 'target-defeated';
    else if (request.dodged) result.outcome = 'dodged';
    else {
      result.appliedDamage = Math.min(target.hp, request.amount);
      target.hp = Math.max(0, target.hp - result.appliedDamage);
      target.alive = target.hp > 0;
      result.hpAfter = target.hp;
      result.defeated = !target.alive;
    }
    return result;
  });
}
