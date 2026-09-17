import type { WorldSnapshot } from '../contracts/types';
import { characterColor } from './character-view';

export function renderAbilityDebug(ctx: CanvasRenderingContext2D, world: WorldSnapshot) {
  const abilities = world.abilities;
  if (!abilities) return;
  const color = (id: string) => characterColor(world.characters, id, world.bodies.findIndex(b => b.id === id));
  ctx.save();
  for (const area of [...(abilities.areas ?? []), ...(abilities.zones ?? [])]) {
    ctx.strokeStyle = color(area.ownerId); ctx.globalAlpha = .65; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(area.position.x, area.position.y, area.radius, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of abilities.projectiles) {
    ctx.strokeStyle = color(p.ownerId); ctx.fillStyle = '#fff2c9'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(p.position.x - p.velocity.x * 0.035, p.position.y - p.velocity.y * 0.035); ctx.lineTo(p.position.x, p.position.y); ctx.stroke();
    ctx.shadowColor = color(p.ownerId); ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  for (const event of abilities.events) {
    const age = (world.tick - event.tick) / 60;
    if (age > 0.35 || ['rejected', 'cancelled', 'expired'].includes(event.kind)) continue;
    ctx.globalAlpha = Math.max(0, 1 - age / 0.35);
    ctx.strokeStyle = event.kind === 'miss' ? '#efa792' : color(event.ownerId);
    ctx.lineWidth = event.kind === 'melee' ? 5 : 2;
    ctx.setLineDash(event.kind === 'cast' ? [4, 6] : []);
    if (event.end) { ctx.beginPath(); ctx.moveTo(event.point.x, event.point.y); ctx.lineTo(event.end.x, event.end.y); ctx.stroke(); }
    ctx.setLineDash([]);
    const point = event.kind === 'melee' && event.end ? event.end : event.point;
    ctx.beginPath(); ctx.arc(point.x, point.y, 9 + age * 60, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
