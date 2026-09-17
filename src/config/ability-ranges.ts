import type { AbilityRange } from '../contracts/abilities';

/** Surface-to-surface reach in WU. Tier 0 additionally requires a physics impulse. */
export const ABILITY_RANGE_GAP: Readonly<Record<AbilityRange, number>> = Object.freeze({
  0: 0, 1: 18, 2: 58, 3: 140, 4: 260, 5: 452,
});
export const ABILITY_RANGE_LABEL: Readonly<Record<AbilityRange, string>> = Object.freeze({
  0: 'ชนจริง', 1: 'เฉียดใกล้', 2: 'ประชิดขยาย', 3: 'ระยะกลาง', 4: 'ระยะไกล', 5: 'ระยะไกลสุด',
});
