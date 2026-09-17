import type { Vec2 } from './geometry';

export type CharacterVisualState = 'idle' | 'moving' | 'casting' | 'hit' | 'defeated';
export interface CharacterArtwork {
  assetId: string;
  /** Transparent themed background registered to the original portrait canvas. */
  auraAssetId?: string;
  width: number;
  height: number;
  anchor: Vec2;
  offset: Vec2;
  facing: 'mirror' | 'fixed';
  portrait?: { x: number; y: number; size: number };
  /** Optional HUD framing, independent of ball and roster crop. */
  hudPortrait?: { x: number; y: number; size: number };
  cataloguePortrait?: { x: number; y: number; size: number };
  /** Uniform framing for the selection showcase; independent of portrait crop and collision size. */
  showcaseScale?: number;
  showcaseOffsetY?: number;
}
