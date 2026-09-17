import type { AbilityDefinition, AbilityRuntimeSnapshot, UltimateDefinition } from '../contracts/abilities';
import type { CombatSnapshot } from '../contracts/combat';

/** Resource presentation is independent of charging triggers: impacts can also award energy. */
export function ultimateDisplay(definition: UltimateDefinition, presentation?: AbilityDefinition['ultimatePresentation']) {
  if (definition.resource === 'attached-summons') return { kind: 'count', label: 'ภูต', unit: 'ตน' } as const;
  if (presentation?.kind === 'energy' || (!presentation && definition.rules.some(rule => rule.trigger === 'time'))) return { kind: 'charge', label: 'พลัง', unit: '' } as const;
  const singleEvent = definition.rules.length === 1 && definition.rules[0]!.amount === 1;
  const trigger = definition.rules[0]?.trigger;
  const label = presentation?.label ?? definition.counterLabel ?? (singleEvent ? trigger === 'basic-hit' ? 'โจมตีโดน' : trigger === 'passive-proc' ? 'สำเร็จวิชา' : 'สะสมครั้ง' : 'แต้มสะสม');
  return { kind: 'count', label, unit: singleEvent ? 'ครั้ง' : 'แต้ม' } as const;
}

/** Show progress towards one completed mark set without pooling different casters or targets. */
export function ultimateCounter(definition: AbilityDefinition, runtime: AbilityRuntimeSnapshot, owner: string, combat?: CombatSnapshot, finished = false) {
  const statusCounter = definition.ultimatePresentation?.statusCounter;
  const maximum = statusCounter?.maximum ?? runtime.maxCharge!;
  if (finished || runtime.status === 'defeated') return { count: 0, maximum };
  if (!statusCounter) return { count: runtime.charge ?? 0, maximum };
  // The mark system consumes the set immediately; retain its completed display while the ult is armed/casting.
  if ((runtime.charge ?? 0) >= runtime.maxCharge! || runtime.status === 'casting' || runtime.status === 'empowered') return { count: maximum, maximum };
  const ownedMarks = combat?.statuses?.filter(s => s.sourceId === owner && s.targetId !== owner && s.definition.id === statusCounter.statusId && combat.combatants.some(c => c.id === s.targetId && c.alive)) ?? [];
  return { count: Math.min(maximum, Math.max(0, ...ownedMarks.map(s => s.stacks))), maximum };
}
