import type {WorldSnapshot} from '../contracts/types';
import type {ImageCache} from './image-cache';
import {VFX_DEFINITION} from '../content/vfx';
import {drawVfxCue} from './vfx/renderer';
import {clipDuration} from './vfx/clip';
const SWEEP_MS=clipDuration(VFX_DEFINITION.clips.find(c=>c.id==='automaton-sweep')!);
export function renderAutomatons(c:CanvasRenderingContext2D,world:WorldSnapshot,images:ImageCache,alpha:number,reduced:boolean,effects=true){
 const fraction=Math.max(0,Math.min(1,alpha)),time=world.tick-1+fraction;
 for(const r of world.abilities?.automatons??[]){
  const p={x:r.previousPosition.x+(r.position.x-r.previousPosition.x)*fraction,y:r.previousPosition.y+(r.position.y-r.previousPosition.y)*fraction};
  const warrior=r.mode==='warrior',clipId=warrior?'automaton-warrior':'automaton-turret',size=warrior?114:94;
  if(effects&&(r.charged||time-r.chargeTick<30||time-r.transformedTick<24))drawVfxCue(c,images,VFX_DEFINITION.clips,{key:r.id+'-glow',kind:'aura',point:p,angle:0,ageMs:time*1000/60,durationMs:Infinity,size:warrior?125:102,clipId:'automaton-aura',color:'#84e3ee',opacity:.85},{reduced});
  // Keep the upright puppet readable in both directions; aim is shown by the bolts and sweep.
  c.save();c.translate(p.x,p.y);c.scale(Math.cos(r.angle)<0?-1:1,1);
  drawVfxCue(c,images,VFX_DEFINITION.clips,{key:r.id,kind:'summon',point:{x:0,y:0},angle:0,ageMs:effects?Math.max(0,time-r.spawnedTick)*1000/60:0,durationMs:Infinity,size,clipId,color:'#c5b582',opacity:1.45,radius:r.radius},{reduced});c.restore();
  if(effects&&time-r.transformedTick>=0&&time-r.transformedTick<24)drawVfxCue(c,images,VFX_DEFINITION.clips,{key:r.id+'-transform',kind:'impact',point:p,angle:0,ageMs:(time-r.transformedTick)*1000/60,durationMs:500,size:130,clipId:'automaton-impact',color:'#89e3ef',opacity:.9},{reduced});
  if(effects&&r.swing){const active=time>=r.swing.hitTick;
   // Fit every atlas frame into the active sweep instead of cutting off its final frames.
   const ageMs=active?SWEEP_MS*(time-r.swing.hitTick)/Math.max(1,r.swing.endsTick-r.swing.hitTick):0;
   drawVfxCue(c,images,VFX_DEFINITION.clips,{key:r.id+'-sweep',kind:'area',point:r.swing.origin,angle:r.swing.angle,ageMs,durationMs:Infinity,size:warrior?180:130,clipId:'automaton-sweep',color:'#91dfeb',opacity:active?1.35:.28},{reduced});
  }
  // The HP belongs to the destructible puppet, not an extra participant on the main HUD.
  c.save();c.fillStyle='#08191ddd';c.fillRect(p.x-23,p.y+r.radius+9,46,6);c.fillStyle=r.charged?'#8bf1fa':warrior?'#e7c679':'#87b9bd';c.fillRect(p.x-22,p.y+r.radius+10,44*Math.max(0,r.hp/r.maxHP),4);c.restore();
 }
}
