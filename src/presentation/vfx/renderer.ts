import type { VfxClip, VfxCue, VfxDefinition } from '../../contracts/vfx';
import type { ImageCache } from '../image-cache';
import { frameAssetId, frameRect, sampleClip, validateVfx } from './clip';

export interface VfxView { reduced: boolean }

/** One renderer for live skills and the review player. */
export function drawVfxCue(ctx: CanvasRenderingContext2D, images: Pick<ImageCache, 'get'>,
  clips: readonly VfxClip[], cue: VfxCue, view: VfxView) {
  const progress = Number.isFinite(cue.durationMs) ? Math.min(1, cue.ageMs / cue.durationMs) : 0;
  const clip = clips.find(c => c.id === cue.clipId);
  const fade = cue.kind === 'projectile' || cue.kind === 'cast' || cue.kind === 'aura' || cue.kind === 'zone' || cue.kind === 'summon' ? 1 : Math.min(1, (1 - progress) / 0.35);
  ctx.save();
  ctx.translate(cue.point.x, cue.point.y);
  if(cue.kind==='dodge'){
    ctx.globalAlpha=Math.max(0,1-progress);ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#102329';ctx.fillStyle='#fff1ba';
    ctx.strokeText(cue.label??'หลบ',0,-42-progress*16);ctx.fillText(cue.label??'หลบ',0,-42-progress*16);ctx.restore();return;
  }
  ctx.rotate((clip?.fixedOrientation?0:cue.angle) + (view.reduced ? 0 : (clip?.rotationDegreesPerSecond ?? 0) * cue.ageMs * Math.PI / 180000));
  if(cue.annulus){
    ctx.beginPath();ctx.arc(0,0,cue.annulus.outerRadius,0,Math.PI*2);
    ctx.moveTo(cue.annulus.innerRadius,0);ctx.arc(0,0,cue.annulus.innerRadius,0,Math.PI*2);ctx.clip('evenodd');
  }
  if(cue.shaftRadius!==undefined){ctx.beginPath();ctx.rect(-cue.size/2,-cue.shaftRadius,cue.size,cue.shaftRadius*2);ctx.clip();}
  if (clip?.outsideBall && cue.ballRadius) {
    ctx.beginPath(); ctx.rect(-cue.size,-cue.size,cue.size*2,cue.size*2);
    ctx.moveTo(cue.ballRadius+1,0); ctx.arc(0,0,cue.ballRadius+1,0,Math.PI*2); ctx.clip('evenodd');
  }
  ctx.strokeStyle = cue.color; ctx.fillStyle = cue.color;
  if(cue.tether) {
    const dx=cue.tether.end.x-cue.point.x,dy=cue.tether.end.y-cue.point.y,length=Math.hypot(dx,dy);
    const art=clip&&images.get(clip.assetId),n=Math.min(28,Math.max(1,Math.ceil(length/20)));
    ctx.rotate(Math.atan2(dy,dx));
    const amplitude=view.reduced?0:cue.tether.taut?1.2:Math.min(9,length*.06);
    const y=(t:number)=>Math.sin(Math.PI*t)*Math.sin(t*Math.PI*2-cue.ageMs/120)*amplitude;
    ctx.globalAlpha=(cue.opacity??1)*.9;
    for(let i=0;i<n;i++) {
      const t0=i/n,t1=(i+1)/n,x0=t0*length,x1=t1*length,y0=y(t0),y1=y(t1);
      ctx.save();ctx.translate((x0+x1)/2,(y0+y1)/2);ctx.rotate(Math.atan2(y1-y0,x1-x0));
      const size=Math.hypot(x1-x0,y1-y0)/.9+1;
      if(art)ctx.drawImage(art,-size/2,-size/2,size,size);
      else {ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-size/2,0);ctx.lineTo(size/2,0);ctx.stroke();}
      ctx.restore();
    }
    ctx.restore();return;
  }
  // Generated skill artwork carries the normal presentation; range circles belong to debug rendering.
  if (cue.kind === 'cast' && !cue.clipId) {
    ctx.globalAlpha = 0.35 + progress * 0.25; ctx.lineWidth = 1.5;
    const radius = cue.size / 2 * (view.reduced ? 1 : 1.1 - progress * 0.1);
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
    ctx.restore(); return;
  }
  // A narrow moving trail reads direction without filling the arena with bloom.
  if (cue.kind === 'projectile' && !view.reduced && !clip?.noTrail) {
    ctx.globalAlpha = 0.25; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-35, 6 * Math.sin(cue.ageMs / 160), -62, 0); ctx.stroke();
  }
  const sampled = clip && sampleClip(clip, cue.shaftRadius!==undefined?120:view.reduced ? (clip.loop ? 0 : clip.frameMs.slice(0, Math.min(3, clip.frameMs.length - 1)).reduce((a, b) => a + b, 0)) : cue.ageMs);
  const image = clip && images.get(frameAssetId(clip, sampled?.frame ?? 0));
  if (clip && sampled && image) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const growth = cue.shaftRadius!==undefined || view.reduced || cue.kind === 'projectile' || cue.kind === 'cast' || cue.kind === 'aura' || cue.kind === 'area' || cue.kind === 'zone' ? 1 : 0.92 + 0.12 * (1 - Math.pow(1 - progress, 3));
    const size = cue.size * growth * (clip.spriteScale ?? 1);
    const opacity = (cue.kind === 'projectile' ? 0.95 : cue.kind === 'release' ? 0.78 : 0.65) * fade * (view.reduced ? 0.8 : 1) * (cue.opacity ?? 1);
    const draw = (frame: number, weight: number) => {
      if (weight <= 0) return;
      const frameImage = images.get(frameAssetId(clip, frame));
      if (!frameImage) return;
      const rect = frameRect(clip, frame, frameImage.naturalWidth, frameImage.naturalHeight);
      const anchor = clip.frameAnchors?.[frame] ?? clip.anchor;
      ctx.globalAlpha = opacity * weight;
      if (clip.mirrorLeftHalf) {
        ctx.drawImage(frameImage, rect.x, rect.y, rect.width / 2, rect.height, -size / 2, -size * clip.anchor.y, size / 2, size);
        ctx.save(); ctx.scale(-1, 1);
        ctx.drawImage(frameImage, rect.x, rect.y, rect.width / 2, rect.height, -size / 2, -size * clip.anchor.y, size / 2, size);
        ctx.restore();
      } else if (clip.radial) {
        const layout = clip.radial;
        if (layout.convergeAfter !== undefined && progress < layout.convergeAfter) return;
        const travel = layout.convergeAfter === undefined ? 0 : Math.min(1, (progress-layout.convergeAfter)/(1-layout.convergeAfter));
        const distance = size * layout.radius * (1-travel);
        const width = size * layout.scale, height = width / (clip.aspectRatio ?? 1);
        for (let i = 0; i < layout.count; i++) {
          const angle = i * Math.PI * 2 / layout.count - Math.PI / 2;
          ctx.save(); ctx.translate(Math.cos(angle)*distance,Math.sin(angle)*distance);
          if (layout.pointInward) ctx.rotate(angle + Math.PI);
          ctx.drawImage(frameImage,rect.x,rect.y,rect.width,rect.height,-width*anchor.x,-height*anchor.y,width,height);
          ctx.restore();
        }
      } else {
        const height = size / (clip.aspectRatio ?? 1);
        ctx.drawImage(frameImage, rect.x, rect.y, rect.width, rect.height, -size * anchor.x, -height * anchor.y, size, height);
      }
    };
    draw(sampled.frame, 1 - sampled.blend); draw(sampled.next, sampled.blend);
  } else {
    // Assets never gate gameplay; missing/loading art has a readable fallback.
    ctx.globalAlpha = 0.65 * fade; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, cue.kind === 'area' || cue.kind === 'zone' ? cue.radius ?? cue.size / 2 : cue.kind === 'projectile' ? 7 : 8 + progress * 16, 0, Math.PI * 2); ctx.stroke();
  }
  if ((cue.kind === 'impact' || cue.kind === 'wall') && !image) {
    // Immediate contact response; the atlas afterwards is only an afterimage.
    ctx.globalAlpha = Math.max(0, 1 - cue.ageMs / 140) * 0.65;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 4 + Math.min(cue.ageMs / 140, 1) * 12, 0, Math.PI * 2); ctx.stroke();
    if (!view.reduced) for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + 0.4;
      const distance = 6 + 34 * (1 - Math.pow(1 - progress, 2));
      ctx.globalAlpha = 0.45 * (1 - progress) * fade;
      ctx.beginPath(); ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, 1.2 * (1 - progress) + 0.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  if (clip?.overlayClipId) drawVfxCue(ctx, images, clips, { ...cue, clipId: clip.overlayClipId }, view);
}

export class VfxRenderer {
  readonly definition: VfxDefinition;
  constructor(private readonly images: ImageCache, definition: VfxDefinition) {
    validateVfx(definition); this.definition = structuredClone(definition);
  }
  preload() { for (const clip of this.definition.clips) for (const id of [clip.assetId, ...(clip.additionalAssetIds ?? [])]) this.images.get(id); }
  render(ctx: CanvasRenderingContext2D, cues: readonly VfxCue[], layer: 'below' | 'above', reduced: boolean) {
    for (const cue of cues) {
      const aboveBall = this.definition.clips.find(c=>c.id===cue.clipId)?.outsideBall && cue.ballRadius;
      if ((!aboveBall && (cue.kind === 'cast' || cue.kind === 'aura' || cue.kind === 'area' || cue.kind === 'zone')) === (layer === 'below')) drawVfxCue(ctx, this.images, this.definition.clips, cue, { reduced });
    }
  }
}
