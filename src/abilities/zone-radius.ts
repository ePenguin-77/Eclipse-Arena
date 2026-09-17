import type { ZoneSnapshot } from '../contracts/abilities';
/** Shared collision/force/art boundary for a contracting domain. */
export function zoneRadius(z:ZoneSnapshot,tick:number) {
  const progress=Math.max(0,Math.min(1,(tick-z.spawnedTick)/(z.detonatesTick-z.spawnedTick)));
  return z.radius+((z.collapseRadius??z.radius)-z.radius)*progress;
}
