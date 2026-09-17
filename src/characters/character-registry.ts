import type { CharacterDefinition } from '../contracts/characters';
import { validateBodyDefinition } from '../physics/body';
import { validatePassive } from '../combat/status-world';

export class CharacterRegistry {
  private definitions = new Map<string, CharacterDefinition>();
  private abilityIds: Set<string>;
  constructor(definitions: readonly CharacterDefinition[], abilityIds: readonly string[]) {
    this.abilityIds = new Set(abilityIds);
    definitions.forEach(d => this.register(d));
  }
  register(definition: CharacterDefinition) {
    const d = definition;
    if (!d.id.trim() || this.definitions.has(d.id) || !d.name.trim() || !d.role.trim() || !d.description.trim() || !['male', 'female'].includes(d.gender) ||
      !Number.isFinite(d.stats.maxHP) || d.stats.maxHP <= 0 || d.stats.maxHP > 10000 ||
      !Number.isFinite(d.stats.damageMultiplier) || d.stats.damageMultiplier <= 0 ||
      !Number.isFinite(d.visual.radius) || d.visual.radius <= 0 || !/^#[\da-f]{6}$/i.test(d.visual.color) ||
      !['diamond', 'ring', 'hexagon'].includes(d.visual.marker) || new Set(d.abilityIds).size !== d.abilityIds.length ||
      d.abilityIds.some(id => !this.abilityIds.has(id))) throw new Error(`Invalid character definition: ${d.id}`);
    validateBodyDefinition(d.physics);
    if (d.stats.collisionDamageMultiplier!==undefined && (!Number.isFinite(d.stats.collisionDamageMultiplier)||d.stats.collisionDamageMultiplier<0||d.stats.collisionDamageMultiplier>10)) throw new Error('Invalid collision damage multiplier');
    if ([d.epithet, d.discipline, d.disciplineEn].some(value => value !== undefined && (typeof value !== 'string' || !value.trim()))) throw new Error('Invalid character identity');
    if (!d.kit || !Object.hasOwn(d.kit, 'passive') || !Object.hasOwn(d.kit, 'ultimate') || !d.kit.basic || d.kit.ultimate === d.kit.basic ||
      (d.kit.ultimate !== null && typeof d.kit.ultimate !== 'string') || d.kit.passive === undefined ||
      JSON.stringify(d.abilityIds) !== JSON.stringify([d.kit.basic, ...(d.kit.ultimate ? [d.kit.ultimate] : [])])) throw new Error('Invalid character skill slots');
    if (d.kit.passive) validatePassive(d.kit.passive);
    const aura = d.kit.passive?.aura;
    if (aura && (!aura.clipId.trim() || !Number.isFinite(aura.sizeScale) || aura.sizeScale <= 0 || !Number.isFinite(aura.opacity) || aura.opacity <= 0 || aura.opacity > 1.5)) throw new Error('Invalid passive aura');
    if (d.visual.auraColor !== undefined && !/^#[\da-f]{6}$/i.test(d.visual.auraColor)) throw new Error(`Invalid aura color: ${d.id}`);
    if (d.visual.hudBackgroundAssetId !== undefined && !d.visual.hudBackgroundAssetId.trim()) throw new Error(`Invalid HUD artwork: ${d.id}`);
    if (d.visual.hudBackgroundScaleY !== undefined && (!Number.isFinite(d.visual.hudBackgroundScaleY) || d.visual.hudBackgroundScaleY < 1 || d.visual.hudBackgroundScaleY > 2)) throw new Error(`Invalid HUD artwork scale: ${d.id}`);
    const art = d.visual.artwork;
    if (art && (!art.assetId.trim() || ![art.width, art.height].every(v => Number.isFinite(v) && v > 0) ||
      ![art.anchor.x, art.anchor.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1) ||
      ![art.offset.x, art.offset.y].every(Number.isFinite) || !['mirror', 'fixed'].includes(art.facing))) throw new Error(`Invalid character artwork: ${d.id}`);
    const crop = art?.portrait; const thumbnail=art?.cataloguePortrait; if(thumbnail&&(![thumbnail.x,thumbnail.y,thumbnail.size].every(Number.isFinite)||thumbnail.x<0||thumbnail.y<0||thumbnail.size<=0||thumbnail.x+thumbnail.size>1||thumbnail.y+thumbnail.size>1))throw new Error(`Invalid catalogue crop: ${d.id}`);
    if (art?.showcaseScale !== undefined && (!Number.isFinite(art.showcaseScale) || art.showcaseScale < 1 || art.showcaseScale > 2)) throw new Error(`Invalid showcase scale: ${d.id}`);
    if (art?.showcaseOffsetY !== undefined && (!Number.isFinite(art.showcaseOffsetY) || Math.abs(art.showcaseOffsetY) > .2)) throw new Error(`Invalid showcase offset: ${d.id}`);
    if (crop && (![crop.x, crop.y, crop.size].every(Number.isFinite) || crop.x < 0 || crop.y < 0 || crop.size <= 0 || crop.x + crop.size > 1 || crop.y + crop.size > 1)) throw new Error(`Invalid portrait crop: ${d.id}`);
    this.definitions.set(d.id, structuredClone(d));
  }
  get(id: string): CharacterDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`Unknown character: ${id}`);
    return structuredClone(definition);
  }
  list() { return [...this.definitions.values()].map(d => structuredClone(d)); }
}
