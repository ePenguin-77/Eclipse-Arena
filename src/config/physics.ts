import type { ArenaDefinition, BodyDefinition } from '../contracts/types';

// Values are documented against the audited AW source in docs/PHYSICS_SPEC.md.
export const ARENA: Readonly<ArenaDefinition> = Object.freeze({ id: 'baseline', width: 472, height: 654 });
export const PHYSICS = Object.freeze({
  fixedDt: 1 / 60,
  ballRestitution: 1,
  wallRestitution: 1,
  overlapCorrection: 0.82,
  overlapSlop: 0.01,
  maxTravelRadiusFraction: 0.4,
  maxCatchUpTicks: 5,
  maxFrameDelta: 0.1,
  eventHistoryLimit: 64,
});
export const NEUTRAL_BODY: Readonly<BodyDefinition> = Object.freeze({
  radius: 34, mass: 1, targetSpeed: 330, minSpeed: 280, maxSpeed: 420, restitution: 1,
});
