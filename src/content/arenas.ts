import type { ArenaBlueprint } from '../contracts/arenas';
import { ARENA } from '../config/physics';

const layouts: ArenaBlueprint['spawnLayouts'] = {
  2: [{ x: 0.25, y: 0.45 }, { x: 0.75, y: 0.55 }],
  3: [{ x: 0.5, y: 0.22 }, { x: 0.22, y: 0.72 }, { x: 0.78, y: 0.72 }],
  4: [{ x: 0.24, y: 0.24 }, { x: 0.76, y: 0.24 }, { x: 0.24, y: 0.76 }, { x: 0.76, y: 0.76 }],
};
export const ARENAS: readonly ArenaBlueprint[] = [
  { id: 'baseline', name: 'ลานเมฆาคราม', description: 'ลานเปิดเหนือเมฆ · พื้นที่อิสระสำหรับประชันวิชา', boundary: { ...ARENA }, spawnLayouts: structuredClone(layouts),
    visual: { floor: '#17262d', accent: '#a7a087', stone: '#345456', artwork: { floorAssetId: 'cloud-court-v1', floorOpacity: 0.72 } }, supportsDiagnostics: true },
  { id: 'jade-pillar', name: 'ลานผนึกหยก', description: 'แท่นหยกกลางลาน · บอลชนแล้วเด้ง กระสุนหยุดที่แท่น',
    boundary: { id: 'jade-pillar', width: 472, height: 654, obstacles: [{ id: 'jade-seal', kind: 'circle', center: { x: 236, y: 327 }, radius: 54, restitution: 1 }] },
    spawnLayouts: structuredClone(layouts), visual: { floor: '#152a29', accent: '#8aa995', stone: '#3f7168',
      artwork: { floorAssetId: 'jade-court-v1', floorOpacity: 0.72, obstacle: { assetId: 'jade-seal-v1', crop: { x: 0.034, y: 0.034, size: 0.932 } } } }, supportsDiagnostics: false },
];
