import type { ContactDefense } from '../contracts/abilities';
import type { DamageRequest } from '../contracts/combat';

export const NO_CONTACT_DEFENSE: Readonly<ContactDefense> = { collisionMultiplier: 1, knockbackMultiplier: 1 };
export function validateContactDefense(d: ContactDefense) {
  for (const value of [d.collisionMultiplier, d.knockbackMultiplier, d.wallSlamMultiplier ?? 1])
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid contact defense');
}
export function mitigateContactDamage(hit: DamageRequest, defense?: Readonly<ContactDefense>): DamageRequest {
  const multiplier = hit.source.kind === 'collision' ? defense?.collisionMultiplier :
    hit.source.kind === 'status' && hit.source.statusId === 'wall-slam' ? defense?.wallSlamMultiplier : 1;
  return {...hit,amount:hit.amount*(multiplier??1)};
}
