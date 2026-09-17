import type { WorldSnapshot } from '../contracts/types';
import type { ImageCache } from './image-cache';
export function renderBell(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha)),wave=images.get('bell-wave-v1');
 for(const w of world.abilities?.bellWaves??[]){
  const progress=Math.max(0,Math.min(1,(time-w.startedTick)/(w.endsTick-w.startedTick))),radius=w.maxRadius*progress,size=radius/.415;
  if(size<2)continue;c.save();c.translate(w.position.x,w.position.y);c.globalAlpha=(w.final?1:.8)*Math.max(.3,Math.min(1,(w.endsTick-time)/5));
  if(wave)c.drawImage(wave,-size/2,-size/2,size,size);
  else{c.strokeStyle='#f5d48a';c.lineWidth=w.final?5:3;c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();}
  c.restore();
 }
 const bell=images.get('bell-ultimate-v1');
 for(const f of world.abilities?.bellForms??[]){const owner=world.bodies.find(b=>b.id===f.ownerId);if(!owner)continue;
  const age=Math.max(0,time-f.startedTick),pulse=Math.exp(-(age%30)/7),size=115+(reduced?0:pulse*8);
  c.save();c.translate(f.position.x,f.position.y);c.rotate(reduced?0:Math.sin(age*.24)*.07*pulse);c.globalAlpha=.8*Math.min(1,(f.endsTick-time)/8,(age+1)/7);
  if(bell)c.drawImage(bell,-size/2,-size/2,size,size);c.restore();
 }
}
