import type { EntityId } from './entity';
import type { BodyDefinition } from './physics';
import type { CharacterArtwork } from './visual';
import type { PassiveDefinition } from './status';

export interface CharacterKit { passive: PassiveDefinition | null; basic: string; ultimate: string | null }

export interface CharacterVisualDefinition { radius: number; color: string; marker: 'diamond' | 'ring' | 'hexagon'; artwork?: CharacterArtwork; hudBackgroundAssetId?: string; hudBackgroundScaleY?: number; hudScene?: { assetId: string; insetX: number; insetY: number }; auraColor?: string }
export interface CharacterDefinition {
  id: string; name: string; description: string; role: string; gender: 'male' | 'female';
  epithet?: string; discipline?: string; disciplineEn?: string;
  stats: { maxHP: number; damageMultiplier: number; collisionDamageMultiplier?: number };
  physics: BodyDefinition;
  abilityIds: string[];
  kit: CharacterKit;
  visual: CharacterVisualDefinition;
}
export interface CharacterInstance {
  entityId: EntityId; definitionId: string; name: string; description: string; role: string;
  epithet?: string; discipline?: string; disciplineEn?: string;
  stats: CharacterDefinition['stats']; physics: BodyDefinition; abilityIds: string[]; visual: CharacterVisualDefinition; kit: CharacterKit;
}
export interface CharacterSnapshot extends CharacterInstance { status: 'active' | 'defeated'; hp: number | null }
