import type { VfxClip, VfxDefinition } from '../../contracts/vfx';

export function validateVfx(definition: VfxDefinition): void {
  const clips = new Set<string>();
  for (const c of definition.clips) {
    const pages = [c.assetId, ...(c.additionalAssetIds ?? [])];
    if (pages.some(id => !id.trim()) || new Set(pages).size !== pages.length) throw new Error('Invalid VFX atlas pages');
    if (!c.id || clips.has(c.id) || !c.assetId || !Number.isInteger(c.columns) || c.columns < 1 ||
      !Number.isInteger(c.rows) || c.rows < 1 || !c.frameMs.length || c.frameMs.length > c.columns * c.rows * pages.length ||
      c.frameMs.some(ms => !Number.isFinite(ms) || ms < 40) || !Number.isFinite(c.crossfadeMs) || c.crossfadeMs < 0 ||
      c.crossfadeMs > Math.min(...c.frameMs) / 2 || typeof c.loop !== 'boolean' ||
      [c.anchor.x, c.anchor.y].some(v => !Number.isFinite(v) || v < 0 || v > 1) ||
      (c.frameAnchors !== undefined && (c.frameAnchors.length !== c.frameMs.length || c.frameAnchors.some(a => [a.x,a.y].some(v => !Number.isFinite(v) || v < 0 || v > 1)))) ||
      (c.mirrorLeftHalf !== undefined && (typeof c.mirrorLeftHalf !== 'boolean' || (c.mirrorLeftHalf && c.anchor.x !== .5))) ||
      (c.outsideBall !== undefined && typeof c.outsideBall !== 'boolean') ||
      (c.noTrail !== undefined && typeof c.noTrail !== 'boolean') ||
      (c.fixedOrientation !== undefined && typeof c.fixedOrientation !== 'boolean') ||
      (c.rotationDegreesPerSecond !== undefined && !Number.isFinite(c.rotationDegreesPerSecond))) throw new Error('Invalid VFX clip');
    if (c.spriteScale !== undefined && (!Number.isFinite(c.spriteScale) || c.spriteScale <= 0 || c.spriteScale > 2)) throw new Error('Invalid VFX sprite scale');
    // Long beam strips use a 12:1 frame; keep a finite bound for atlas validation.
    if (c.aspectRatio !== undefined && (!Number.isFinite(c.aspectRatio) || c.aspectRatio <= 0 || c.aspectRatio > 16)) throw new Error('Invalid VFX aspect ratio');
    if (c.radial && (!Number.isInteger(c.radial.count) || c.radial.count < 2 || c.radial.count > 8 ||
      !Number.isFinite(c.radial.radius) || c.radial.radius <= 0 || c.radial.radius > .5 ||
      !Number.isFinite(c.radial.scale) || c.radial.scale <= 0 || c.radial.scale > 1 ||
      (c.radial.convergeAfter !== undefined && (!Number.isFinite(c.radial.convergeAfter) || c.radial.convergeAfter < 0 || c.radial.convergeAfter >= 1)))) throw new Error('Invalid VFX radial layout');
    clips.add(c.id);
  }
  for (const c of definition.clips) if (c.overlayClipId) {
    const overlay = definition.clips.find(other => other.id === c.overlayClipId);
    if (!overlay || overlay.id === c.id || overlay.overlayClipId) throw new Error('Invalid VFX overlay');
  }
  const abilities = new Set<string>();
  for (const a of definition.abilities) {
    if(a.tetherClipId&&!clips.has(a.tetherClipId))throw new Error('Invalid tether VFX');
    if (!a.abilityId || abilities.has(a.abilityId) || !/^#[0-9a-f]{6}$/i.test(a.color)) throw new Error('Invalid VFX binding');
    for (const effect of [a.release, a.projectile, a.impact, a.aura, a.activeAura, a.motion]) if (effect &&
      (!clips.has(effect.clipId) || !Number.isFinite(effect.size) || effect.size <= 0)) throw new Error('Invalid VFX reference');
    if (a.projectile && !definition.clips.find(c => c.id === a.projectile!.clipId)!.loop) throw new Error('Projectile VFX must loop');
    if (a.projectile?.finisherClipId && !definition.clips.find(c=>c.id===a.projectile!.finisherClipId)?.loop) throw new Error('Finisher projectile VFX must loop');
    if (a.aura && !definition.clips.find(c => c.id === a.aura!.clipId)!.loop) throw new Error('Aura VFX must loop');
    if (a.activeAura && !definition.clips.find(c => c.id === a.activeAura!.clipId)!.loop) throw new Error('Active aura VFX must loop');
    if (a.motion && !definition.clips.find(c=>c.id===a.motion!.clipId)!.loop) throw new Error('Motion VFX must loop');
    if (a.summon && (!Number.isFinite(a.summon.size) || a.summon.size <= 0 ||
      !definition.clips.find(c => c.id === a.summon!.clipId)?.loop || (a.summon.empoweredClipId !== undefined && !definition.clips.find(c => c.id === a.summon!.empoweredClipId)?.loop))) throw new Error('Invalid summon VFX');
    if (a.area && (!clips.has(a.area.clipId) || !Number.isFinite(a.area.artRadiusFraction) || a.area.artRadiusFraction <= 0 || a.area.artRadiusFraction > 0.5)) throw new Error('Invalid area VFX');
    if (a.sequence && (![a.sequence.slashClipId, a.sequence.finisherClipId].every(id => clips.has(id) && !definition.clips.find(c => c.id === id)!.loop) ||
      !definition.clips.find(c => c.id === a.sequence!.telegraphClipId)?.loop || !Number.isFinite(a.sequence.artRadiusFraction) || a.sequence.artRadiusFraction <= 0 || a.sequence.artRadiusFraction > .5)) throw new Error('Invalid sequence VFX');
    if (a.zone && (!clips.has(a.zone.clipId) || !clips.has(a.zone.detonationClipId) ||
      !definition.clips.find(c => c.id === a.zone!.clipId)!.loop || definition.clips.find(c => c.id === a.zone!.detonationClipId)!.loop ||
      !Number.isFinite(a.zone.artRadiusFraction) || a.zone.artRadiusFraction <= 0 || a.zone.artRadiusFraction > .5)) throw new Error('Invalid zone VFX');
    for (const effect of [a.release, a.impact]) if (effect && definition.clips.find(c => c.id === effect.clipId)!.loop) throw new Error('One-shot VFX cannot loop');
    abilities.add(a.abilityId);
  }
}
export const clipDuration = (clip: VfxClip) => clip.frameMs.reduce((sum, ms) => sum + ms, 0);
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Frame holds and a short dissolve are separate from the display's refresh rate. */
export function sampleClip(clip: VfxClip, ageMs: number) {
  const duration = clipDuration(clip);
  if (!Number.isFinite(ageMs) || ageMs < 0 || (!clip.loop && ageMs >= duration)) return null;
  let local = ageMs % duration;
  let frame = 0;
  while (frame < clip.frameMs.length - 1 && local >= clip.frameMs[frame]!) local -= clip.frameMs[frame++]!;
  const next = frame + 1 < clip.frameMs.length ? frame + 1 : clip.loop ? 0 : frame;
  const blend = clip.crossfadeMs && next !== frame
    ? smooth(Math.max(0, (local - clip.frameMs[frame]! + clip.crossfadeMs) / clip.crossfadeMs)) : 0;
  return { frame, next, blend };
}
export function frameRect(clip: VfxClip, frame: number, width: number, height: number) {
  // Half-pixel inset prevents filtering from sampling a neighbouring cell.
  const w = width / clip.columns, h = height / clip.rows;
  const local = frame % (clip.columns * clip.rows);
  return { x: local % clip.columns * w + 0.5, y: Math.floor(local / clip.columns) * h + 0.5, width: w - 1, height: h - 1 };
}

export function frameAssetId(clip: VfxClip, frame: number) {
  return [clip.assetId, ...(clip.additionalAssetIds ?? [])][Math.floor(frame / (clip.columns * clip.rows))]!;
}
