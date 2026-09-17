import type { Vec2 } from './geometry';

export interface ArenaObstacle { id: string; kind: 'circle'; center: Vec2; radius: number; restitution: number }
/** Simulation geometry only; no image or UI dependencies. */
export interface ArenaDefinition { id: string; width: number; height: number; obstacles?: readonly ArenaObstacle[] }
export interface ArenaArtwork {
  floorAssetId: string;
  floorOpacity: number;
  /** Normalized square source region; mapped to the actual obstacle diameter. */
  obstacle?: { assetId: string; crop: { x: number; y: number; size: number } };
}
export interface ArenaVisual { floor: string; accent: string; stone: string; artwork?: ArenaArtwork }
export interface ArenaBlueprint {
  id: string; name: string; description: string; boundary: ArenaDefinition;
  spawnLayouts: Readonly<Record<2 | 3 | 4, readonly Vec2[]>>;
  visual: ArenaVisual;
  supportsDiagnostics: boolean;
}
