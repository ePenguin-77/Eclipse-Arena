import type { Vec2 } from './geometry';

/** Render-only data. A sprite's dimensions never define a damage area. */
export interface VfxClip {
  fixedOrientation?: boolean;
  noTrail?: boolean;
  id: string;
  assetId: string;
  /** Extra atlas pages, in playback order, with the same grid as the first. */
  additionalAssetIds?: readonly string[];
  /** Independent overlay; its animation never changes the base sprite. */
  overlayClipId?: string;
  spriteScale?: number;
  /** Fixed copies of one generated image; avoids silhouette drift between atlas frames. */
  radial?: { count: number; radius: number; scale: number; convergeAfter?: number; pointInward?: boolean };
  aspectRatio?: number;
  columns: number;
  rows: number;
  frameMs: readonly number[];
  crossfadeMs: number;
  loop: boolean;
  anchor: Vec2;
  /** Per-frame registration for generated atlases whose artwork center drifts. */
  frameAnchors?: readonly Vec2[];
  /** Continuous rotation of generated artwork, independent of atlas frame rate. */
  rotationDegreesPerSecond?: number;
  /** Reflect the left half of each generated frame to keep bilateral auras exactly centered. */
  mirrorLeftHalf?: boolean;
  /** Draw generated aura pixels over the ball only outside its silhouette. */
  outsideBall?: boolean;
}
export interface AbilityVfx {
  tetherClipId?: string;
  abilityId: string;
  color: string;
  release?: { clipId: string; size: number };
  projectile?: { clipId: string; size: number; finisherClipId?: string };
  aura?: { clipId: string; size: number };
  activeAura?: { clipId: string; size: number };
  motion?: { clipId: string; size: number };
  summon?: { clipId: string; size: number; empoweredClipId?: string };
  area?: { clipId: string; artRadiusFraction: number };
  zone?: { clipId: string; detonationClipId: string; artRadiusFraction: number };
  sequence?: { slashClipId: string; finisherClipId: string; telegraphClipId: string; artRadiusFraction: number };
  impact: { clipId: string; size: number };
}
export interface VfxDefinition { clips: readonly VfxClip[]; abilities: readonly AbilityVfx[] }
export interface VfxCue {
  annulus?: {innerRadius:number;outerRadius:number};
  shaftRadius?: number;
  label?: string;
  tether?: { end: Vec2; taut: boolean };
  key: string;
  kind: 'dodge' | 'release' | 'impact' | 'wall' | 'projectile' | 'cast' | 'aura' | 'area' | 'zone' | 'summon';
  point: Vec2;
  angle: number;
  ageMs: number;
  durationMs: number;
  size: number;
  color: string;
  clipId?: string;
  opacity?: number;
  /** Shared area boundary, used only for the missing-art fallback. */
  radius?: number;
  ballRadius?: number;
}
