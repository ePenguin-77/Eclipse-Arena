import type { WorldSnapshot } from '../contracts/types';
import type { RetracePoint } from '../contracts/abilities';
import type { ImageCache } from './image-cache';
import { VFX_DEFINITION } from '../content/vfx';
import { drawVfxCue } from './vfx/renderer';

/** All light follows the same sampled polyline used by collision. No straight corner cuts. */
export function renderRetrace(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const fraction=Math.max(0,Math.min(1,alpha)),time=world.tick-1+fraction;
 const trail=images.get('retrace-trail-v1');
 const frame=Math.floor(time/5)%8;
 const seen=new Set<string>();
 const segment=(a:RetracePoint,b:RetracePoint,opacity:number,width:number)=>{
  if(!b.connected||!trail)return;
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.2)return;
  const w=trail.naturalWidth/4,h=trail.naturalHeight/2;
  c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx));c.globalAlpha=opacity;
  c.drawImage(trail,(frame%4)*w+w*.05,Math.floor(frame/4)*h,w*.9,h,-.5,-width/2,length+1,width);c.restore();
 };
 for(const s of world.abilities?.retraceSwords??[]){
  const warning=time<s.launchTick,key=`${s.ownerId}:${s.startedTick}`;
  // Three ultimate blades share one warning route; do not triple its opacity.
  if(!s.ultimate||!seen.has(key)){
   seen.add(key);
   const from=s.ultimate?0:s.cursor;
   for(let i=from+1;i<s.path.length;i++)segment(s.path[i-1]!,s.path[i]!,s.ultimate?(warning?.66:.3):.32,reduced?13:20);
  }
  if(!warning){
   const from=Math.max(0,s.cursor-(reduced?5:12));
   for(let i=from+1;i<=s.cursor;i++)segment(s.path[i-1]!,s.path[i]!,((i-from)/(s.cursor-from))*.8,s.ultimate?33:25);
  }
  // Waiting blades share the recorded origin; launch times separate them along the route.
  const point={x:s.previousPosition.x+(s.position.x-s.previousPosition.x)*fraction,y:s.previousPosition.y+(s.position.y-s.previousPosition.y)*fraction};
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:s.id,kind:'projectile',point,angle:s.angle,ageMs:Math.max(0,time-s.startedTick)*1000/60,
   durationMs:Infinity,size:s.ultimate?98:78,clipId:'retrace-sword',color:'#d4e7ff',opacity:warning?.65:1.35},{reduced});
 }
}
