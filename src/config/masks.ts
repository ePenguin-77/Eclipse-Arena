/** Shared by simulation, skill descriptions and the damage tooltip. Raw damage precedes global scaling. */
export const MASKS_BALANCE = {
  wrathDamage: 18,
  wrathAwakenedDamage: 27,
  sorrowDamage: 18,
  sorrowAwakenedDamage: 20,
  smileDamage: 14,
  smileAwakenedDamage: 18,
  smileReduction: .6,
  smileAwakenedReduction: .7,
  smileRange: 115,
  smileAwakenedRange: 150,
  wrathBraceTicks: 24,
  wrathBraceReduction: .65,
} as const;
