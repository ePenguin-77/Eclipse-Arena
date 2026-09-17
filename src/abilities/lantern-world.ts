import type { AbilityDefinition,AbilityEvent,ProjectileSnapshot,LanternSnapshot,SoulReleaseSnapshot } from '../contracts/abilities';
import type { BodySnapshot,ArenaDefinition,Vec2 } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';
import type { ProjectileCapture } from '../projectiles/projectile-world';
import { sweepCircle } from '../projectiles/sweep';
import { clearOfArena } from '../arenas/arena-registry';
import { abilityTarget,projectileAim } from './targeting';
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
type Lamp=LanternSnapshot & {damage:number;counterMultiplier:number;reduction:number;targetId:string};
type Release=SoulReleaseSnapshot & {damage:number;nextTick:number;interval:number;speed:number;guideTicks:number;lifetime:number};
type Shot=Omit<ProjectileSnapshot,'id'>;
const aim=(a:Vec2,b:Vec2)=>{const x=b.x-a.x,y=b.y-a.y,n=Math.hypot(x,y);return n>1e-8?{x:x/n,y:y/n}:{x:1,y:0};};
export function validateLantern(d:AbilityDefinition){
 const e=d.effect;
 if(e.kind==='lantern' && (d.ultimate || !Number.isInteger(e.receiveTicks)||e.receiveTicks<1||e.receiveTicks>60||!Number.isFinite(e.reduction)||e.reduction<0||e.reduction>.5||!Number.isFinite(e.counterMultiplier)||e.counterMultiplier<1||e.counterMultiplier>1.5))throw Error('Invalid lantern');
 if(e.kind==='soul-release' && (!d.ultimate||!Number.isInteger(e.intervalTicks)||e.intervalTicks<12||e.intervalTicks>60||!Number.isFinite(e.speed)||e.speed<200||e.speed>900||!Number.isInteger(e.guideTicks)||e.guideTicks<0||e.guideTicks>30||!Number.isInteger(e.lifetimeTicks)||e.lifetimeTicks<=e.guideTicks||e.lifetimeTicks>120))throw Error('Invalid soul release');
}
export class LanternWorld {
 private lamps:Lamp[]=[];private releases:Release[]=[];private fuel=new Map<string,number>();
 hasLamp(id:string){return this.lamps.some(l=>l.ownerId===id);}
 hasUltimate(id:string){return this.releases.some(r=>r.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,...this.releases.filter(r=>r.ownerId===id).map(r=>r.endsTick-tick));}
 private point(owner:BodySnapshot,target:BodySnapshot,arena:ArenaDefinition){const dir=aim(owner.position,target.position),r=27;
  const p={x:Math.max(r+1,Math.min(arena.width-r-1,owner.position.x+dir.x*52)),y:Math.max(r+1,Math.min(arena.height-r-1,owner.position.y+dir.y*52))};
  return clearOfArena(arena,p,r)?p:{...owner.position};}
 start(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(d.effect.kind!=='lantern'||this.hasLamp(owner.id))return false;const e=d.effect,p=this.point(owner,target,arena);
  this.lamps.push({ownerId:owner.id,abilityId:d.id,position:p,previousPosition:{...p},radius:27,startedTick:tick,endsTick:tick+e.receiveTicks,received:false,
   damage:e.damage*multiplier,counterMultiplier:e.counterMultiplier,reduction:e.reduction,targetId:target.id});return true;
 }
 startUltimate(tick:number,owner:BodySnapshot,d:AbilityDefinition,multiplier:number){
  if(d.effect.kind!=='soul-release'||this.hasUltimate(owner.id))return false;const e=d.effect,total=3+(this.fuel.get(owner.id)??0);this.fuel.set(owner.id,0);
  this.releases.push({ownerId:owner.id,abilityId:d.id,position:{...owner.position},startedTick:tick,endsTick:tick+total*e.intervalTicks+e.lifetimeTicks,total,remaining:total,
   nextTick:tick+8,damage:e.damage*multiplier,interval:e.intervalTicks,speed:e.speed,guideTicks:e.guideTicks,lifetime:e.lifetimeTicks});return true;
 }
 private receive(l:Lamp,tick:number,attackerId:string,emit:Emit){
  l.received=true;l.targetId=attackerId;l.endsTick=tick;
  // Fuel gained while an ultimate is releasing is reserved for the next ultimate.
  this.fuel.set(l.ownerId,Math.min(3,(this.fuel.get(l.ownerId)??0)+1));
  emit({tick,ownerId:l.ownerId,abilityId:l.abilityId,kind:'area',point:{...l.position},reason:'lantern-capture'});
 }
 mitigate(tick:number,r:DamageRequest,melee:boolean,locked:ReadonlySet<string>,emit:Emit){
  if(!melee||r.amount<=0||r.dodged||r.source.attackerId===r.targetId||locked.has(r.targetId))return r;
  const lamp=this.lamps.find(l=>l.ownerId===r.targetId&&!l.received&&tick<l.endsTick);if(!lamp)return r;
  this.receive(lamp,tick,r.source.attackerId,emit);return {...r,amount:r.amount*(1-lamp.reduction)};
 }
 capture(tick:number,p:ProjectileSnapshot,start:Vec2,end:Vec2,locked:ReadonlySet<string>,emit:Emit):ProjectileCapture|undefined{
  const hits=this.lamps.filter(l=>l.ownerId!==p.ownerId&&!locked.has(l.ownerId)&&!l.received&&tick<l.endsTick)
   .map(l=>({l,time:sweepCircle({x:start.x-l.previousPosition.x,y:start.y-l.previousPosition.y},{x:end.x-l.position.x,y:end.y-l.position.y},l.radius+p.radius)}))
   .filter((v):v is {l:Lamp;time:number}=>v.time!==null).sort((a,b)=>a.time-b.time||a.l.ownerId.localeCompare(b.l.ownerId));
  const hit=hits[0];return hit?{time:hit.time,commit:()=>this.receive(hit.l,tick,p.ownerId,emit)}:undefined;
 }
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit):Shot[]{
  const shots:Shot[]=[];
  this.lamps=this.lamps.filter(l=>{
   const owner=bodies.find(b=>b.id===l.ownerId);if(!owner||locked.has(owner.id))return false;
   const target=bodies.find(b=>b.id===l.targetId&&b.id!==owner.id&&b.ownerId!==owner.id)??abilityTarget(owner,bodies,5);if(!target)return false;
   l.previousPosition={...l.position};l.position=this.point(owner,target,arena);
   if(tick<l.endsTick)return true;
   const direction=projectileAim({...owner,position:l.position},target,arena,690,15,1.5,.18);
   shots.push({ownerId:owner.id,abilityId:l.abilityId,position:{...l.position},previousPosition:{...l.position},velocity:{x:direction.x*690,y:direction.y*690},radius:15,
    damage:l.damage*(l.received?l.counterMultiplier:1),spawnedTick:tick,expiresTick:tick+90});
   emit({tick,ownerId:owner.id,abilityId:l.abilityId,kind:'projectile',point:{...l.position},reason:l.received?'lantern-counter':'lantern-launch'});return false;
  });
  this.releases=this.releases.filter(r=>{
   const owner=bodies.find(b=>b.id===r.ownerId);if(!owner||locked.has(owner.id)||tick>=r.endsTick)return false;
   const target=abilityTarget(owner,bodies,5);if(!target)return false;
   r.position=this.point(owner,target,arena);if(r.remaining<=0||tick<r.nextTick)return true;
   const dir=aim(owner.position,target.position),offset=(r.total-r.remaining)%2===0?.65:-.65;
   const direction={x:dir.x*Math.cos(offset)-dir.y*Math.sin(offset),y:dir.x*Math.sin(offset)+dir.y*Math.cos(offset)};
   shots.push({ownerId:owner.id,abilityId:r.abilityId,position:{...r.position},previousPosition:{...r.position},velocity:{x:direction.x*r.speed,y:direction.y*r.speed},radius:12,damage:r.damage,
    spawnedTick:tick,expiresTick:tick+r.lifetime,seeking:{targetId:target.id,endsTick:tick+r.guideTicks,turnRate:4.5}});
   r.remaining--;r.nextTick=tick+r.interval;
   emit({tick,ownerId:owner.id,abilityId:r.abilityId,kind:'projectile',point:{...owner.position},reason:'soul-release'});return true;
  });
  return shots;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){
  this.lamps=this.lamps.filter(l=>!finished&&living.has(l.ownerId));this.releases=this.releases.filter(r=>!finished&&living.has(r.ownerId));
  for(const id of this.fuel.keys())if(finished||!living.has(id))this.fuel.delete(id);
 }
 snapshot(){return {lanterns:this.lamps.map(({damage,counterMultiplier,reduction,targetId,...l})=>structuredClone(l)),
  soulReleases:this.releases.map(({damage,nextTick,interval,speed,guideTicks,lifetime,...r})=>structuredClone(r)),soulFuel:[...this.fuel].map(([ownerId,amount])=>({ownerId,amount}))};}
}
