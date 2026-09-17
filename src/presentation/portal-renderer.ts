import type { WorldSnapshot } from '../contracts/types';
import type { ImageCache } from './image-cache';
import { VFX_DEFINITION } from '../content/vfx';
import { drawVfxCue } from './vfx/renderer';

export function renderPortals(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha));
 for(const p of world.abilities?.portals??[]){
  const age=Math.max(0,time-p.startedTick)*1000/60;
  const open=Math.max(0,Math.min(1,(time-p.startedTick+1)/8,(p.endsTick-time)/10));
  for(const [i,point] of [p.entry,p.exit].entries()){
   const recoil=reduced?0:Math.max(0,1-(time-p.lastTransitTick)/12);
   drawVfxCue(c,images,VFX_DEFINITION.clips,{key:p.id+i,kind:'aura',point,angle:0,ageMs:age+(i?360:0),durationMs:Infinity,size:(p.radius*2.3+recoil*14)*open,color:'#8ad9ff',clipId:'portal-gate',opacity:p.ultimate?1.2:1},{reduced});
   // Tiny glowing pips show remaining body passages without text over portraits.
   for(let n=0;n<p.bodyUses;n++){const x=point.x+(n-(p.bodyUses-1)/2)*8,y=point.y+p.radius+8;
    c.save();c.globalAlpha=open*.9;c.fillStyle='#d5efff';c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();c.restore();}
  }
 }
 // Transit flashes are separate from the looping gate atlas and use the generated impact frames.
 for(const e of world.abilities?.events??[]){if(e.reason!=='portal-transit'||time<e.tick||time-e.tick>24)continue;
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`portal-${e.id}`,kind:'impact',point:e.point,angle:0,ageMs:(time-e.tick)*1000/60,durationMs:500,size:125,color:'#a0ddff',clipId:'portal-impact'},{reduced});
 }
}
