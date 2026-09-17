import type { AbilityDefinition, AbilityEvent, FateThreadSnapshot, ThreadMarkSnapshot } from '../contracts/abilities';
import type { DamageRequest, DamageResult } from '../contracts/combat';
import type { ArenaDefinition, BodySnapshot, PhysicsEvent, Vec2 } from '../contracts/types';
import type { KnockbackRequest } from '../contracts/forces';
import { clearSpearLength } from './spear-world';

type Emit=(event:Omit<AbilityEvent,'id'>)=>void;
type Mark=ThreadMarkSnapshot & {damage:number};
type Tether=FateThreadSnapshot & {damage:number;bonus:number;strength:number;interval:number;pending?:number};
const key=(owner:string,target:string)=>`${owner}:${target}`;
const distance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.y-b.y);
function visible(a:Vec2,b:Vec2,arena:ArenaDefinition){
 const len=distance(a,b);return len<.001||clearSpearLength(a,{x:(b.x-a.x)/len,y:(b.y-a.y)/len},len,0,arena)>=len-.01;
}

export function validateThread(d:AbilityDefinition){
 if(d.effect.kind!=='projectile'||!d.effect.fateThread)return;
 const e=d.effect.fateThread;
 if((e.maxJerks!==undefined&&(!Number.isInteger(e.maxJerks)||e.maxJerks<1||e.maxJerks>5))||
  (e.jerkIntervalTicks!==undefined&&(!Number.isInteger(e.jerkIntervalTicks)||e.jerkIntervalTicks<30)))throw Error('Invalid fate thread timing');
 if(!['mark','tether'].includes(e.mode)||!Number.isInteger(e.durationTicks)||e.durationTicks<1||e.durationTicks>600||!Number.isFinite(e.bonusDamage)||e.bonusDamage<0||
  (e.mode==='tether'&&(!Number.isFinite(e.jerkDamage)||e.jerkDamage!<=0||!Number.isFinite(e.strength)||e.strength!<=0||e.strength!>1200||!Number.isFinite(e.slack)||e.slack!<20)))throw Error('Invalid fate thread');
}

/** Wall-anchored silk reels in on discrete pulses; shared physics resolves each confirmed pull. */
export class ThreadWorld {
 private marks=new Map<string,Mark>();
 private threads:Tether[]=[];
 private arena?:ArenaDefinition;
 private locked:ReadonlySet<string>=new Set();
 private multipliers:ReadonlyMap<string,number>=new Map();
 private sequence=0;
 hasOwner(id:string){return this.threads.some(t=>t.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,...this.threads.filter(t=>t.ownerId===id).map(t=>t.endsTick-tick));}
 confirm(tick:number,result:DamageResult,d:AbilityDefinition,bodies:readonly BodySnapshot[],living:ReadonlySet<string>){
  const source=result.request.source;
  if(d.effect.kind!=='projectile'||!d.effect.fateThread)return;
  const e=d.effect.fateThread;
  if(source.kind!=='projectile'||result.appliedDamage<=0||!living.has(source.attackerId)||!living.has(result.request.targetId)||this.locked.has(source.attackerId))return;
  const b=bodies.find(b=>b.id===result.request.targetId);if(!b||b.ownerId)return;
  // Combat results already contain global scaling and mitigation. Do not scale those twice.
  const owner=source.attackerId,k=key(owner,b.id),multiplier=this.multipliers.get(owner)??1;
  if(e.mode==='mark'){
   this.marks.set(k,{ownerId:owner,targetId:b.id,abilityId:d.id,startedTick:tick,endsTick:tick+e.durationTicks,damage:e.bonusDamage*multiplier});return;
  }
  if(!this.arena)return;
  const {width,height}=this.arena;
  const anchors=[{x:0,y:b.position.y},{x:width,y:b.position.y},{x:b.position.x,y:0},{x:b.position.x,y:height}]
   .sort((a,z)=>distance(a,b.position)-distance(z,b.position));
  const anchor=anchors.find(a=>visible(b.position,a,this.arena!));if(!anchor)return;
  const mark=this.marks.get(k),empowered=!!mark&&mark.endsTick>tick;
  if(empowered)this.marks.delete(k);
  this.threads=this.threads.filter(t=>t.ownerId!==owner);
  this.threads.push({id:`fate-${++this.sequence}`,ownerId:owner,targetId:b.id,abilityId:d.id,anchor,
   length:distance(anchor,b.position)+e.slack!,startedTick:tick,endsTick:tick+e.durationTicks,
   jerks:0,maxJerks:e.maxJerks??2,interval:e.jerkIntervalTicks??30,lastJerkTick:tick+30-(e.jerkIntervalTicks??30),empowered,damage:e.jerkDamage!*multiplier,bonus:e.bonusDamage*multiplier,strength:e.strength!});
 }
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,impacts:readonly Omit<PhysicsEvent,'id'>[],emit:Emit,multipliers:ReadonlyMap<string,number>=new Map()){
  this.arena=arena;this.locked=locked;this.multipliers=multipliers;
  const living=new Map(bodies.map(b=>[b.id,b])),requests:DamageRequest[]=[];
  for(const [k,m] of this.marks){
   if(tick>=m.endsTick||!living.has(m.ownerId)||!living.has(m.targetId)||locked.has(m.ownerId)){this.marks.delete(k);continue;}
   // Only a NEW real wall rebound can consume the mark, never the landing tick.
   const bounce=impacts.find(e=>e.bodyId===m.targetId&&e.type==='wall'&&e.impulseApplied&&e.tick>m.startedTick);
   if(bounce){
    this.marks.delete(k);requests.push({tick,targetId:m.targetId,amount:m.damage,source:{kind:'area',attackerId:m.ownerId,abilityId:m.abilityId,areaId:`thread-mark-${k}`}});
    emit({tick,ownerId:m.ownerId,targetId:m.targetId,abilityId:m.abilityId,kind:'hit',point:{...living.get(m.targetId)!.position},reason:'thread-snap'});
   }
  }
  this.threads=this.threads.filter(t=>tick<t.endsTick&&living.has(t.ownerId)&&living.has(t.targetId)&&!locked.has(t.ownerId)&&visible(living.get(t.targetId)!.position,t.anchor,arena));
  for(const t of this.threads){
   const b=living.get(t.targetId)!,len=distance(b.position,t.anchor);
   if(t.jerks>=t.maxJerks||tick-t.lastJerkTick<t.interval||tick-t.startedTick<30)continue;
   // Reel the slack in even when the target never runs away from its wall anchor.
   t.length=Math.max(b.radius+6,len-32);
   t.jerks++;t.lastJerkTick=tick;t.pending=tick;
   requests.push({tick,targetId:t.targetId,amount:t.damage+(t.jerks===t.maxJerks&&t.empowered?t.bonus:0),source:{kind:'area',attackerId:t.ownerId,abilityId:t.abilityId,areaId:t.id}});
   emit({tick,ownerId:t.ownerId,targetId:t.targetId,abilityId:t.abilityId,kind:'hit',point:{...b.position},reason:t.jerks===t.maxJerks?'thread-break':'thread-tug'});
   if(t.jerks===t.maxJerks)t.endsTick=Math.min(t.endsTick,tick+10);
  }
  return requests;
 }
 confirmJerk(result:DamageResult,bodies:readonly BodySnapshot[]):KnockbackRequest|undefined{
  const s=result.request.source;if(s.kind!=='area')return;
  const t=this.threads.find(t=>t.id===s.areaId&&t.pending===result.request.tick);if(!t)return;
  t.pending=undefined;
  const b=bodies.find(b=>b.id===t.targetId);if(result.appliedDamage<=0||!b)return;
  return {ownerId:t.ownerId,targetId:t.targetId,direction:{x:t.anchor.x-b.position.x,y:t.anchor.y-b.position.y},strength:t.strength};
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){
  for(const [k,m] of this.marks)if(finished||!living.has(m.ownerId)||!living.has(m.targetId))this.marks.delete(k);
  this.threads=this.threads.filter(t=>!finished&&living.has(t.ownerId)&&living.has(t.targetId));
 }
 snapshot(){return {threadMarks:[...this.marks.values()].map(({damage,...m})=>structuredClone(m)),fateThreads:this.threads.map(({damage,bonus,strength,interval,pending,...t})=>structuredClone(t))};}
}
