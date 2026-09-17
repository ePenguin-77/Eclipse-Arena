import type {WorldSnapshot} from '../contracts/types';
import type {ImageCache} from './image-cache';
import {VFX_DEFINITION} from '../content/vfx';
import {drawVfxCue} from './vfx/renderer';
import {sampleClip,frameRect,clipDuration} from './vfx/clip';
export function renderCrystals(c:CanvasRenderingContext2D,w:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=w.tick-1+Math.max(0,Math.min(1,alpha)),clip=VFX_DEFINITION.clips.find(c=>c.id==='crystal-beam'),image=images.get('crystal-beam-v1');
 for(const l of w.abilities?.crystalLines??[]){
  const active=w.tick>=l.startsTick&&w.tick<l.startsTick+8,preview=w.tick<l.startsTick;
  const opacity=active?1:preview?.18:.15*Math.max(0,(l.endsTick-time)/(l.endsTick-l.startsTick-8));
  const dx=l.end.x-l.start.x,dy=l.end.y-l.start.y,length=Math.hypot(dx,dy);if(length<1)continue;
  c.save();c.translate(l.start.x,l.start.y);c.rotate(Math.atan2(dy,dx));
  c.beginPath();c.rect(0,-l.width*3,length,l.width*6);c.clip();
  if(image&&clip){const age=active&&!reduced?Math.max(0,time-l.startsTick)/8*(clipDuration(clip)-1):clipDuration(clip)*.3,s=sampleClip(clip,age);
   if(s){const draw=(f:number,weight:number)=>{if(weight<=0)return;const r=frameRect(clip,f,image.naturalWidth,image.naturalHeight);c.globalAlpha=opacity*weight;
    // Align the generated core (10–90% across, 53% down) with the collision segment.
    const height=l.width*5;c.drawImage(image,r.x,r.y,r.width,r.height,-length*.1/.8,-height*.53,length/.8,height);};draw(s.frame,1-s.blend);draw(s.next,s.blend);}
  }else{c.globalAlpha=opacity;c.strokeStyle='#b6e9ff';c.lineWidth=active?l.width:1;c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();}c.restore();
 }
 const nodes=[...(w.abilities?.crystalPrisms??[]).map(p=>({...p,large:false})),...(w.abilities?.crystalArrays??[]).flatMap(a=>a.points.map((position,i)=>({id:`${a.id}-${i}`,position,startedTick:a.startedTick,flashTick:a.startedTick,large:true})))];
 for(const p of nodes)drawVfxCue(c,images,VFX_DEFINITION.clips,{key:p.id,kind:'aura',point:p.position,angle:0,ageMs:Math.max(0,time-p.startedTick)*1000/60,durationMs:Infinity,size:p.large?92:72,clipId:'crystal-prism',color:'#c1eaff',opacity:time-p.flashTick<12?1:.86},{reduced});
}
