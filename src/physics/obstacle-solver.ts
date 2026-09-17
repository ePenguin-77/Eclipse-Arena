import type { ArenaObstacle } from '../contracts/arenas';
import type { Vec2 } from '../contracts/geometry';
import { sweepCircle } from '../math/sweep-circle';
import { clampSpeed, normalizeTarget, type PhysicsBody } from './body';

/** Infinite-mass circular obstacle. Optional sweep preserves grazing/high-speed contacts. */
export function resolveObstacle(body: PhysicsBody, obstacle: ArenaObstacle, from?: Vec2, dt = 0) {
  const radius = body.radius + obstacle.radius;
  const destination = { ...body.position };
  let dx = body.position.x - obstacle.center.x, dy = body.position.y - obstacle.center.y;
  let distance = Math.hypot(dx, dy);
  const t = from ? sweepCircle({ x: from.x - obstacle.center.x, y: from.y - obstacle.center.y }, { x: dx, y: dy }, radius) : null;
  if (distance >= radius && t === null) return null;
  if (from && t !== null && t > 0) {
    body.position = { x: from.x + (body.position.x - from.x) * t, y: from.y + (body.position.y - from.y) * t };
    dx = body.position.x - obstacle.center.x; dy = body.position.y - obstacle.center.y; distance = Math.hypot(dx, dy);
  }
  const speed = Math.hypot(body.velocity.x, body.velocity.y);
  const normal = distance > 1e-8 ? { x: dx / distance, y: dy / distance } : speed > 0
    ? { x: -body.velocity.x / speed, y: -body.velocity.y / speed } : { x: 1, y: 0 };
  const inward = body.velocity.x * normal.x + body.velocity.y * normal.y;
  if (distance >= radius - 1e-8 && inward >= -1e-8) { body.position = destination; return null; }
  body.position = { x: obstacle.center.x + normal.x * (radius + 1e-7), y: obstacle.center.y + normal.y * (radius + 1e-7) };
  if (inward >= -1e-8) return null;
  const restitution = body.restitution * obstacle.restitution;
  body.velocity.x -= (1 + restitution) * inward * normal.x;
  body.velocity.y -= (1 + restitution) * inward * normal.y;
  clampSpeed(body); normalizeTarget(body);
  if (from && t !== null && t > 0) {
    body.position.x += body.velocity.x * dt * (1 - t);
    body.position.y += body.velocity.y * dt * (1 - t);
  }
  return { obstacleId: obstacle.id, point: { x: obstacle.center.x + normal.x * obstacle.radius, y: obstacle.center.y + normal.y * obstacle.radius },
    normal, impactSpeed: -inward, impulseApplied: true };
}
