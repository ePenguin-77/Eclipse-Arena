import type { AbilityDefinition, AbilityEvent, GatesSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot } from '../contracts/types';
import type { DamageRequest, DamageResult } from '../contracts/combat';
import type { DashRequest } from '../contracts/motion';
import type { KnockbackRequest } from '../contracts/forces';
import { clearSpearLength } from './spear-world';
import { retraceTouches } from './retrace-world';

type Emit = (e: Omit<AbilityEvent, 'id'>) => void;
type Attack = {ownerId:string;targetId:string;abilityId:string;ultimate:boolean;gates:number;startedTick:number;endsTick:number;nextTick:number;index:number;hits:number;phase:'approach'|'combo';damage:number;direction:{x:number;y:number}};
const distance=(a:BodySnapshot,b:BodySnapshot)=>Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y);
export function validateGates(d:AbilityDefinition) {
 if(d.effect.kind!=='gates-punch'&&d.effect.kind!=='gates-combo')return;
 if(d.range!==3||d.effect.damage<=0||d.effect.damage>40||!Number.isFinite(d.effect.damage)||Boolean(d.ultimate)!==(d.effect.kind==='gates-combo'))throw Error('Invalid gates ability');
}
/** Gates are earned only by confirmed basic damage, never by animation or attempts. */
export class GatesWorld {
 private counts=new Map<string,number>();
 private attacks=new Map<string,Attack>();
 private pending=new Map<string,{tick:number;targetId:string;ultimate:boolean;finisher:boolean;direction:{x:number;y:number}}>();
 private motions:DashRequest[]=[];
 private costs:{ownerId:string;amount:number}[]=[];
 count(id:string){return this.counts.get(id)??0;}
 hasOwner(id:string){return this.attacks.has(id);}
 remaining(id:string,tick:number){return Math.max(0,(this.attacks.get(id)?.endsTick??tick)-tick);}
 target(owner:BodySnapshot,bodies:readonly BodySnapshot[],ultimate=false) {
  const reach=ultimate?185:105+this.count(owner.id)*12;
  return bodies.filter(b=>b.id!==owner.id&&!b.ownerId&&distance(owner,b)<=owner.radius+b.radius+reach).sort((a,b)=>distance(owner,a)-distance(owner,b)||a.id.localeCompare(b.id))[0];
 }
 start(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,emit:Emit) {
  if(this.hasOwner(owner.id))return false;
  const ultimate=d.effect.kind==='gates-combo',gates=this.count(owner.id);
  if(ultimate&&gates<1)return false;
  const dx=target.position.x-owner.position.x,dy=target.position.y-owner.position.y,len=Math.hypot(dx,dy)||1;
  const direction={x:dx/len,y:dy/len};
  if(ultimate)this.counts.set(owner.id,0);
  if(gates>=5)this.costs.push({ownerId:owner.id,amount:gates>=7?2:1});
  this.attacks.set(owner.id,{ownerId:owner.id,targetId:target.id,abilityId:d.id,ultimate,gates,startedTick:tick,endsTick:tick+24,nextTick:tick+1,index:0,hits:ultimate?gates+2:1,phase:'approach',damage:d.effect.damage*multiplier*(ultimate?1:1+gates*.08),direction});
  this.motions.push({ownerId:owner.id,targetId:target.id,abilityId:d.id,speed:ultimate?980:780+gates*25,durationTicks:18,phaseTarget:false,direction});
  emit({tick,ownerId:owner.id,targetId:target.id,abilityId:d.id,kind:'cast',point:{...owner.position},end:{...target.position}});
  return true;
 }
 takeMotions(){const r=this.motions;this.motions=[];return r;}
 takeCosts(){const r=this.costs;this.costs=[];return r;}
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit):DamageRequest[]{
  const requests:DamageRequest[]=[];
  for(const [id,a] of this.attacks){
   const owner=bodies.find(b=>b.id===id),target=bodies.find(b=>b.id===a.targetId);
   if(!owner||!target||locked.has(id)||tick>a.endsTick){this.attacks.delete(id);continue;}
   if(tick<a.nextTick)continue;
   const dx=target.position.x-owner.position.x,dy=target.position.y-owner.position.y,len=Math.hypot(dx,dy)||1,dir={x:dx/len,y:dy/len};
   const clear=clearSpearLength(owner.position,dir,len,0,arena)>=len-target.radius;
   const reach=owner.radius+target.radius+(a.phase==='combo'?58:22);
   // Swept contact catches fast crossing, but ignores discontinuous portal jumps.
   const continuous=(b:BodySnapshot)=>Math.hypot(b.position.x-b.previousPosition.x,b.position.y-b.previousPosition.y)<50;
   const near=len<=reach||(a.phase==='approach'&&continuous(owner)&&continuous(target)&&retraceTouches(owner.previousPosition,owner.position,target.previousPosition,target.position,reach));
   if(a.phase==='approach'&&(!near||!clear))continue;
   if(a.phase==='approach'&&a.ultimate){a.phase='combo';a.endsTick=tick+a.hits*10+6;}
   const last=a.index===a.hits-1;
   if(near&&clear){
    const amount=a.damage*(a.ultimate&&last?3:1);
    requests.push({tick,targetId:target.id,amount,source:{kind:'melee',attackerId:id,abilityId:a.abilityId}});
    this.pending.set(id,{tick,targetId:target.id,ultimate:a.ultimate,finisher:a.ultimate&&last,direction:dir});
    emit({tick,ownerId:id,targetId:target.id,abilityId:a.abilityId,kind:'hit',point:{...target.position},end:{...owner.position}});
   }
   emit({tick,ownerId:id,targetId:target.id,abilityId:a.abilityId,kind:last&&a.ultimate?'finisher':'slash',point:{...owner.position},end:{...target.position},reason:'gates-fist'});
   a.index++;a.nextTick=tick+10;
   if(a.index>=a.hits){this.attacks.delete(id);continue;}
   // Short follow-throughs pursue without teleporting or bypassing solid pillars.
   if(len<260)this.motions.push({ownerId:id,targetId:target.id,abilityId:a.abilityId,speed:660,durationTicks:6,phaseTarget:false,direction:dir});
  }
  return requests;
 }
 confirm(tick:number,results:readonly DamageResult[],living:ReadonlySet<string>):KnockbackRequest[]{
  const pushes:KnockbackRequest[]=[];
  for(const [id,p] of this.pending){
   if(p.tick!==tick||!living.has(id)){this.pending.delete(id);continue;}
   const hit=results.some(r=>r.appliedDamage>0&&r.request.tick===tick&&r.request.targetId===p.targetId&&r.request.source.attackerId===id&&r.request.source.kind==='melee'&&r.request.source.abilityId===(p.ultimate?'gates-unleash':'gates-strike'));
   if(hit&&!p.ultimate)this.counts.set(id,Math.min(8,this.count(id)+1));
   if(hit&&p.finisher&&living.has(p.targetId))pushes.push({ownerId:id,targetId:p.targetId,direction:p.direction,strength:680});
   this.pending.delete(id);
  }
  return pushes;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){
  for(const id of this.counts.keys())if(finished||!living.has(id))this.counts.delete(id);
  for(const id of this.attacks.keys())if(finished||!living.has(id))this.attacks.delete(id);
  this.motions=this.motions.filter(m=>!finished&&living.has(m.ownerId));
 }
 snapshot():GatesSnapshot[]{return [...new Set([...this.counts.keys(),...this.attacks.keys()])].map(ownerId=>{const a=this.attacks.get(ownerId);return {ownerId,count:this.count(ownerId),activeGates:a?.gates??0,phase:a?.phase??'idle',ultimate:a?.ultimate??false,hitIndex:a?.index??0,hits:a?.hits??0};});}
}
