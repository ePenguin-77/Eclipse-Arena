import { PHYSICS } from '../config/physics';
import type { ArenaDefinition, Vec2, WallSide } from '../contracts/types';
import { unit } from '../math/vector';
import { clampSpeed, normalizeTarget, type PhysicsBody } from './body';

export interface WallHit { wall: WallSide; point: Vec2; normal: Vec2; impactSpeed: number }
export function resolveWalls(body: PhysicsBody, arena: ArenaDefinition): WallHit | null {
  const sides: WallSide[] = [];
  const normal = { x: 0, y: 0 };
  const point = { ...body.position };
  let impactSpeed = 0;
  const restitution = body.restitution * PHYSICS.wallRestitution;
  const hit = (wall: WallSide, nx: number, ny: number, px: number, py: number, speed: number) => {
    sides.push(wall); normal.x += nx; normal.y += ny;
    point.x = px; point.y = py; impactSpeed = Math.max(impactSpeed, speed);
  };
  if (body.position.x < body.radius) {
    body.position.x = body.radius;
    if (body.velocity.x < 0) {
      body.velocity.x = -body.velocity.x * restitution;
      hit('left', 1, 0, 0, body.position.y, Math.abs(body.velocity.x));
    }
  } else if (body.position.x > arena.width - body.radius) {
    body.position.x = arena.width - body.radius;
    if (body.velocity.x > 0) {
      body.velocity.x = -body.velocity.x * restitution;
      hit('right', -1, 0, arena.width, body.position.y, Math.abs(body.velocity.x));
    }
  }
  if (body.position.y < body.radius) {
    body.position.y = body.radius;
    if (body.velocity.y < 0) {
      body.velocity.y = -body.velocity.y * restitution;
      hit('top', 0, 1, body.position.x, 0, Math.abs(body.velocity.y));
    }
  } else if (body.position.y > arena.height - body.radius) {
    body.position.y = arena.height - body.radius;
    if (body.velocity.y > 0) {
      body.velocity.y = -body.velocity.y * restitution;
      hit('bottom', 0, -1, body.position.x, arena.height, Math.abs(body.velocity.y));
    }
  }
  if (!sides.length) return null;
  clampSpeed(body);
  normalizeTarget(body);
  return { wall: sides.length > 1 ? 'corner' : sides[0]!, point, normal: unit(normal), impactSpeed };
}
