import type { SummonDefinition } from '../contracts/summons';
export const BLOSSOM_SPIRIT: SummonDefinition = {
  id: 'blossom-spirit', name: 'ภูตบุปผา', radius: 12, speed: 480,
  lifetimeTicks: 600, attackIntervalTicks: 72, attackRange: 22,
  contactDamage: 5, contactCooldownTicks: 30,
  attachment: { maxCount: 3, impactsToDispel: 4 },
};
