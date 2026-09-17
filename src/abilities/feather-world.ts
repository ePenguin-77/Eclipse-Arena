import type { AbilityDefinition,AbilityEvent,FeatherPin,FeatherRecall,ProjectileSnapshot } from '../contracts/abilities';
import type { ArenaDefinition,BodySnapshot,Vec2 } from '../contracts/types';
import { ProjectileWorld,type ProjectileCapture,type ProjectileTransit } from '../projectiles/projectile-world';
import { projectileAim } from './targeting';
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
type Recall=FeatherRecall & {nextTick:number;interval:number;speed:number;damage:number};
export function validateFeather(d:AbilityDefinition){const e=d.effect;
 if(e.kind!=='feather-shot'&&e.kind!=='feather-recall')return;
 if(!Number.isFinite(e.speed)||e.speed<200||e.speed>1000||(e.kind==='feather-shot'?!!d.ultimate:!d.ultimate||!Number.isInteger(e.intervalTicks)||e.intervalTicks<12||e.intervalTicks>60))throw Error('Invalid feather definition');
}
export class FeatherWorld {
 setWindFields(fields:readonly import('../contracts/forces').VortexField[]){this.bolts.setWindFields(fields);}
 private pins:FeatherPin[]=[];private recalls:Recall[]=[];private bolts=new ProjectileWorld(64,'feather');private serial=0;
 private basics=new Map<string,string>();
 hasUltimate(id:string){return this.recalls.some(r=>r.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,...this.recalls.filter(r=>r.ownerId===id).map(r=>r.endsTick-tick));}
 private pin(ownerId:string,abilityId:string,point:Vec2,tick:number,arena:ArenaDefinition):FeatherPin{
  const side=[{d:point.x,a:Math.PI},{d:arena.width-point.x,a:0},{d:point.y,a:-Math.PI/2},{d:arena.height-point.y,a:Math.PI/2}].sort((a,b)=>a.d-b.d)[0]!;
  return {id:`feather-pin-${++this.serial}`,ownerId,abilityId,position:{x:Math.max(18,Math.min(arena.width-18,point.x)),y:Math.max(18,Math.min(arena.height-18,point.y))},angle:side.a,tick};
 }
 launch(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(d.effect.kind!=='feather-shot')return;const e=d.effect,dir=projectileAim(owner,target,arena,e.speed,12,3,.2);
  this.basics.set(owner.id,d.id);
  this.bolts.spawn({ownerId:owner.id,abilityId:d.id,position:{...owner.position},previousPosition:{...owner.position},velocity:{x:dir.x*e.speed,y:dir.y*e.speed},radius:12,damage:e.damage*multiplier,pierce:32,spawnedTick:tick,expiresTick:tick+Math.ceil(Math.hypot(arena.width,arena.height)/e.speed*60)+5});
 }
 start(tick:number,owner:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(d.effect.kind!=='feather-recall'||this.hasUltimate(owner.id))return false;
  const e=d.effect,pins=this.pins.filter(p=>p.ownerId===owner.id);this.pins=this.pins.filter(p=>p.ownerId!==owner.id);
  if(!pins.length){
   const center={x:arena.width/2,y:arena.height/2};
   for(let i=0;i<3;i++){const a=-Math.PI/2+i*Math.PI*2/3,dx=Math.cos(a),dy=Math.sin(a);
    const t=Math.min((arena.width/2-14)/Math.max(1e-8,Math.abs(dx)),(arena.height/2-14)/Math.max(1e-8,Math.abs(dy)));
    pins.push(this.pin(owner.id,d.id,{x:center.x+dx*t,y:center.y+dy*t},tick,arena));}
  }
  this.recalls.push({ownerId:owner.id,abilityId:d.id,pins,startedTick:tick,nextTick:tick+18,endsTick:tick+18+pins.length*e.intervalTicks+Math.ceil(Math.hypot(arena.width,arena.height)/e.speed*60)+5,total:pins.length,interval:e.intervalTicks,speed:e.speed,damage:e.damage*multiplier});return true;
 }
 step(tick:number,dt:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit,intercept?:(r:import('../contracts/combat').DamageRequest)=>boolean,transit?:(p:ProjectileSnapshot,a:Vec2,b:Vec2)=>ProjectileTransit|undefined,capture?:(p:ProjectileSnapshot,a:Vec2,b:Vec2)=>ProjectileCapture|undefined){
  this.recalls=this.recalls.filter(r=>{
   const owner=bodies.find(b=>b.id===r.ownerId);if(!owner||locked.has(r.ownerId)){this.bolts.removeAbilities(r.ownerId,new Set([r.abilityId]));return false;}
   if(tick>=r.endsTick)return false;if(!r.pins.length||tick<r.nextTick)return true;
   const p=r.pins.shift()!,dx=owner.position.x-p.position.x,dy=owner.position.y-p.position.y,distance=Math.hypot(dx,dy),scale=distance>1e-8?r.speed/distance:0;
   if(distance>12)this.bolts.spawn({ownerId:r.ownerId,abilityId:r.abilityId,position:{...p.position},previousPosition:{...p.position},velocity:{x:dx*scale,y:dy*scale},radius:16,damage:r.damage,pierce:32,spawnedTick:tick,expiresTick:tick+Math.ceil(distance/r.speed*60)+1});
   emit({tick,ownerId:r.ownerId,abilityId:r.abilityId,kind:'projectile',point:{...p.position},reason:'feather-return'});r.nextTick=tick+r.interval;return true;
  });
  return this.bolts.step(tick,dt,arena,bodies,e=>{
   emit(e);if(e.kind==='wall'&&this.basics.get(e.ownerId)===e.abilityId){
    this.pins.push(this.pin(e.ownerId,e.abilityId,e.point,tick,arena));
    const owned=this.pins.filter(p=>p.ownerId===e.ownerId);if(owned.length>5)this.pins=this.pins.filter(p=>p.id!==owned[0]!.id);
    emit({...e,kind:'area',reason:'feather-pin'});
   }
  },intercept,transit,capture);
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){
  this.pins=this.pins.filter(p=>!finished&&living.has(p.ownerId));this.recalls=this.recalls.filter(r=>!finished&&living.has(r.ownerId));
  if(finished)this.bolts.clear();else this.bolts.removeOwners(living);
  for(const id of this.basics.keys())if(finished||!living.has(id))this.basics.delete(id);
 }
 snapshot(){return {featherPins:structuredClone(this.pins),featherRecalls:this.recalls.map(({nextTick,interval,speed,damage,...r})=>structuredClone(r))};}
 projectileSnapshot(){return this.bolts.snapshot();}
}
