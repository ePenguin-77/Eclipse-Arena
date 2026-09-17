import type { ArenaBlueprint, ArenaDefinition } from '../contracts/arenas';
import type { Vec2 } from '../contracts/geometry';

export function validateBoundary(arena: ArenaDefinition) {
  if (!arena.id || !Number.isFinite(arena.width) || !Number.isFinite(arena.height) || arena.width <= 0 || arena.height <= 0) throw new Error('Invalid arena boundary');
  const ids = new Set<string>();
  for (const o of arena.obstacles ?? []) {
    if (!o.id || ids.has(o.id) || o.kind !== 'circle' || !Number.isFinite(o.radius) || o.radius <= 0 ||
      !Number.isFinite(o.restitution) || o.restitution < 0 || o.restitution > 1 ||
      !Number.isFinite(o.center.x) || !Number.isFinite(o.center.y) ||
      o.center.x - o.radius <= 0 || o.center.x + o.radius >= arena.width ||
      o.center.y - o.radius <= 0 || o.center.y + o.radius >= arena.height) throw new Error('Invalid arena obstacle');
    ids.add(o.id);
  }
  const obstacles = arena.obstacles ?? [];
  for (let i = 0; i < obstacles.length; i++) for (let j = i + 1; j < obstacles.length; j++) {
    const a = obstacles[i]!, b = obstacles[j]!;
    if (Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y) <= a.radius + b.radius) throw new Error('Overlapping arena obstacles');
  }
}
export function clearOfArena(arena: ArenaDefinition, position: Vec2, radius: number) {
  return Number.isFinite(radius) && radius > 0 && Number.isFinite(position.x) && Number.isFinite(position.y) &&
    position.x >= radius && position.x <= arena.width - radius && position.y >= radius && position.y <= arena.height - radius &&
    (arena.obstacles ?? []).every(o => Math.hypot(position.x - o.center.x, position.y - o.center.y) >= radius + o.radius);
}
export class ArenaRegistry {
  private definitions = new Map<string, ArenaBlueprint>();
  constructor(blueprints: readonly ArenaBlueprint[]) {
    for (const data of blueprints) {
      validateBoundary(data.boundary);
      if (!data.id || this.definitions.has(data.id) || data.id !== data.boundary.id || !data.name || !data.description ||
        typeof data.supportsDiagnostics !== 'boolean' || [data.visual.floor, data.visual.accent, data.visual.stone].some(c => !/^#[0-9a-f]{6}$/i.test(c))) throw new Error('Invalid arena definition');
      const art = data.visual.artwork;
      if (art) {
        if (!art.floorAssetId || !Number.isFinite(art.floorOpacity) || art.floorOpacity < 0 || art.floorOpacity > 1) throw new Error('Invalid arena artwork');
        if (art.obstacle) {
          const { x, y, size } = art.obstacle.crop;
          if (!art.obstacle.assetId || ![x, y, size].every(Number.isFinite) || x < 0 || y < 0 || size <= 0 || x + size > 1 || y + size > 1) throw new Error('Invalid arena artwork crop');
        }
      }
      for (const count of [2, 3, 4] as const) {
        const layout = data.spawnLayouts[count];
        if (!layout || layout.length !== count || layout.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x <= 0 || p.x >= 1 || p.y <= 0 || p.y >= 1)) throw new Error('Invalid arena spawn layout');
      }
      this.definitions.set(data.id, structuredClone(data));
    }
  }
  get(id: string): ArenaBlueprint {
    const data = this.definitions.get(id); if (!data) throw new Error(`Unknown arena: ${id}`);
    return structuredClone(data);
  }
  list() { return [...this.definitions.values()].map(d => structuredClone(d)); }
}
