import type { CharacterArtwork } from '../contracts/visual';
import type { BodySnapshot, WorldSnapshot } from '../contracts/types';
import { characterPose, type VisualPreview } from './character-animation';
import type { ImageCache } from './image-cache';

export function portraitSourceRect(art: CharacterArtwork, imageWidth: number, imageHeight: number) {
  const crop = art.portrait ?? { x: 0, y: 0, size: 1 };
  const size = crop.size * Math.min(imageWidth, imageHeight);
  return { x: Math.min(imageWidth - size, crop.x * imageWidth), y: Math.min(imageHeight - size, crop.y * imageHeight), width: size, height: size };
}

export function drawCharacterArtwork(context: CanvasRenderingContext2D, images: Pick<ImageCache, 'get'>, world: WorldSnapshot,
  body: BodySnapshot, art: CharacterArtwork, radius: number, color: string, preview: VisualPreview) {
  const image = images.get(art.assetId);
  if (!image) return false;
  const pose = characterPose(world, body, art, preview);
  const source = portraitSourceRect(art, image.naturalWidth, image.naturalHeight);
  context.save();
  // The face is always upright and centered. Motion never deforms or displaces the ball.
  context.translate(body.position.x, body.position.y);
  const guarded = world.combat?.statuses?.some(s => s.targetId === body.id && (s.definition.effect.kind === 'skill-evasion' || s.definition.effect.kind === 'collision-guard' || s.definition.effect.kind === 'direct-guard'));
  context.globalAlpha = pose.alpha * (guarded ? .65 : 1);
  const base = context.createRadialGradient(-radius * 0.3, -radius * 0.4, 0, 0, 0, radius);
  base.addColorStop(0, color); base.addColorStop(1, '#12262d');
  context.fillStyle = base;
  context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.fill();
  context.save();
  context.clip();
  context.filter = `brightness(${pose.brightness})`;
  const aura = art.auraAssetId && images.get(art.auraAssetId);
  if (aura) {
    const auraSource = portraitSourceRect(art, aura.naturalWidth, aura.naturalHeight);
    context.drawImage(aura, auraSource.x, auraSource.y, auraSource.width, auraSource.height, -radius, -radius, radius * 2, radius * 2);
  }
  context.drawImage(image, source.x, source.y, source.width, source.height, -radius, -radius, radius * 2, radius * 2);
  context.restore();
  const shade = context.createRadialGradient(0, 0, radius * 0.6, 0, 0, radius);
  shade.addColorStop(0, '#08151a00'); shade.addColorStop(1, '#08151a99');
  context.fillStyle = shade;
  context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.fill();
  context.strokeStyle = color; context.lineWidth = 1.8; context.stroke();
  context.strokeStyle = '#eef9f4aa'; context.lineWidth = 1;
  context.beginPath(); context.arc(0, 0, radius - 2.5, Math.PI * 1.1, Math.PI * 1.65); context.stroke();
  const starStacks=Math.max(0,...(world.combat?.statuses??[]).filter(s=>s.targetId===body.id&&s.definition.effect.kind==='star-mark').map(s=>s.stacks));
  if(starStacks) {
    context.font='bold 16px serif';context.textAlign='center';context.lineWidth=3;context.strokeStyle='#10202e';
    for(let i=0;i<3;i++){context.fillStyle=i<starStacks?'#ffe49a':'#647188';context.strokeText('✦',(i-1)*15,-radius-6);context.fillText('✦',(i-1)*15,-radius-6);}
  }
  context.restore();
  return true;
}
