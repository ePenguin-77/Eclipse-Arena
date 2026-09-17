import { PHYSICS } from '../config/physics';
import type { Vec2 } from '../contracts/types';
import { dot } from '../math/vector';
import { clampSpeed, normalizeTarget, type PhysicsBody } from './body';

export interface Contact { point: Vec2; normal: Vec2; impactSpeed: number; impulseApplied: boolean }
export function resolveContact(a: PhysicsBody, b: PhysicsBody): Contact | null {
  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;
  const distance = Math.hypot(dx, dy);
  const overlap = a.radius + b.radius - distance;
  if (overlap <= 0) return null;
  // Stable degeneracy rule: exact coincident centers do not consume random state.
  const normal = distance > 0.0001 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };
  const invA = a.immobilized ? 0 : 1 / a.mass;
  const invB = b.immobilized ? 0 : 1 / b.mass;
  if (invA + invB === 0) return null;
  const correction = Math.max(0, overlap - PHYSICS.overlapSlop) * PHYSICS.overlapCorrection / (invA + invB);
  a.position.x -= normal.x * correction * invA;
  a.position.y -= normal.y * correction * invA;
  b.position.x += normal.x * correction * invB;
  b.position.y += normal.y * correction * invB;
  const closingSpeed = dot({ x: a.velocity.x - b.velocity.x, y: a.velocity.y - b.velocity.y }, normal);
  const impulseApplied = closingSpeed > 0;
  if (impulseApplied) {
    const impulse = -(1 + PHYSICS.ballRestitution) * closingSpeed / (invA + invB);
    a.velocity.x += impulse * normal.x * invA;
    a.velocity.y += impulse * normal.y * invA;
    b.velocity.x -= impulse * normal.x * invB;
    b.velocity.y -= impulse * normal.y * invB;
    clampSpeed(a);
    clampSpeed(b);
  }
  // Arcade speed policy is explicit: keep impulse direction, recover class speed.
  normalizeTarget(a);
  normalizeTarget(b);
  return {
    point: { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 },
    normal, impactSpeed: Math.abs(closingSpeed), impulseApplied,
  };
}
