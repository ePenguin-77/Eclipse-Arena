import type { AbilityDefinition, AbilityEvent, FoxHuntSnapshot, FoxEmberSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';
import type { DashRequest } from '../contracts/motion';
import type { StatusState } from '../contracts/status';
import type { RadialForce } from '../contracts/forces';
import { sweepCircle } from '../math/sweep-circle';
import { clearSpearLength } from './spear-world';
import { projectileAim } from './targeting';

type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
type Effect=Extract<AbilityDefinition['effect'],{kind:'fox-hunt'}>;
interface Hunt extends FoxHuntSnapshot { effect:Effect;multiplier:number;nextTick:number;hit:Set<string>;lastPoint:Vec2 }
interface Ember extends FoxEmberSnapshot { damage:number;multiplier:number;charmBonus:number }
const visible=(a:Vec2,b:Vec2,arena:ArenaDefinition)=>{const x=b.x-a.x,y=b.y-a.y,l=Math.hypot(x,y);return l<1e-6||clearSpearLength(a,{x:x/l,y:y/l},l,0,arena)>=l-.01;};
export function validateFox(d:AbilityDefinition){if(d.effect.kind!=='fox-hunt')return;const e=d.effect;
 if(!d.ultimate||d.range===0||![e.damage,e.speed,e.radius,e.emberDamage,e.emberRadius,e.charmBonus].every(Number.isFinite)||e.damage<=0||e.speed<100||e.speed>1400||e.radius<1||e.radius>70||e.emberDamage<=0||e.emberRadius<20||e.emberRadius>120||e.charmBonus<1||e.charmBonus>1.5||![e.dashTicks,e.pauseTicks,e.emberDelay].every(Number.isInteger)||e.dashTicks<1||e.dashTicks>30||e.pauseTicks<6||e.pauseTicks>60||e.emberDelay<1||e.emberDelay>60)throw Error('Invalid fox hunt');
}
export class FoxWorld {
 private hunts:Hunt[]=[];private embers:Ember[]=[];private serial=1;private statuses:readonly StatusState[]=[];
 syncStatuses(states:readonly StatusState[]){this.statuses=states;}
 hasOwner(id:string){return this.hunts.some(h=>h.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,(this.hunts.find(h=>h.ownerId===id)?.endsTick??tick)-tick);}
 charmed(owner:string,target:string,tick:number){return this.statuses.some(s=>s.sourceId===owner&&s.targetId===target&&s.definition.effect.kind==='charm'&&s.appliedTick<=tick&&tick<s.expiresTick);}
 forces(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[]):RadialForce[]{
  const result:RadialForce[]=[];
  for(const s of this.statuses){const e=s.definition.effect;if(e.kind!=='charm'||tick<s.appliedTick||tick>=Math.min(s.expiresTick,s.appliedTick+e.steerTicks))continue;
   const a=bodies.find(b=>b.id===s.sourceId),b=bodies.find(b=>b.id===s.targetId);
   if(a&&b&&visible(a.position,b.position,arena))result.push({ownerId:a.id,targetId:b.id,position:{...a.position},radius:Math.hypot(arena.width,arena.height),acceleration:e.acceleration});
  }return result;
 }
 start(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number){
  if(d.effect.kind!=='fox-hunt'||this.hasOwner(owner.id))return;const e=d.effect;
  this.hunts.push({ownerId:owner.id,targetId:target.id,abilityId:d.id,startedTick:tick,endsTick:tick+3*(e.dashTicks+e.pauseTicks)+e.emberDelay+1,phase:0,dashUntil:tick,position:{...owner.position},direction:{x:1,y:0},effect:e,multiplier,nextTick:tick,hit:new Set(),lastPoint:{...owner.position}});
 }
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit){
  const requests:DamageRequest[]=[],motions:DashRequest[]=[];const living=new Set(bodies.map(b=>b.id));
  this.hunts=this.hunts.filter(h=>living.has(h.ownerId)&&!locked.has(h.ownerId)&&tick<h.endsTick);
  this.embers=this.embers.filter(e=>living.has(e.ownerId)&&!locked.has(e.ownerId));
  for(const h of this.hunts){const owner=bodies.find(b=>b.id===h.ownerId)!,e=h.effect;h.position={...owner.position};
   if(h.phase>0&&tick<=h.dashUntil){
    if(tick===h.dashUntil-Math.floor(e.dashTicks/2))h.lastPoint={...owner.position};
    for(const b of bodies){if(b.id===owner.id||b.ownerId===owner.id||h.hit.has(b.id))continue;
     const start={x:owner.previousPosition.x-b.previousPosition.x,y:owner.previousPosition.y-b.previousPosition.y},end={x:owner.position.x-b.position.x,y:owner.position.y-b.position.y};
     if(sweepCircle(start,end,e.radius+b.radius)===null||!visible(owner.position,b.position,arena))continue;
     h.hit.add(b.id);const bonus=h.phase===3&&this.charmed(owner.id,b.id,tick)?e.charmBonus:1;
     requests.push({tick,targetId:b.id,amount:e.damage*h.multiplier*(h.phase===3?1.5:1)*bonus,source:{kind:'melee',attackerId:owner.id,abilityId:h.abilityId}});
     emit({tick,ownerId:owner.id,abilityId:h.abilityId,kind:'hit',point:{...b.position},targetId:b.id,reason:'fox-cross'});
    }
    if(tick===h.dashUntil){const position={...h.lastPoint};
     this.embers.push({id:`fox-ember-${this.serial++}`,ownerId:owner.id,abilityId:h.abilityId,position,radius:e.emberRadius,startedTick:tick,detonatesTick:tick+e.emberDelay,final:h.phase===3,damage:e.emberDamage,multiplier:h.multiplier,charmBonus:e.charmBonus});
    }
   }
   if(h.phase>=3||tick<h.nextTick)continue;
   const target=bodies.find(b=>b.id===h.targetId&&b.id!==owner.id&&b.ownerId!==owner.id)??bodies.filter(b=>b.id!==owner.id&&!b.ownerId).sort((a,b)=>Math.hypot(a.position.x-owner.position.x,a.position.y-owner.position.y)-Math.hypot(b.position.x-owner.position.x,b.position.y-owner.position.y))[0];
   if(!target){h.endsTick=tick;continue;}
   h.targetId=target.id;h.phase++;h.hit.clear();h.lastPoint={...owner.position};
   h.direction=projectileAim(owner,target,arena,e.speed,e.radius,e.dashTicks/60,.18);
   h.dashUntil=tick+e.dashTicks;h.nextTick=h.dashUntil+e.pauseTicks;
   motions.push({ownerId:owner.id,targetId:target.id,abilityId:h.abilityId,direction:{...h.direction},speed:e.speed,durationTicks:e.dashTicks,endOnCross:false});
  }
  for(const e of this.embers){if(tick<e.detonatesTick)continue;
   emit({tick,ownerId:e.ownerId,abilityId:e.abilityId,kind:'detonate',point:{...e.position},reason:'fox-ember'});
   for(const b of bodies){if(b.id===e.ownerId||b.ownerId===e.ownerId||Math.hypot(b.position.x-e.position.x,b.position.y-e.position.y)>e.radius+b.radius||!visible(e.position,b.position,arena))continue;
    const bonus=e.final&&this.charmed(e.ownerId,b.id,tick)?e.charmBonus:1;
    requests.push({tick,targetId:b.id,amount:e.damage*e.multiplier*bonus,source:{kind:'area',attackerId:e.ownerId,abilityId:e.abilityId,areaId:e.id}});
   }
  }
  this.embers=this.embers.filter(e=>tick<e.detonatesTick);
  return {requests,motions};
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.hunts=this.hunts.filter(h=>!finished&&living.has(h.ownerId));this.embers=this.embers.filter(e=>!finished&&living.has(e.ownerId));}
 snapshot(){return {foxHunts:this.hunts.map(({effect,multiplier,nextTick,hit,lastPoint,...h})=>structuredClone(h)),foxEmbers:this.embers.map(({damage,multiplier,charmBonus,...e})=>structuredClone(e))};}
}
