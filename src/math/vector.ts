import type { Vec2 } from '../contracts/types';

export const magnitude = (v: Vec2) => Math.hypot(v.x, v.y);
export const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export const unit = (v: Vec2): Vec2 => {
  const speed = magnitude(v);
  return speed > 0.0001 ? { x: v.x / speed, y: v.y / speed } : { x: 1, y: 0 };
};
export const atSpeed = (v: Vec2, speed: number): Vec2 => {
  const direction = unit(v);
  return { x: direction.x * speed, y: direction.y * speed };
};
