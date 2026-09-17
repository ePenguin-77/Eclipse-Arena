import type { AbilityDefinition, AbilityEvent, BellWaveSnapshot, BellFormSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import type { DamageRequest, DamageResult } from '../contracts/combat';
import type { KnockbackRequest } from '../contracts/forces';
import { clearSpearLength } from './spear-world';
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
interface Wave extends BellWaveSnapshot { damage:number;hits:Set<string> }
interface Form extends BellFormSnapshot { definition:AbilityDefinition;multiplier:number;index:number;nextTick:number }
export function validateBell(d:AbilityDefinition){const e=d.effect;if(e.kind!=='bell')return;
 if(d.range===0||![e.radius,e.damage,e.reduction,e.bonusRadiusPerStack].every(Number.isFinite)||e.radius<=0||e.radius>350||e.reduction<=0||e.reduction>1||e.bonusRadiusPerStack<0||e.bonusRadiusPerStack>60||![e.growthTicks,e.pulses,e.intervalTicks,e.guardTicks].every(Number.isInteger)||e.growthTicks<12||e.growthTicks>90||e.pulses<1||e.pulses>3||e.intervalTicks<1||e.guardTicks<0||e.guardTicks>180||!!d.ultimate!==(e.pulses>1))throw Error('Invalid bell skill');
}
export class BellWorld {
 private waves:Wave[]=[];private forms:Form[]=[];private serial=1;
 private resonance=new Map<string,{count:number;lastTick:number}>();
 count(id:string){return this.resonance.get(id)?.count??0;}
 hasOwner(id:string){return this.forms.some(f=>f.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,(this.forms.find(f=>f.ownerId===id)?.endsTick??tick)-tick);}
 receive(tick:number,results:readonly DamageResult[],owners:ReadonlySet<string>){
  for(const r of results){const id=r.request.targetId,s=r.request.source;
   if(!owners.has(id)||r.outcome!=='applied'||r.appliedDamage<=0||s.attackerId===id||s.kind==='collision'||s.kind==='status')continue;
   const state=this.resonance.get(id)??{count:0,lastTick:-Infinity};
   if(tick-state.lastTick<36)continue;
   state.count=Math.min(3,state.count+1);state.lastTick=tick;this.resonance.set(id,state);
  }
 }
 mitigate(tick:number,request:DamageRequest,locked:ReadonlySet<string>){
  const f=this.forms.find(f=>f.ownerId===request.targetId),e=f?.definition.effect;
  return f&&e?.kind==='bell'&&tick<f.startedTick+e.guardTicks&&!locked.has(f.ownerId)&&request.source.attackerId!==f.ownerId
   ?{...request,amount:request.amount*e.reduction}:request;
 }
 private wave(tick:number,ownerId:string,position:Vec2,d:AbilityDefinition,multiplier:number,radius:number,final:boolean,emit:Emit){
  if(d.effect.kind!=='bell')return;
  this.waves.push({id:`bell-${this.serial++}`,ownerId,abilityId:d.id,position:{...position},radius:0,maxRadius:radius,startedTick:tick,endsTick:tick+d.effect.growthTicks,
   ultimate:!!d.ultimate,final,damage:d.effect.damage*multiplier*(final?1.5:1),hits:new Set()});
  emit({tick,ownerId,abilityId:d.id,kind:'area',point:{...position},reason:final?'bell-final':'bell-wave'});
 }
 start(tick:number,owner:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition,emit:Emit){
  const e=d.effect;if(e.kind!=='bell')return;
  if(d.ultimate)this.forms.push({ownerId:owner.id,abilityId:d.id,position:{x:arena.width/2,y:arena.height/2},startedTick:tick,endsTick:tick+Math.max(e.guardTicks,(e.pulses-1)*e.intervalTicks+e.growthTicks)+1,definition:d,multiplier,index:0,nextTick:tick});
  else{const state=this.resonance.get(owner.id),count=state?.count??0;if(state)state.count=0;this.wave(tick,owner.id,owner.position,d,multiplier,e.radius+count*e.bonusRadiusPerStack,false,emit);}
 }
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit){
  const living=new Map(bodies.map(b=>[b.id,b])),requests:DamageRequest[]=[];
  this.forms=this.forms.filter(f=>living.has(f.ownerId)&&!locked.has(f.ownerId)&&tick<f.endsTick);
  for(const f of this.forms){const e=f.definition.effect;if(e.kind!=='bell')continue;
   if(f.index<e.pulses&&tick>=f.nextTick){this.wave(tick,f.ownerId,f.position,f.definition,f.multiplier,e.radius,f.index===e.pulses-1,emit);f.index++;f.nextTick=tick+e.intervalTicks;}
  }
  this.waves=this.waves.filter(w=>living.has(w.ownerId)&&!locked.has(w.ownerId)&&tick<=w.endsTick);
  for(const w of this.waves){const previous=w.radius;w.radius=w.maxRadius*Math.min(1,(tick-w.startedTick)/(w.endsTick-w.startedTick));
   // A centered bell floats above a central pillar; other pillars still obstruct its waves.
   const waveArena=w.ultimate?{...arena,obstacles:arena.obstacles?.filter(o=>Math.hypot(o.center.x-w.position.x,o.center.y-w.position.y)>o.radius)}:arena;
   for(const b of bodies){if((b.id===w.ownerId&&!w.ultimate)||(b.id!==w.ownerId&&b.ownerId===w.ownerId)||w.hits.has(b.id))continue;
    const from=tick===w.startedTick?b.position:b.previousPosition,dx=b.position.x-from.x,dy=b.position.y-from.y,
     x=from.x-w.position.x,y=from.y-w.position.y,t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1))),
     near=Math.hypot(x+dx*t,y+dy*t),far=Math.max(Math.hypot(x,y),Math.hypot(b.position.x-w.position.x,b.position.y-w.position.y));
    if(near>w.radius+b.radius||far<previous-b.radius)continue;
    const vx=b.position.x-w.position.x,vy=b.position.y-w.position.y,l=Math.hypot(vx,vy);
    if(l>1e-6&&clearSpearLength(w.position,{x:vx/l,y:vy/l},l,0,waveArena)<l-.01)continue;
    w.hits.add(b.id);
    if(b.id===w.ownerId){
     const state=this.resonance.get(b.id)??{count:0,lastTick:-Infinity};
     state.count=Math.min(3,state.count+1);this.resonance.set(b.id,state);continue;
    }
    requests.push({tick,targetId:b.id,amount:w.damage,source:{kind:'area',attackerId:w.ownerId,abilityId:w.abilityId,areaId:w.id}});
    emit({tick,ownerId:w.ownerId,abilityId:w.abilityId,kind:'hit',targetId:b.id,point:{...b.position},reason:w.final?'bell-final':'bell-wave'});
   }
  }return requests;
 }
 confirm(result:DamageResult,bodies:readonly BodySnapshot[]):KnockbackRequest|undefined {
  const s=result.request.source;if(s.kind!=='area'||result.appliedDamage<=0)return;
  const w=this.waves.find(w=>w.id===s.areaId&&w.final),b=bodies.find(b=>b.id===result.request.targetId);
  if(w&&b)return {ownerId:w.ownerId,targetId:b.id,direction:{x:b.position.x-w.position.x,y:b.position.y-w.position.y},strength:220};
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.forms=this.forms.filter(f=>!finished&&living.has(f.ownerId));this.waves=this.waves.filter(w=>!finished&&living.has(w.ownerId));for(const id of this.resonance.keys())if(finished||!living.has(id))this.resonance.delete(id);}
 snapshot(){return {bellWaves:this.waves.map(({damage,hits,...w})=>structuredClone(w)),bellForms:this.forms.map(({definition,multiplier,index,nextTick,...f})=>structuredClone(f))};}
}
