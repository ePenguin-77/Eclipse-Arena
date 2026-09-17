import type { WorldSnapshot } from '../contracts/types';
import type { ImageCache } from './image-cache';

/** Charging stays at the caster; only a released shot draws a ray to the wall. */
export function renderBeams(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha)),image=images.get('beam-strand-v1'),impact=images.get('beam-impact-v1');
 for(const beam of world.abilities?.beams??[]){
  const dx=beam.end.x-beam.start.x,dy=beam.end.y-beam.start.y,length=Math.hypot(dx,dy);
  if(length<1)continue;
  c.save();c.translate(beam.start.x,beam.start.y);c.rotate(Math.atan2(dy,dx));
  if(beam.phase==='charge'){
   const progress=Math.max(0,Math.min(1,(time-beam.startedTick)/(beam.releaseTick-beam.startedTick)));
   const size=(beam.ultimate?44:24)*(0.55+progress*.45),muzzle=Math.min(46,length);
   const glow=c.createRadialGradient(muzzle,0,0,muzzle,0,size);
   glow.addColorStop(0,'#ffffff');glow.addColorStop(.25,'#bdefff');glow.addColorStop(1,'#82d9ff00');
   c.globalAlpha=.45+progress*.55;c.fillStyle=glow;c.fillRect(muzzle-size,-size,size*2,size*2);
   if(impact)c.drawImage(impact,0,0,impact.naturalWidth/4,impact.naturalHeight/2,muzzle-size,-size,size*2,size*2);
   c.rotate(-Math.atan2(dy,dx));
   c.globalAlpha=.9;c.strokeStyle=beam.ultimate?'#f2fbff':'#80d8ff';c.lineWidth=beam.ultimate?3:2;
   c.beginPath();c.arc(0,0,beam.ultimate?57:47,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
  }else{
   const age=Math.max(0,time-beam.releaseTick-1),remaining=beam.endsTick-time;
   const phase=reduced?1:age/3,frame=Math.floor(phase)%4,t=phase%1,blend=t*t*(3-2*t);
   const height=beam.width*1.5,anchors=[.58,.50,.48,.40],opacity=Math.min(1,remaining/4);
   c.beginPath();c.rect(0,-height,length,height*2);c.clip();
   // A readable luminous core remains visible during decode/failure and exposes the ultimate's true width.
   const light=c.createLinearGradient(0,-beam.width/2,0,beam.width/2);
   light.addColorStop(0,'#70d8ff00');light.addColorStop(.2,'#5dcfff65');light.addColorStop(.42,'#bcefffcc');
   light.addColorStop(.5,'#ffffff');light.addColorStop(.58,'#bcefffcc');light.addColorStop(.8,'#5dcfff65');light.addColorStop(1,'#70d8ff00');
   c.globalAlpha=opacity;c.fillStyle=light;c.fillRect(0,-beam.width/2,length,beam.width);
   if(image){const row=image.naturalHeight/4;
    const draw=(index:number,weight:number)=>{c.globalAlpha=opacity*weight;
     c.drawImage(image,0,index*row,image.naturalWidth,row,-length*.074/.88,-height*anchors[index]!,length/.88,height);};
    draw(frame,1-blend);draw((frame+1)%4,blend);
   }
  }
  c.restore();
 }
}
