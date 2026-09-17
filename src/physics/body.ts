import type { BodyDefinition, BodySnapshot, EntityId, Vec2 } from '../contracts/types';
import { atSpeed, clamp, magnitude } from '../math/vector';

export interface BodySpawn extends BodyDefinition { id: EntityId; position: Vec2; direction: Vec2 }
export interface PhysicsBody extends BodyDefinition {
  id: EntityId;
  position: Vec2;
  previousPosition: Vec2;
  velocity: Vec2;
  immobilized?: boolean;
}
export function validateBodyDefinition(body: BodyDefinition): void {
  const values = [body.radius, body.mass, body.targetSpeed, body.minSpeed, body.maxSpeed, body.restitution];
  if (!values.every(Number.isFinite) || body.radius <= 0 || body.mass <= 0 || body.minSpeed <= 0 ||
    body.maxSpeed < body.minSpeed || body.targetSpeed < body.minSpeed || body.targetSpeed > body.maxSpeed || body.restitution < 0) throw new Error('Invalid physics body definition');
}
export function createBody(spawn: BodySpawn): PhysicsBody {
  const { direction, ...definition } = spawn;
  validateBodyDefinition(spawn);
  if (![spawn.position.x, spawn.position.y, direction.x, direction.y].every(Number.isFinite)) throw new Error(`Invalid physics spawn: ${spawn.id}`);
  return { ...definition, position: { ...spawn.position }, previousPosition: { ...spawn.position }, velocity: atSpeed(direction, spawn.targetSpeed) };
}
export function normalizeTarget(body: PhysicsBody) {
  if (body.immobilized) { body.velocity = { x: 0, y: 0 }; return; }
  body.velocity = atSpeed(body.velocity, clamp(body.targetSpeed, body.minSpeed, body.maxSpeed));
}
export function clampSpeed(body: PhysicsBody) {
  if (body.immobilized) { body.velocity = { x: 0, y: 0 }; return; }
  const speed = magnitude(body.velocity);
  body.velocity = atSpeed(body.velocity, clamp(speed, body.minSpeed, body.maxSpeed));
}
export function enforceSpeedBand(body: PhysicsBody) {
  const speed = magnitude(body.velocity);
  if (speed < body.minSpeed || speed > body.maxSpeed) normalizeTarget(body);
}
export function snapshotBody(body: PhysicsBody): BodySnapshot {
  return { ...body, position: { ...body.position }, previousPosition: { ...body.previousPosition }, velocity: { ...body.velocity }, speed: magnitude(body.velocity) };
}
