import type { ArenaBlueprint } from '../contracts/arenas';
import type { BodySpawn } from '../physics/body';

export function arenaSpawnPositions(arena: ArenaBlueprint, count: 2 | 3 | 4) {
  return arena.spawnLayouts[count].map(p => ({ x: p.x * arena.boundary.width, y: p.y * arena.boundary.height }));
}
export function validateSpawnSeparation(spawns: readonly BodySpawn[]) {
  for (let i = 0; i < spawns.length; i++) for (let j = i + 1; j < spawns.length; j++) {
    const a = spawns[i]!, b = spawns[j]!;
    if (Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) <= a.radius + b.radius) throw new Error('Arena spawn overlap');
  }
}
