import type { WorldSnapshot } from '../contracts/types';
import type { ImageCache } from './image-cache';
import { VFX_DEFINITION } from '../content/vfx';
import { drawVfxCue } from './vfx/renderer';

export function renderLantern(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha));
 for(const lamp of world.abilities?.lanterns??[]){
  if(world.abilities?.soulReleases?.some(r=>r.ownerId===lamp.ownerId&&r.remaining>0))continue;
  const point={x:lamp.previousPosition.x+(lamp.position.x-lamp.previousPosition.x)*alpha,y:lamp.previousPosition.y+(lamp.position.y-lamp.previousPosition.y)*alpha};
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`lamp-${lamp.ownerId}`,kind:'aura',point,angle:0,ageMs:Math.max(0,time-lamp.startedTick)*1000/60,durationMs:Infinity,size:78,clipId:'lantern-lamp',color:'#88e6cd'},{reduced});
 }
 for(const r of world.abilities?.soulReleases??[]){
  if(r.remaining===0)continue;
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`soul-lamp-${r.ownerId}`,kind:'aura',point:r.position,angle:0,ageMs:500+Math.max(0,time-r.startedTick)*1000/60,durationMs:Infinity,size:112,clipId:'lantern-lamp',color:'#b7f3de'},{reduced});
 }
 for(const e of world.abilities?.events??[])if(e.reason==='lantern-capture'&&time>=e.tick&&time-e.tick<30)
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`lamp-capture-${e.id}`,kind:'impact',point:e.point,angle:0,ageMs:(time-e.tick)*1000/60,durationMs:500,size:125,clipId:'lantern-impact',color:'#88e6cd'},{reduced});
}
