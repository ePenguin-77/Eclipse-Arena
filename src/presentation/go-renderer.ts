import type { WorldSnapshot } from '../contracts/types';
import type { ImageCache } from './image-cache';
/** Generated strands are registered to the same centerline as the collision capsule. */
export function renderGo(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha));c.save();c.lineCap='round';
 const strand=images.get('go-line-v1');
 for(const l of world.abilities?.goLines??[]){
  const active=world.tick>=l.startsTick&&world.tick<l.endsTick;
  if(strand){
   const dx=l.end.x-l.start.x,dy=l.end.y-l.start.y,length=Math.hypot(dx,dy);
   const height=active?l.width*3:9,opacity=active?.95:.3;
   const phase=reduced?0:Math.max(0,time-l.startsTick)*1000/60/160;
   const frame=Math.floor(phase)%4,t=phase%1,blend=t*t*(3-2*t);
   // Generated core positions differ slightly inside the four atlas rows.
   const anchors=[.62,.58,.51,.455],rowHeight=strand.naturalHeight/4;
   c.save();c.translate(l.start.x,l.start.y);c.rotate(Math.atan2(dy,dx));
   c.beginPath();c.rect(0,-height,length,height*2);c.clip();
   const draw=(index:number,weight:number)=>{if(weight<=0)return;c.globalAlpha=opacity*weight;
    c.drawImage(strand,0,index*rowHeight,strand.naturalWidth,rowHeight,-length*.04/.92,-height*anchors[index]!,length/.92,height);};
   draw(frame,1-blend);draw((frame+1)%4,blend);c.restore();
  }else{
   c.globalAlpha=active?.85:.25;c.strokeStyle=active?'#fff0bf':'#e1c788';c.lineWidth=active?l.width:1.5;
   c.beginPath();c.moveTo(l.start.x,l.start.y);c.lineTo(l.end.x,l.end.y);c.stroke();
  }
 }
 const stones=world.abilities?.goStones??[],img=images.get('go-stones-v2');
 // The outer hexagon is a faint orientation guide; only bright inner lines attack.
 const boards=new Map<string,typeof stones>();
 for(const s of stones)if(s.id.startsWith('go-board')){const id=s.id.slice(0,s.id.lastIndexOf('-'));boards.set(id,[...(boards.get(id)??[]),s]);}
 for(const group of boards.values())if(group.length===6){c.globalAlpha=.2;c.shadowBlur=0;c.lineWidth=1;c.strokeStyle='#ddc994';c.beginPath();group.forEach((s,i)=>i?c.lineTo(s.position.x,s.position.y):c.moveTo(s.position.x,s.position.y));c.closePath();c.stroke();}
 for(const s of stones){const x=s.previousPosition.x+(s.position.x-s.previousPosition.x)*alpha,y=s.previousPosition.y+(s.position.y-s.previousPosition.y)*alpha;
  c.globalAlpha=Math.min(1,(s.expiresTick-world.tick)/18);c.shadowBlur=0;const size=s.flying?36:40,pulse=reduced?1:1+.035*Math.sin((time-s.spawnedTick)*.13);
  if(img)c.drawImage(img,s.color*img.naturalWidth/2,0,img.naturalWidth/2,img.naturalHeight,x-size*pulse/2,y-size*pulse/2,size*pulse,size*pulse);
  else{c.fillStyle=s.color?'#fff4e8':'#161820';c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.fill();}
 }
 c.restore();
}
