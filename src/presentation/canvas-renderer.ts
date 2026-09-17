import {renderAutomatons} from './automaton-renderer';
import {renderMasks} from './masks-renderer';
import {renderRetrace} from './retrace-renderer';
import {renderCrystals} from './crystal-renderer';
import { renderPortals } from './portal-renderer';
import { renderTime, renderTimeMarks } from './time-renderer';
import { renderLantern } from './lantern-renderer';
import { renderFeathers } from './feather-renderer';
import { renderDreams,renderDreamSleep } from './dream-renderer';
import { renderScribe, renderScribeBadge } from './scribe-renderer';
import { renderThreads } from './thread-renderer';
import { renderBeams } from './beam-renderer';
import { renderBell } from './bell-renderer';
import { renderGo } from './go-renderer';
import type { Vec2, WorldSnapshot } from '../contracts/types';
import { renderAbilityDebug } from './ability-renderer';
import { characterColor, characterVisualRadius } from './character-view';
import { ImageCache } from './image-cache';
import { drawCharacterArtwork, portraitSourceRect } from './character-artwork';
import type { VisualPreview } from './character-animation';
import type { VfxDefinition } from '../contracts/vfx';
import { VfxRenderer } from './vfx/renderer';
import { sampleVfx } from './vfx/cues';
import { drawArena } from './arena-renderer';
import type { ArenaVisual } from '../contracts/arenas';

export { BODY_COLORS } from './character-view';
export interface ViewOptions { hitboxes: boolean; velocity: boolean; normals: boolean; trails: boolean; visualScale: number; artwork: boolean; visualPreview: VisualPreview; vfx: boolean; reducedVfx: boolean; arenaArtwork?: boolean; arenaMeasurements?: boolean }
export const DEFAULT_VIEW: ViewOptions = { hitboxes: false, velocity: false, normals: false, trails: false, visualScale: 1, artwork: true, visualPreview: 'match', vfx: true, reducedVfx: false, arenaArtwork: true };

export class CanvasRenderer {
  private images: ImageCache;
  private vfx: VfxRenderer;
  constructor(sources: Readonly<Record<string, string>> = {}, vfx: VfxDefinition = { clips: [], abilities: [] }, private readonly arenaVisuals: Readonly<Record<string, ArenaVisual>> = {}) {
    this.images = new ImageCache(sources); this.vfx = new VfxRenderer(this.images, vfx);
  }
  private trails = new Map<string, Vec2[]>();
  private lastTick = -1;
  clear() { this.trails.clear(); this.lastTick = -1; }

  render(canvas: HTMLCanvasElement, world: WorldSnapshot, view: ViewOptions, alpha = 1) {
    const context = canvas.getContext('2d');
    if (!context) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    this.vfx.preload();
    const cues = view.vfx ? sampleVfx(world, this.vfx.definition, alpha) : [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelsW = Math.round(width * dpr);
    const pixelsH = Math.round(height * dpr);
    if (canvas.width !== pixelsW || canvas.height !== pixelsH) { canvas.width = pixelsW; canvas.height = pixelsH; }
    if (world.tick < this.lastTick) this.clear();
    if (world.tick !== this.lastTick) {
      for (const event of world.abilities?.events ?? []) {
        if (event.kind === 'decoy-swap' && event.tick > this.lastTick && event.tick <= world.tick) this.trails.delete(event.ownerId);
      }
      for (const body of world.bodies) {
        if (world.combat?.combatants.find(c => c.id === body.id)?.alive === false) { this.trails.delete(body.id); continue; }
        const trail = this.trails.get(body.id) ?? [];
        trail.push({ ...body.position });
        if (trail.length > 42) trail.shift();
        this.trails.set(body.id, trail);
      }
      this.lastTick = world.tick;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const padding = view.arenaMeasurements === false && !view.hitboxes ? 16 : 76;
    const scale = Math.min(width / (world.arena.width + padding), height / (world.arena.height + padding));
    const left = (width - world.arena.width * scale) / 2;
    const top = (height - world.arena.height * scale) / 2;
    context.setTransform(dpr * scale, 0, 0, dpr * scale, left * dpr, top * dpr);
    const { width: w, height: h } = world.arena;
    drawArena(context, world.arena, this.arenaVisuals[world.arena.id], view.hitboxes, view.arenaArtwork === false ? undefined : this.images, view.hitboxes || view.arenaMeasurements !== false);
    context.save();
    context.beginPath(); context.rect(0, 0, w, h); context.clip();
    renderAutomatons(context,world,this.images,alpha,view.reducedVfx||!view.vfx,view.vfx);
    if(view.vfx)renderRetrace(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderGo(context,world,this.images,alpha,view.reducedVfx);
    this.vfx.render(context, cues, 'below', view.reducedVfx);
    if(view.vfx)renderBeams(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderBell(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderPortals(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderTime(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderLantern(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderFeathers(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderCrystals(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderDreams(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderThreads(context,world,this.images,alpha,view.reducedVfx);
    if(view.vfx)renderScribe(context,world,this.images,this.vfx.definition,alpha,view.reducedVfx);
    for (const d of world.abilities?.decoys ?? []) {
      const character = world.characters.find(c=>c.entityId===d.ownerId), art = character?.visual.artwork;
      const image = art && view.artwork ? this.images.get(art.assetId) : null;
      context.save(); context.translate(d.position.x,d.position.y);
      context.globalAlpha = .65; context.fillStyle = '#9d85dd';
      context.beginPath(); context.arc(0,0,d.radius,0,Math.PI*2); context.fill();
      if (image && art) {
        const crop = portraitSourceRect(art,image.naturalWidth,image.naturalHeight);
        context.save(); context.clip();
        context.drawImage(image,crop.x,crop.y,crop.width,crop.height,-d.radius,-d.radius,d.radius*2,d.radius*2);
        context.restore();
      }
      context.globalAlpha = .9; context.strokeStyle='#ded1ff'; context.lineWidth=1.5; context.setLineDash([]); context.stroke();
      context.restore();
    }
    for (const s of world.abilities?.summons ?? []) {
      const owner = world.bodies.find(b => b.id === s.ownerId);
      if (!owner || s.attachedTo) continue;
      const x = s.previousPosition.x + (s.position.x - s.previousPosition.x) * alpha, y = s.previousPosition.y + (s.position.y - s.previousPosition.y) * alpha;
      context.strokeStyle = world.characters.find(c => c.entityId === s.ownerId)?.visual.color ?? '#f4b2cf';
      context.globalAlpha = .2; context.lineWidth = 1; context.setLineDash([3, 7]);
      context.beginPath(); context.moveTo(owner.previousPosition.x + (owner.position.x - owner.previousPosition.x) * alpha, owner.previousPosition.y + (owner.position.y - owner.previousPosition.y) * alpha);
      context.lineTo(x, y); context.stroke(); context.setLineDash([]); context.globalAlpha = 1;
    }
    context.restore();
    for (let index = 0; index < world.bodies.length; index++) {
      const body = world.bodies[index]!;
      const defeated = world.combat?.combatants.find(c => c.id === body.id)?.alive === false;
      const character = world.characters.find(c => c.entityId === body.id);
      const artwork = view.artwork ? character?.visual.artwork : undefined;
      if (defeated) {
        if (artwork) {
          drawCharacterArtwork(context, this.images, world, body, artwork, characterVisualRadius(world.characters, body.id, view.visualScale), characterColor(world.characters, body.id, index), 'match');
        }
        continue;
      }
      const color = characterColor(world.characters, body.id, index);
      if (view.trails) {
        const points = this.trails.get(body.id) ?? [];
        for (let i = 1; i < points.length; i++) {
          context.globalAlpha = i / points.length * 0.3;
          context.strokeStyle = color; context.lineWidth = 2;
          context.beginPath(); context.moveTo(points[i - 1]!.x, points[i - 1]!.y); context.lineTo(points[i]!.x, points[i]!.y); context.stroke();
        }
        context.globalAlpha = 1;
      }
      const { x, y } = body.position;
      const radius = characterVisualRadius(world.characters, body.id, view.visualScale);
      const drawn = artwork && drawCharacterArtwork(context, this.images, world, body, artwork, radius, color, view.visualPreview);
      if (!drawn) {
        const fill = context.createRadialGradient(x - radius * 0.3, y - radius * 0.35, 1, x, y, radius);
        fill.addColorStop(0, color); fill.addColorStop(0.3, color); fill.addColorStop(1, '#243d43');
        context.shadowColor = color + '40'; context.shadowBlur = 12;
        context.fillStyle = fill;
        context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
        context.shadowBlur = 0; context.strokeStyle = color; context.lineWidth = 1.3; context.stroke();
        if (character) {
          context.beginPath();
          if (character.visual.marker === 'ring') context.arc(x, y, radius + 5, 0, Math.PI * 2);
          else {
            const points = character.visual.marker === 'diamond' ? 4 : 6;
            for (let vertex = 0; vertex < points; vertex++) {
              const angle = vertex * Math.PI * 2 / points - Math.PI / 2;
              const px = x + Math.cos(angle) * (radius + 6), py = y + Math.sin(angle) * (radius + 6);
              if (vertex === 0) context.moveTo(px, py); else context.lineTo(px, py);
            }
            context.closePath();
          }
          context.stroke();
        }
        context.fillStyle = '#0a2028'; context.textAlign = 'center'; context.textBaseline = 'middle';
        context.font = 'bold 20px Consolas, monospace'; context.fillText(String.fromCharCode(65 + index), x, y);
        context.textBaseline = 'alphabetic';
      }
      if (view.hitboxes) {
        context.globalAlpha = 1;
        context.strokeStyle = '#102028'; context.lineWidth = 3.5;
        context.beginPath(); context.arc(x, y, body.radius, 0, Math.PI * 2); context.stroke();
        context.strokeStyle = drawn ? '#79edff' : '#f7d99b'; context.lineWidth = drawn ? 2 : 1.2; context.setLineDash([4, 4]);
        context.beginPath(); context.arc(x, y, body.radius, 0, Math.PI * 2); context.stroke(); context.setLineDash([]);
        context.fillStyle = '#f7d99b'; context.fillRect(x - 2, y - 2, 4, 4);
      }
      if (view.velocity) this.arrow(context, body.position, { x: x + body.velocity.x * 0.16, y: y + body.velocity.y * 0.16 }, color);
    }
    context.save();
    context.beginPath(); context.rect(0, 0, w, h); context.clip();
    if(view.vfx)renderTimeMarks(context,world,this.images,alpha,view.reducedVfx);
    if (view.vfx) this.vfx.render(context, cues, 'above', view.reducedVfx);
    else renderAbilityDebug(context, world);
    for (const s of world.abilities?.summons ?? []) {
      const x = s.previousPosition.x + (s.position.x - s.previousPosition.x) * alpha, y = s.previousPosition.y + (s.position.y - s.previousPosition.y) * alpha;
      context.strokeStyle = world.tick < s.empoweredUntil ? '#ffe4a0' : '#f4b2cf'; context.lineWidth = 1;
      if (view.hitboxes || !view.vfx) { context.beginPath(); context.arc(x, y, s.radius, 0, Math.PI * 2); context.stroke(); }
      if (s.impactsRemaining !== undefined) {
        if (s.attachedTo) for (let pip = 0; pip < s.impactsToDispel!; pip++) {
          context.fillStyle = s.impactsRemaining > pip ? '#ffd7e9' : '#392235';
          context.fillRect(x - s.impactsToDispel! * 2.5 + pip * 5, y + 9, 4, 2);
        }
        continue;
      }
      context.fillStyle = '#24152de0'; context.fillRect(x - 12, y + 17, 24, 13);
      context.font = 'bold 10px Tahoma'; context.textAlign = 'center'; context.fillStyle = '#ffe3ed';
      context.fillText(String(Math.ceil(s.hp!)), x, y + 27);
    }
    context.restore();
    if (view.hitboxes) for (const p of world.abilities?.projectiles ?? []) {
      context.strokeStyle = '#79edff'; context.lineWidth = 1; context.setLineDash([2, 3]);
      context.beginPath(); context.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2); context.stroke(); context.setLineDash([]);
    }
    if (view.normals) {
      for (const event of world.events) {
        const age = (world.tick - event.tick) / 60;
        if (age > 0.55) continue;
        context.globalAlpha = 1 - age / 0.55;
        this.arrow(context, event.point, { x: event.point.x + event.normal.x * 50, y: event.point.y + event.normal.y * 50 }, '#f7d99b');
        context.beginPath(); context.arc(event.point.x, event.point.y, 7 + age * 22, 0, Math.PI * 2); context.stroke();
      }
      context.globalAlpha = 1;
    }
    if(view.vfx)renderScribeBadge(context,world,this.images,view.visualScale);
    renderMasks(context,world,this.images,view.visualScale,alpha);
    if(view.vfx)renderDreamSleep(context,world,this.images,alpha,view.reducedVfx);
    // Keep health readable above effects without coupling it to the collision body.
    const healthBadge = this.images.get('jade-hp-badge-v1');
    context.save();
    context.textAlign = 'center'; context.textBaseline = 'middle';
    for (let index = 0; index < world.bodies.length; index++) {
      const body = world.bodies[index]!;
      const fighter = world.combat?.combatants.find(c => c.id === body.id);
      if (!fighter) continue;
      const hp = String(Math.ceil(Math.max(0, fighter.hp)));
      const radius = characterVisualRadius(world.characters, body.id, view.visualScale);
      const badgeHeight = Math.min(radius * .55, Math.max(19, 12 / scale));
      const fontSize = Math.min(radius * .4, Math.max(13, 10 / scale));
      context.font = `bold ${fontSize}px Consolas, monospace`;
      const badgeWidth = Math.min(radius * 1.5, Math.max(36, context.measureText(hp).width + 14));
      // Inset the bottom corners along the circle, keeping the whole badge inside the portrait.
      const innerRadius = radius * .92;
      const bottom = Math.sqrt(innerRadius ** 2 - (badgeWidth / 2) ** 2);
      const x = body.position.x - badgeWidth / 2;
      const y = body.position.y + bottom - badgeHeight;
      if (healthBadge) {
        context.save();
        context.beginPath(); context.roundRect(x, y, badgeWidth, badgeHeight, Math.min(5, badgeHeight / 3)); context.clip();
        if (!fighter.alive) context.filter = 'grayscale(1) brightness(.7)';
        // The generated plaque has empty outer margins; sample only its painted frame.
        context.drawImage(healthBadge, healthBadge.naturalWidth * .004, healthBadge.naturalHeight * .112,
          healthBadge.naturalWidth * .992, healthBadge.naturalHeight * .70, x, y, badgeWidth, badgeHeight);
        context.restore();
      } else {
        // Health remains legible while the image loads or if the asset is unavailable.
        context.fillStyle = '#0e222bea'; context.strokeStyle = '#bca36b'; context.lineWidth = 1 / scale;
        context.beginPath(); context.roundRect(x, y, badgeWidth, badgeHeight, 5); context.fill(); context.stroke();
      }
      context.fillStyle = fighter.alive ? '#fff4d9' : '#9ba9ad';
      context.fillText(hp, x + badgeWidth / 2, y + badgeHeight / 2 + .5, badgeWidth - 6);
    }
    context.restore();
  }
  private arrow(context: CanvasRenderingContext2D, from: Vec2, to: Vec2, color: string) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    context.strokeStyle = color; context.lineWidth = 1.8;
    context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y);
    context.moveTo(to.x - Math.cos(angle - 0.5) * 8, to.y - Math.sin(angle - 0.5) * 8); context.lineTo(to.x, to.y);
    context.lineTo(to.x - Math.cos(angle + 0.5) * 8, to.y - Math.sin(angle + 0.5) * 8); context.stroke();
  }
}
