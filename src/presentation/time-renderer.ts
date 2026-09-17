import type { WorldSnapshot } from '../contracts/types';
import type { ImageCache } from './image-cache';
import { VFX_DEFINITION } from '../content/vfx';
import { drawVfxCue } from './vfx/renderer';

export function renderTime(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean) {
  const time=world.tick-1+Math.max(0,Math.min(1,alpha));
  for(const r of world.abilities?.timeRewinds??[]) {
    const progress=Math.max(0,Math.min(1,(time-r.startedTick)/(r.endsTick-r.startedTick)));
    drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`time-anchor-${r.ownerId}`,kind:'aura',point:r.anchor,angle:0,ageMs:0,durationMs:Infinity,size:70,clipId:'time-hourglass',color:'#e8c985',opacity:.95},{reduced});
    c.save();c.strokeStyle='#e5c57d';c.lineWidth=2;c.globalAlpha=.8;c.beginPath();c.arc(r.anchor.x,r.anchor.y,42,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-progress));c.stroke();c.restore();
    // Fine sand dots record the travelled path without a line crossing the arena.
    if(!reduced) {c.save();c.fillStyle='#ecd49a';for(let i=0;i<r.path.length;i++){const p=r.path[i]!;c.globalAlpha=.08+.24*i/r.path.length;c.beginPath();c.arc(p.x,p.y,1.4,0,Math.PI*2);c.fill();}c.restore();}
  }
  for(const e of world.abilities?.timeEchoes??[]) {
    const age=Math.max(0,time-e.startedTick),progress=Math.min(1,age/(e.endsTick-e.startedTick));
    drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`time-return-${e.ownerId}-${e.startedTick}`,kind:'impact',point:e.point,angle:0,ageMs:age*1000/60,durationMs:500,size:e.radius*2.3,clipId:'time-impact',color:'#e8c985',opacity:1-progress*.6},{reduced});
    if(!reduced && e.path.length>1) {
      c.save();c.fillStyle='#f9de9d';
      for(let i=0;i<18;i++) {const sample=(1-progress)*(e.path.length-1)-i*.35;if(sample<0)continue;
        const index=Math.floor(sample),a=e.path[index]!,b=e.path[Math.min(index+1,e.path.length-1)]!,f=sample-index;
        c.globalAlpha=(1-i/18)*(1-progress);c.beginPath();c.arc(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,1.5+(1-i/18),0,Math.PI*2);c.fill();}
      c.restore();
    }
  }
  for(const e of world.abilities?.events??[]) if(e.reason==='time-mark' && time>=e.tick && time-e.tick<30)
    drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`time-mark-burst-${e.id}`,kind:'impact',point:e.point,angle:0,ageMs:(time-e.tick)*1000/60,durationMs:500,size:115,clipId:'time-impact',color:'#e8c985'},{reduced});
}

export function renderTimeMarks(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean) {
  const time=world.tick-1+Math.max(0,Math.min(1,alpha));
for(const m of world.abilities?.timeMarks??[]) {
    const b=world.bodies.find(b=>b.id===m.targetId);if(!b)continue;
    const progress=Math.max(0,Math.min(1,(time-m.startedTick)/(m.endsTick-m.startedTick)));
    c.save();c.strokeStyle='#eccf8c';c.lineWidth=1.8;c.globalAlpha=.65;c.beginPath();c.arc(b.position.x,b.position.y,b.radius+9,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-progress));c.stroke();c.restore();
    drawVfxCue(c,images,VFX_DEFINITION.clips,{key:`time-mark-${m.ownerId}-${m.targetId}`,kind:'aura',point:{x:b.position.x-b.radius*.5,y:b.position.y-b.radius*.45},angle:0,ageMs:0,durationMs:Infinity,size:20,clipId:'time-hourglass',color:'#e8c985'},{reduced});
  }
  }
