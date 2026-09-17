import type { WorldSnapshot, Vec2 } from '../contracts/types';
import { sampleClip } from './vfx/clip';
import { VFX_DEFINITION } from '../content/vfx';
import type { ImageCache } from './image-cache';

/** The cord's endpoints and slack come from simulation; only its silk flutter is decorative. */
export function renderThreads(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha));
 const position=(id:string)=>{const b=world.bodies.find(b=>b.id===id);return b?{x:b.previousPosition.x+(b.position.x-b.previousPosition.x)*alpha,y:b.previousPosition.y+(b.position.y-b.previousPosition.y)*alpha}:undefined;};
 const cord=images.get('thread-cord-v1'),clip=VFX_DEFINITION.clips.find(c=>c.id==='thread-cord')!;
 // Register the generated strand within each row so its baseline never hops between frames.
 const centers=[.094,.209,.326,.443,.56,.68,.799,.916];
 const silk=(path:(u:number)=>Vec2,width:number,age:number,segments=32)=>{
  const sample=sampleClip(clip,reduced?0:Math.max(0,age)*1000/60);if(!sample)return;
  const opacity=c.globalAlpha;
  if(!cord){c.strokeStyle='#ef5675';c.lineWidth=1;c.beginPath();for(let i=0;i<=segments;i++){const p=path(i/segments);if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);}c.stroke();return;}
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  for(const [frame,weight] of [[sample.frame,1-sample.blend],[sample.next,sample.blend]]){
   if(weight!<=0)continue;c.globalAlpha=opacity*weight!;
   const sourceHeight=cord.naturalHeight*.08,sourceY=cord.naturalHeight*centers[frame!]!-sourceHeight/2;
   for(let i=0;i<segments;i++){
    const a=path(i/segments),b=path((i+1)/segments),length=Math.hypot(b.x-a.x,b.y-a.y);
    c.save();c.translate((a.x+b.x)/2,(a.y+b.y)/2);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));
    c.drawImage(cord,i*cord.naturalWidth/segments,sourceY,cord.naturalWidth/segments,sourceHeight,-length/2-.3,-width/2,length+.6,width);c.restore();
   }
  }c.globalAlpha=opacity;
 };
 c.save();c.lineCap='round';c.lineJoin='round';
 for(const m of world.abilities?.threadMarks??[]){const p=position(m.targetId),b=world.bodies.find(b=>b.id===m.targetId);if(!p||!b)continue;
  c.save();c.globalAlpha=Math.min(1,(m.endsTick-time)/12);
  silk(u=>{const a=u*Math.PI*2;return {x:p.x+Math.cos(a)*(b.radius+5),y:p.y+Math.sin(a)*(b.radius+5)};},5,time-m.startedTick,40);c.restore();
 }
 const needle=images.get('thread-needle-v1');
 for(const t of world.abilities?.fateThreads??[]){
  const p=position(t.targetId);if(!p)continue;
  const a=t.anchor,dx=p.x-a.x,dy=p.y-a.y,len=Math.hypot(dx,dy)||1;
  const recoil=t.jerks>0?Math.max(0,1-(time-t.lastJerkTick)/12):0,broken=t.jerks>=t.maxJerks;
  const slack=Math.min(64,Math.max(0,t.length-len)*.7),flutter=reduced?0:Math.sin(time*.16)*Math.min(7,slack*.2);
  const control={x:(a.x+p.x)/2-dy/len*(slack+flutter),y:(a.y+p.y)/2+dx/len*(slack+flutter)};
  const pointAt=(u:number):Vec2=>{const v=1-u;return {x:v*v*a.x+2*v*u*control.x+u*u*p.x,y:v*v*a.y+2*v*u*control.y+u*u*p.y};};
  c.save();c.globalAlpha=Math.max(0,Math.min(1,(t.endsTick-time)/10,(time-t.startedTick+1)/7));
  silk(pointAt,8+recoil*3,time-t.startedTick,Math.max(12,Math.min(48,Math.ceil(len/9))));
  if(!reduced)for(let i=0;i<4;i++){
   const u=(time*.015+i/4)%1,v=1-u;
   const point:Vec2={x:v*v*a.x+2*v*u*control.x+u*u*p.x,y:v*v*a.y+2*v*u*control.y+u*u*p.y};
   c.globalAlpha*=.9;c.fillStyle='#ffe6ae';c.beginPath();c.arc(point.x,point.y,broken?1.5:1,0,Math.PI*2);c.fill();
  }
  c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(-dy,-dx));
  if(needle)c.drawImage(needle,-55,-12,62,24);c.restore();
  silk(u=>{const a=u*Math.PI*2;return {x:p.x+Math.cos(a)*(39+recoil*5),y:p.y+Math.sin(a)*(39+recoil*5)};},6,time-t.startedTick,40);
  c.restore();
 }
 c.restore();
}
