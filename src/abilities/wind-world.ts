import type {AbilityDefinition,AbilityEvent} from '../contracts/abilities';
import type {ArenaDefinition,BodySnapshot,Vec2} from '../contracts/types';
import type {DamageRequest} from '../contracts/combat';
import type {KnockbackRequest,VortexField} from '../contracts/forces';
import {sweepTouches} from './sweep-world';
import {clearSpearLength} from './spear-world';
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
type Fan={ownerId:string;definition:AbilityDefinition;origin:Vec2;angle:number;endsTick:number;multiplier:number;hits:Set<string>};
type Storm={id:string;ownerId:string;definition:AbilityDefinition;position:Vec2;radius:number;eyeRadius:number;startedTick:number;endsTick:number;nextTick:number;multiplier:number};
export function validateWind(d:AbilityDefinition){
 const e=d.effect;if(e.kind!=='wind-fan'&&e.kind!=='wind-storm')return;
 if(!Number.isFinite(e.damage)||e.damage<=0||!Number.isFinite(e.radius)||e.radius<80||e.radius>220)throw Error('Invalid wind');
 if(e.kind==='wind-fan'&&(d.ultimate||!Number.isFinite(e.arcDegrees)||e.arcDegrees<45||e.arcDegrees>160||!Number.isInteger(e.activeTicks)||e.activeTicks<1||e.activeTicks>18||!Number.isFinite(e.push)||e.push<100||e.push>900))throw Error('Invalid fan');
 if(e.kind==='wind-storm'&&(!d.ultimate||!Number.isFinite(e.eyeRadius)||e.eyeRadius<50||e.eyeRadius>=e.radius-25||!Number.isInteger(e.durationTicks)||e.durationTicks<60||e.durationTicks>360||!Number.isInteger(e.intervalTicks)||e.intervalTicks<24||e.intervalTicks>120||!Number.isFinite(e.turnRate)||e.turnRate<.2||e.turnRate>3))throw Error('Invalid storm');
}
export class WindWorld {
 private fans:Fan[]=[];private storms:Storm[]=[];private serial=0;
 private pushes:{targetId:string;ownerId:string;tick:number;abilityId:string;direction:Vec2;strength:number}[]=[];
 startFan(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,emit:Emit){
  if(d.effect.kind!=='wind-fan')return;
  const angle=Math.atan2(target.position.y-owner.position.y,target.position.x-owner.position.x);
  this.fans.push({ownerId:owner.id,definition:d,origin:{...owner.position},angle,endsTick:tick+d.effect.activeTicks,multiplier,hits:new Set()});
  emit({tick,ownerId:owner.id,abilityId:d.id,kind:'thrust',point:{...owner.position},end:{x:owner.position.x+Math.cos(angle)*d.effect.radius,y:owner.position.y+Math.sin(angle)*d.effect.radius},reason:'wind-fan'});
 }
 startStorm(tick:number,owner:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(d.effect.kind!=='wind-storm'||this.hasOwner(owner.id))return false;
  const e=d.effect,radius=Math.min(e.radius,Math.min(arena.width,arena.height)/2-16),scale=radius/e.radius;
  this.storms.push({id:`wind-${++this.serial}`,ownerId:owner.id,definition:d,position:{x:arena.width/2,y:arena.height/2},radius,eyeRadius:e.eyeRadius*scale,startedTick:tick,endsTick:tick+e.durationTicks,nextTick:tick+e.intervalTicks,multiplier});return true;
 }
 hasOwner(id:string){return this.storms.some(s=>s.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,...this.storms.filter(s=>s.ownerId===id).map(s=>s.endsTick-tick));}
 fields(tick:number,living:ReadonlySet<string>,locked:ReadonlySet<string>):VortexField[]{
  this.storms=this.storms.filter(s=>s.endsTick>tick&&living.has(s.ownerId)&&!locked.has(s.ownerId));
  return this.storms.map(s=>({position:{...s.position},radius:s.radius,eyeRadius:s.eyeRadius,turnRate:s.definition.effect.kind==='wind-storm'?s.definition.effect.turnRate:0}));
 }
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit){
  this.fields(tick,new Set(bodies.map(b=>b.id)),locked);const requests:DamageRequest[]=[];
  this.pushes=this.pushes.filter(p=>p.tick>=tick);
  this.fans=this.fans.filter(f=>{
   if(tick>=f.endsTick||locked.has(f.ownerId)||!bodies.some(b=>b.id===f.ownerId))return false;
   const e=f.definition.effect;if(e.kind!=='wind-fan')return false;
   for(const b of bodies){
    if(b.id===f.ownerId||b.ownerId===f.ownerId||f.hits.has(b.id)||!sweepTouches(f.origin,f.angle,e.radius,e.arcDegrees,b))continue;
    const dx=b.position.x-f.origin.x,dy=b.position.y-f.origin.y,dist=Math.hypot(dx,dy);
    if(dist>0&&clearSpearLength(f.origin,{x:dx/dist,y:dy/dist},dist,0,arena)<dist-.01)continue;
    f.hits.add(b.id);requests.push({tick,targetId:b.id,amount:e.damage*f.multiplier,source:{kind:'melee',attackerId:f.ownerId,abilityId:f.definition.id}});
    // A perpendicular strike changes the lane instead of pushing directly away.
    this.pushes.push({tick,targetId:b.id,ownerId:f.ownerId,abilityId:f.definition.id,direction:{x:-Math.sin(f.angle),y:Math.cos(f.angle)},strength:e.push});
    emit({tick,ownerId:f.ownerId,abilityId:f.definition.id,kind:'hit',point:{...b.position},targetId:b.id,reason:'wind-fan-hit'});
   }return true;
  });
  for(const s of this.storms){
   const e=s.definition.effect;if(e.kind!=='wind-storm'||tick<s.nextTick)continue;s.nextTick=tick+e.intervalTicks;
   for(const b of bodies){
    if(b.id===s.ownerId||b.ownerId===s.ownerId)continue;
    const r=Math.hypot(b.position.x-s.position.x,b.position.y-s.position.y);
    // Center-in-annulus rule makes the visible empty eye reliably safe.
    if(r<=s.eyeRadius||r>s.radius)continue;
    requests.push({tick,targetId:b.id,amount:e.damage*s.multiplier,source:{kind:'area',attackerId:s.ownerId,abilityId:s.definition.id,areaId:s.id}});
    emit({tick,ownerId:s.ownerId,abilityId:s.definition.id,kind:'hit',targetId:b.id,point:{...b.position},reason:'wind-rim'});
   }
  }return requests;
 }
 confirmedPush(tick:number,ownerId:string,targetId:string,abilityId:string):KnockbackRequest|undefined {
  const i=this.pushes.findIndex(p=>p.tick===tick&&p.ownerId===ownerId&&p.targetId===targetId&&p.abilityId===abilityId);
  if(i<0)return;const p=this.pushes.splice(i,1)[0]!;return {ownerId,targetId,direction:p.direction,strength:p.strength};
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.fans=this.fans.filter(f=>!finished&&living.has(f.ownerId));this.storms=this.storms.filter(s=>!finished&&living.has(s.ownerId));this.pushes=this.pushes.filter(p=>!finished&&living.has(p.ownerId)&&living.has(p.targetId));}
 snapshot(){return this.storms.map(s=>({id:s.id,ownerId:s.ownerId,abilityId:s.definition.id,position:{...s.position},radius:s.radius,eyeRadius:s.eyeRadius,startedTick:s.startedTick,endsTick:s.endsTick}));}
}
