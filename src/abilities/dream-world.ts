import type { AbilityDefinition,AbilityEvent,ProjectileSnapshot } from '../contracts/abilities';
import type { ArenaDefinition,BodySnapshot,Vec2 } from '../contracts/types';
import type { StatusDefinition } from '../contracts/status';
import type { DamageRequest } from '../contracts/combat';
import { ProjectileWorld,type ProjectileCapture,type ProjectileTransit } from '../projectiles/projectile-world';
import { clearSpearLength } from './spear-world';
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
interface Wave {ownerId:string;abilityId:string;position:Vec2;radius:number;startedTick:number;endsTick:number;definition:AbilityDefinition;multiplier:number;arena:ArenaDefinition;hits:Set<string>;pending:{targetId:string;launchTick:number}[]}
export const dreamSleep=(ultimateId='dream-night'):StatusDefinition=>({id:'dream-sleep',name:'หลับฝัน',durationTicks:1,stacking:'refresh',effect:{kind:'sleep',immunityTicks:150,ultimateId,bonusMultiplier:1.6},vfxColor:'#d5b9ff'});
export function validateDream(d:AbilityDefinition){const e=d.effect;if(e.kind!=='dream-wave')return;
 if(!d.ultimate||d.range===0||![e.radius,e.speed].every(Number.isFinite)||e.radius<100||e.radius>400||e.speed<200||e.speed>900||![e.growthTicks,e.delayTicks].every(Number.isInteger)||e.growthTicks<12||e.growthTicks>90||e.delayTicks<1||e.delayTicks>60)throw Error('Invalid dream wave');
}
export class DreamWorld {
 setWindFields(fields:readonly import('../contracts/forces').VortexField[]){this.bolts.setWindFields(fields);}
 private waves:Wave[]=[];
 private bolts=new ProjectileWorld(32,'dream');
 hasOwner(id:string){return this.waves.some(w=>w.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,...this.waves.filter(w=>w.ownerId===id).map(w=>w.endsTick-tick));}
 start(tick:number,owner:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(d.effect.kind!=='dream-wave'||this.hasOwner(owner.id))return false;
  this.waves.push({ownerId:owner.id,abilityId:d.id,position:{...owner.position},radius:0,startedTick:tick,endsTick:tick+d.effect.growthTicks+d.effect.delayTicks+120,definition:d,multiplier,arena:structuredClone(arena),hits:new Set(),pending:[]});return true;
 }
 fields(tick:number,bodies:readonly BodySnapshot[]){
  const out:{sourceId:string;targetId:string;abilityId:string;definition:StatusDefinition}[]=[];
  for(const w of this.waves){const e=w.definition.effect;if(e.kind!=='dream-wave'||tick>w.startedTick+e.growthTicks)continue;
   const previous=w.radius;w.radius=e.radius*Math.min(1,(tick-w.startedTick)/e.growthTicks);
   for(const b of bodies){if(b.id===w.ownerId||b.ownerId===w.ownerId||w.hits.has(b.id))continue;
    const dx=b.position.x-w.position.x,dy=b.position.y-w.position.y,l=Math.hypot(dx,dy);
    const from=b.previousPosition,x=from.x-w.position.x,y=from.y-w.position.y,vx=b.position.x-from.x,vy=b.position.y-from.y,t=Math.max(0,Math.min(1,-(x*vx+y*vy)/(vx*vx+vy*vy||1)));
    if(Math.hypot(x+vx*t,y+vy*t)>w.radius+b.radius||Math.max(Math.hypot(x,y),l)<previous-b.radius)continue;
    if(l>1e-6&&clearSpearLength(w.position,{x:dx/l,y:dy/l},l,0,w.arena)<l-.01)continue;
    w.hits.add(b.id);w.pending.push({targetId:b.id,launchTick:tick+e.delayTicks});
    out.push({sourceId:w.ownerId,targetId:b.id,abilityId:w.abilityId,definition:dreamSleep(w.abilityId)});
   }
  }return out;
 }
 step(tick:number,dt:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit,intercept?:(r:DamageRequest)=>boolean,transit?:(p:ProjectileSnapshot,a:Vec2,b:Vec2)=>ProjectileTransit|undefined,capture?:(p:ProjectileSnapshot,a:Vec2,b:Vec2)=>ProjectileCapture|undefined){
  this.waves=this.waves.filter(w=>bodies.some(b=>b.id===w.ownerId)&&tick<w.endsTick&&!locked.has(w.ownerId));
  for(const w of this.waves){const e=w.definition.effect;if(e.kind!=='dream-wave')continue;
   w.pending=w.pending.filter(p=>{if(tick<p.launchTick)return true;const target=bodies.find(b=>b.id===p.targetId);if(!target)return false;
    const dx=target.position.x-w.position.x,dy=target.position.y-w.position.y,l=Math.hypot(dx,dy)||1;
    this.bolts.spawn({ownerId:w.ownerId,abilityId:w.abilityId,position:{...w.position},previousPosition:{...w.position},velocity:{x:dx/l*e.speed,y:dy/l*e.speed},radius:24,damage:e.damage*w.multiplier,spawnedTick:tick,expiresTick:tick+100,seeking:{targetId:target.id,endsTick:tick+45,turnRate:3.5}});
    emit({tick,ownerId:w.ownerId,abilityId:w.abilityId,kind:'projectile',point:{...w.position},reason:'dream-awakening'});return false;});
  }
  // Launched butterflies remain in flight if the caster later sleeps or is sealed.
  return this.bolts.step(tick,dt,arena,bodies,emit,intercept,transit,capture);
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.waves=this.waves.filter(w=>!finished&&living.has(w.ownerId));if(finished)this.bolts.clear();else this.bolts.removeOwners(living);}
 snapshot(){return {dreamWaves:this.waves.map(({ownerId,abilityId,position,radius,startedTick,definition})=>({ownerId,abilityId,position:{...position},radius,startedTick,endsTick:startedTick+(definition.effect.kind==='dream-wave'?definition.effect.growthTicks:0)}))};}
 projectileSnapshot(){return this.bolts.snapshot();}
}
