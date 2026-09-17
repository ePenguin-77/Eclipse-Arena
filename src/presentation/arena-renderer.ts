import type { ArenaDefinition, ArenaVisual } from '../contracts/arenas';
import type { ImageCache } from './image-cache';

const FALLBACK: ArenaVisual = { floor: '#17262d', accent: '#a7a087', stone: '#345456' };
/** Quiet stone/cloud motifs. Collision geometry remains authoritative. */
export function drawArena(ctx: CanvasRenderingContext2D, arena: ArenaDefinition, visual = FALLBACK, debug = false, images?: Pick<ImageCache, 'get'>, measurements = true) {
  const { width: w, height: h } = arena;
  const art = visual.artwork;
  const floorImage = art && images?.get(art.floorAssetId);
  const obstacleImage = art?.obstacle && images?.get(art.obstacle.assetId);
  ctx.save();
  for (const [x, y, r] of [[0, h * 0.2, 85], [w, h * 0.75, 100], [w * 0.65, 0, 80], [w * 0.3, h, 90]]) {
    const mist = ctx.createRadialGradient(x!, y!, 1, x!, y!, r!);
    mist.addColorStop(0, '#88ada518'); mist.addColorStop(1, '#88ada500');
    ctx.fillStyle = mist; ctx.fillRect(x! - r!, y! - r!, r! * 2, r! * 2);
  }
  ctx.fillStyle = '#080f1480'; ctx.fillRect(-8, 5, w + 16, h + 8);
  ctx.fillStyle = visual.floor; ctx.fillRect(0, 0, w, h);
  if (floorImage) {
    ctx.save(); ctx.globalAlpha = art!.floorOpacity;
    ctx.drawImage(floorImage, 0, 0, w, h); ctx.restore();
  }
  const floor = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.7);
  floor.addColorStop(0, '#70938a0b'); floor.addColorStop(1, '#050e1738');
  ctx.fillStyle = floor; ctx.fillRect(0, 0, w, h);
  if (!floorImage) {
    ctx.strokeStyle = '#90a9a50c'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let y = 34; y < h; y += 68) {
      ctx.moveTo(12, y); ctx.lineTo(w - 12, y);
      for (let x = (Math.round(y / 68) % 2 ? 34 : 68); x < w; x += 68) { ctx.moveTo(x, y); ctx.lineTo(x, Math.min(h - 12, y + 68)); }
    }
    ctx.stroke(); ctx.strokeStyle = visual.accent;
    ctx.globalAlpha = 0.2; ctx.lineWidth = 1; ctx.strokeRect(9, 9, w - 18, h - 18);
    for (const [x, y, angle] of [[18, 18, 0], [w - 18, 18, Math.PI / 2], [w - 18, h - 18, Math.PI], [18, h - 18, -Math.PI / 2]]) {
      ctx.save(); ctx.translate(x!, y!); ctx.rotate(angle!);
      ctx.beginPath(); ctx.moveTo(0, 35); ctx.lineTo(0, 0); ctx.lineTo(35, 0); ctx.moveTo(6, 22); ctx.lineTo(6, 6); ctx.lineTo(22, 6); ctx.stroke(); ctx.restore();
    }
    ctx.globalAlpha = 0.12;
    for (const r of [68, 75]) { ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = visual.accent; ctx.lineWidth = 2; ctx.strokeRect(0, 0, w, h);
  for (const o of arena.obstacles ?? []) {
    const { x, y } = o.center, r = o.radius;
    ctx.fillStyle = '#06161280'; ctx.beginPath(); ctx.ellipse(x, y + 8, r + 5, r, 0, 0, Math.PI * 2); ctx.fill();
    const stone = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 2, x, y, r);
    stone.addColorStop(0, visual.stone); stone.addColorStop(1, '#203c37');
    ctx.fillStyle = stone; ctx.strokeStyle = visual.accent; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (obstacleImage && art?.obstacle) {
      const crop = art.obstacle.crop;
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(obstacleImage, crop.x * obstacleImage.naturalWidth, crop.y * obstacleImage.naturalHeight,
        crop.size * obstacleImage.naturalWidth, crop.size * obstacleImage.naturalHeight, x - r, y - r, r * 2, r * 2);
      ctx.restore();
      ctx.strokeStyle = visual.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r - 7, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(i * Math.PI / 4); ctx.beginPath(); ctx.moveTo(r * 0.5, -4); ctx.lineTo(r * 0.7, -4); ctx.moveTo(r * 0.5, 4); ctx.lineTo(r * 0.7, 4); ctx.stroke(); ctx.restore();
      }
      ctx.font = '18px serif'; ctx.fillStyle = '#c3d6be'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('封', x, y);
    }
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    if (debug) { ctx.strokeStyle = '#79edff'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  }
  if (measurements) {
    ctx.font = '10px Consolas, monospace'; ctx.fillStyle = '#8a9a9d'; ctx.textAlign = 'center'; ctx.fillText(`${w} WU`, w / 2, -16);
    ctx.save(); ctx.translate(-19, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(`${h} WU`, 0, 0); ctx.restore();
  }
  ctx.restore();
}
