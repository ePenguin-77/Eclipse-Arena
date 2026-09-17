import type { WorldSnapshot } from '../contracts/types';
import type { ImageCache } from './image-cache';
import { VFX_DEFINITION } from '../content/vfx';
import { drawVfxCue } from './vfx/renderer';
export function renderDreams(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha));
 for(const w of world.abilities?.dreamWaves??[]){if(time>w.endsTick)continue;
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`dream-${w.ownerId}-${w.startedTick}`,kind:'aura',point:w.position,angle:0,ageMs:Math.max(0,time-w.startedTick)*1000/60,durationMs:600,size:Math.max(25,w.radius*2/0.65),clipId:'dream-wave',color:'#d5b9ff',opacity:.8},{reduced});
 }
}
export function renderDreamSleep(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha));
 for(const s of world.combat?.statuses??[]){if(s.definition.effect.kind!=='sleep')continue;
  const b=world.bodies.find(b=>b.id===s.targetId);if(!b)continue;
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`sleep-${s.targetId}`,kind:'aura',point:{x:b.position.x-16,y:b.position.y-17},angle:-Math.PI/2,ageMs:Math.max(0,time-s.appliedTick)*1000/60,durationMs:Infinity,size:36,clipId:'dream-bolt',color:'#e4cfff',opacity:.95},{reduced});
 }
}
