import type { WorldSnapshot } from '../contracts/types';
import type { ImageCache } from './image-cache';
import { VFX_DEFINITION } from '../content/vfx';
import { drawVfxCue } from './vfx/renderer';
export function renderFeathers(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha));
 const waiting=(world.abilities?.featherRecalls??[]).flatMap(r=>r.pins);
 for(const p of [...world.abilities?.featherPins??[],...waiting]){
  const recalled=waiting.some(q=>q.id===p.id);
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:p.id,kind:'aura',point:p.position,angle:p.angle,ageMs:recalled?Math.max(0,time-p.tick)*1000/60:0,durationMs:Infinity,size:recalled?72:57,clipId:'feather-bolt',color:'#c8dcff',opacity:recalled?1:.8},{reduced});
 }
}
