import type {WorldSnapshot} from '../contracts/types';
import type {ImageCache} from './image-cache';
import {characterVisualRadius} from './character-view';
const faces=['wrath','sorrow','smile'] as const;
/** Stable in-circle current face; awakening icons extinguish individually. */
export function renderMasks(c:CanvasRenderingContext2D,world:WorldSnapshot,images:Pick<ImageCache,'get'>,visualScale:number,alpha=1){
 const image=images.get('masks-icons-v1');if(!image)return;
 const draw=(index:number,x:number,y:number,size:number,opacity=1)=>{c.save();c.globalAlpha=opacity;c.drawImage(image,index*image.width/3,0,image.width/3,image.height,x-size/2,y-size/2,size,size);c.restore();};
 for(const character of world.characters){if(character.definitionId!=='masks'||character.status==='defeated')continue;const b=world.bodies.find(b=>b.id===character.entityId);if(!b)continue;
  const s=world.abilities?.masks?.find(s=>s.ownerId===b.id),radius=characterVisualRadius(world.characters,b.id,visualScale),fraction=Math.max(0,Math.min(1,alpha));
  const x=b.previousPosition.x+(b.position.x-b.previousPosition.x)*fraction,y=b.previousPosition.y+(b.position.y-b.previousPosition.y)*fraction;
  const badge=radius*.68,bx=x-radius*.38,by=y-radius*.34;
  c.save();c.fillStyle='#102326f2';c.strokeStyle='#d8bb88';c.lineWidth=1;c.beginPath();c.arc(bx,by,badge*.53,0,Math.PI*2);c.fill();c.stroke();c.restore();
  draw(faces.indexOf(s?.face??'wrath'),bx,by,badge);
  if(s?.remaining.length)faces.forEach((face,index)=>{const angle=-Math.PI/2+index*Math.PI*2/3;draw(index,x+Math.cos(angle)*radius*1.72,y+Math.sin(angle)*radius*1.72,radius*.9,s.remaining.includes(face)?1:.13);});
 }
 for(const mark of world.abilities?.maskMarks??[]){const b=world.bodies.find(b=>b.id===mark.targetId);if(b)draw(0,b.position.x+b.radius*.7,b.position.y-b.radius*.25,19,.85);}
}
