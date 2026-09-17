import type { Vec2 } from '../contracts/geometry';

/** Earliest normalized time at which a segment enters a circle at the origin. */
export function sweepCircle(from: Vec2, to: Vec2, radius: number): number | null {
  const dx = to.x - from.x, dy = to.y - from.y;
  const c = from.x * from.x + from.y * from.y - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a < 1e-12) return null;
  const b = 2 * (from.x * dx + from.y * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}
