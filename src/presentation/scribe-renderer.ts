import type { WorldSnapshot } from '../contracts/types';
import type { ScribeMode } from '../contracts/abilities';
import type { VfxDefinition } from '../contracts/vfx';
import type { ImageCache } from './image-cache';
import { clipDuration } from './vfx/clip';
import { drawVfxCue } from './vfx/renderer';
import { characterVisualRadius } from './character-view';

function symbol(c:CanvasRenderingContext2D,mode:ScribeMode,size:number){
 c.save();c.scale(size/20,size/20);c.strokeStyle='#274e40';c.fillStyle='#274e40';c.lineWidth=2;c.lineCap='round';c.beginPath();
 if(mode==='field'){c.arc(0,0,7,0,Math.PI*2);c.moveTo(-4,0);c.lineTo(4,0);c.moveTo(0,-4);c.lineTo(0,4);}
 else if(mode==='summon'){for(let i=-1;i<=1;i++){c.moveTo(i*6+2,i===0?-3:2);c.arc(i*6,i===0?-3:2,2,0,Math.PI*2);}}
 else if(mode==='melee'){c.moveTo(-7,7);c.lineTo(7,-7);c.moveTo(-7,-4);c.lineTo(4,7);}
 else if(mode==='beam'){for(let i=-1;i<=1;i++){c.moveTo(-8,i*4);c.lineTo(8,i*4);}}
 else {c.moveTo(-8,0);c.lineTo(8,0);c.lineTo(2,-6);c.moveTo(8,0);c.lineTo(2,6);}
 c.stroke();c.restore();
}
export function renderScribe(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,vfx:VfxDefinition,alpha:number,reduced:boolean){
 const time=world.tick-1+Math.max(0,Math.min(1,alpha)),aura=images.get('scribe-aura-v1'),beam=images.get('scribe-beam-v1');
 for(const s of world.abilities?.scribeStrikes??[]){
  const fired=time>=s.releasesTick,age=time-s.releasesTick,fade=Math.max(0,Math.min(1,(s.endsTick-time)/12));c.save();c.translate(s.position.x,s.position.y);
  if(s.mode==='beam'){
   if(fired){const dx=s.end.x-s.position.x,dy=s.end.y-s.position.y,length=Math.hypot(dx,dy);c.rotate(Math.atan2(dy,dx));
    const height=52*(reduced?1:1+Math.sin(age*.7)*.035);
    c.globalAlpha=fade;
    if(beam)c.drawImage(beam,0,-height/2,length,height);
   }
  }else{
   const melee=s.mode==='melee',angle=melee?Math.atan2(s.end.y-s.position.y,s.end.x-s.position.x):0;
   const offset=melee?s.radius*.45:0,size=melee?s.radius*1.25:s.radius*2;
   // Travel follows the attack vector; stamp artwork keeps the source skill's
   // upright presentation. Only directional weapons rotate with that vector.
   c.translate(Math.cos(angle)*offset,Math.sin(angle)*offset);
   if(fired){
    const binding=vfx.abilities.find(a=>a.abilityId===s.recordedAbilityId);
    const clipId=melee?(binding?.release?.clipId??binding?.sequence?.slashClipId??binding?.impact.clipId):(binding?.zone?.detonationClipId??binding?.area?.clipId??binding?.impact.clipId);
    const clip=vfx.clips.find(p=>p.id===(clipId??'scribe-impact'));
    const source=world.abilities?.definitions?.find(d=>d.id===s.recordedAbilityId);
    const directional=source?.effect.kind==='thrust'||source?.effect.kind==='sweep';
    if(clip){
     // Play the whole source animation within the return window, preserving its
     // aspect ratio, registered anchors and frame crossfades. Never sector-clip art.
     const durationMs=clipDuration(clip),progress=Math.max(0,Math.min(.999,age/(s.endsTick-s.releasesTick)));
     drawVfxCue(c,images,vfx.clips,{key:s.id,kind:'release',point:{x:0,y:0},angle:melee&&directional?angle:0,ageMs:progress*durationMs,durationMs,size,color:binding?.color??'#eddaa1',clipId:clip.id,opacity:1.15},{reduced});
    }
   }else if(aura){c.globalAlpha=.2;c.drawImage(aura,-size/2,-size/2,size,size);}
  }c.restore();
 }
}

/** Small, stationary badge inside the portrait; drawn after portraits and aura. */
export function renderScribeBadge(c:CanvasRenderingContext2D,world:WorldSnapshot,images:Pick<ImageCache,'get'>,visualScale:number){
 const book=images.get('scribe-book-v1');
 for(const character of world.characters){if(character.definitionId!=='scribe'||character.status==='defeated')continue;
  const owner=world.bodies.find(b=>b.id===character.entityId);if(!owner)continue;
  const active=world.abilities?.scribeCasts?.find(s=>s.ownerId===owner.id),memory=world.abilities?.scribeMemories?.find(m=>m.ownerId===owner.id);
  const runtime=world.abilities?.runtimes.find(r=>r.ownerId===owner.id&&r.abilityId==='scribe-return');
  const large=!!active||runtime?.status==='casting',mode=active?.mode??runtime?.recordedMode??memory?.mode;
  if(!large&&!mode)continue;
  const radius=characterVisualRadius(world.characters,owner.id,visualScale),size=radius*.64;
  c.save();c.translate(owner.position.x-radius*.32,owner.position.y-radius*.32);
  c.fillStyle='#0c2727ee';c.strokeStyle=large?'#fff1ad':'#baa56d';c.lineWidth=large?1.5:1;
  c.beginPath();c.arc(0,0,size*.53,0,Math.PI*2);c.fill();c.stroke();
  if(book)c.drawImage(book,-size/2,-size/2,size,size);symbol(c,mode??'beam',size*.27);c.restore();
 }
}
