import type {AbilityDefinition,AbilityEvent,ProjectileSnapshot} from '../contracts/abilities';
import type {ArenaDefinition,BodySnapshot,Vec2} from '../contracts/types';
import type {DamageRequest} from '../contracts/combat';
import type {KnockbackRequest} from '../contracts/forces';
import {ProjectileWorld,type ProjectileCapture,type ProjectileTransit} from '../projectiles/projectile-world';
import {projectileAim} from './targeting';
import {clearSpearLength} from './spear-world';

type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
interface Salvo {ownerId:string;definition:AbilityDefinition;multiplier:number;nextTick:number;index:number;endsTick:number}
interface Shell {ownerId:string;abilityId:string;radius:number;damage:number;heavy:boolean;hits:Set<string>}
export function validateCannon(d:AbilityDefinition){
 const e=d.effect;if(e.kind!=='cannon-shot'&&e.kind!=='cannon-salvo')return;
 if(d.range===0||![e.speed,e.blastRadius,e.recoil,e.damage].every(Number.isFinite)||e.speed<300||e.speed>1000||e.blastRadius<20||e.blastRadius>100||e.recoil<100||e.recoil>1000||e.damage<=0)throw Error('Invalid cannon');
 if(e.kind==='cannon-shot'&&d.ultimate)throw Error('Basic cannon cannot be ultimate');
 if(e.kind==='cannon-salvo'&&(!d.ultimate||!Number.isInteger(e.intervalTicks)||e.intervalTicks<20||e.intervalTicks>60||!Number.isFinite(e.finalDamage)||e.finalDamage<=0||!Number.isFinite(e.finalRadius)||e.finalRadius<e.blastRadius||e.finalRadius>160))throw Error('Invalid cannon salvo');
}
/** Projectiles use the shared swept collision pipeline; recoil uses real physics impulses. */
export class CannonWorld {
 setWindFields(fields:readonly import('../contracts/forces').VortexField[]){this.bolts.setWindFields(fields);}
 private bolts=new ProjectileWorld(48,'cannon');private shells=new Map<string,Shell>();
 private salvos:Salvo[]=[];private recoil:KnockbackRequest[]=[];
 hasOwner(id:string){return this.salvos.some(s=>s.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,...this.salvos.filter(s=>s.ownerId===id).map(s=>s.endsTick-tick));}
 takeRecoil(){const r=this.recoil;this.recoil=[];return r;}
 private fire(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition,emit:Emit,heavy=false){
  const e=d.effect;if(e.kind!=='cannon-shot'&&e.kind!=='cannon-salvo')return;
  const radius=heavy?19:14,dir=projectileAim(owner,target,arena,e.speed,radius,3,.22);
  // Starting at the body center avoids spawning through nearby walls or pillars.
  const position={...owner.position};
  if(!this.bolts.spawn({ownerId:owner.id,abilityId:d.id,visualAbilityId:d.ultimate&&!heavy?'cannon-round':undefined,position,previousPosition:{...position},velocity:{x:dir.x*e.speed,y:dir.y*e.speed},radius,damage:e.damage*multiplier,pierce:heavy?32:0,spawnedTick:tick,expiresTick:tick+Math.ceil(Math.hypot(arena.width,arena.height)/e.speed*60)+8}))return;
  const p=this.bolts.snapshot().at(-1)!;
  this.shells.set(p.id,{ownerId:owner.id,abilityId:d.id,radius:heavy&&e.kind==='cannon-salvo'?e.finalRadius:e.blastRadius,damage:(heavy&&e.kind==='cannon-salvo'?e.finalDamage:e.damage)*multiplier,heavy,hits:new Set()});
  this.recoil.push({ownerId:owner.id,targetId:owner.id,direction:{x:-dir.x,y:-dir.y},strength:Math.min(1000,e.recoil*(heavy?1.18:1)),selfRebound:true});
  emit({tick,ownerId:owner.id,abilityId:d.id,projectileId:p.id,targetId:target.id,kind:'projectile',point:{...position},end:{x:position.x+dir.x*60,y:position.y+dir.y*60},reason:heavy?'cannon-heavy':'cannon-fire'});
 }
 launch(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition,emit:Emit){if(d.effect.kind==='cannon-shot')this.fire(tick,owner,target,d,multiplier,arena,emit);}
 start(tick:number,owner:BodySnapshot,d:AbilityDefinition,multiplier:number){
  if(d.effect.kind!=='cannon-salvo'||this.hasOwner(owner.id))return false;
  this.salvos.push({ownerId:owner.id,definition:d,multiplier,nextTick:tick,index:0,endsTick:tick+2*d.effect.intervalTicks+1});return true;
 }
 step(tick:number,dt:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit,intercept?:(r:DamageRequest)=>boolean,transit?:(p:ProjectileSnapshot,a:Vec2,b:Vec2)=>ProjectileTransit|undefined,capture?:(p:ProjectileSnapshot,a:Vec2,b:Vec2)=>ProjectileCapture|undefined){
  this.cleanup(new Set(bodies.map(b=>b.id)),false);
  this.salvos=this.salvos.filter(s=>{
   const owner=bodies.find(b=>b.id===s.ownerId);if(!owner||locked.has(s.ownerId))return false;
   if(tick<s.nextTick)return true;
   const target=bodies.filter(b=>b.id!==owner.id&&b.ownerId!==owner.id).sort((a,b)=>Math.hypot(a.position.x-owner.position.x,a.position.y-owner.position.y)-Math.hypot(b.position.x-owner.position.x,b.position.y-owner.position.y)||a.id.localeCompare(b.id))[0];
   if(!target)return false;
   this.fire(tick,owner,target,s.definition,s.multiplier,arena,emit,s.index===2);s.index++;
   s.nextTick=tick+(s.definition.effect.kind==='cannon-salvo'?s.definition.effect.intervalTicks:30);return s.index<3;
  });
  const bursts:{shell:Shell;point:Vec2;id:string}[]=[];
  const requests=this.bolts.step(tick,dt,arena,bodies,e=>{
   emit(e);const shell=e.projectileId?this.shells.get(e.projectileId):undefined;if(!shell)return;
   if(e.kind==='hit'&&e.targetId)shell.hits.add(e.targetId);
   if((e.kind==='hit'&&!shell.heavy)||e.kind==='wall'||e.kind==='obstacle')bursts.push({shell,point:{...e.point},id:e.projectileId!});
  },intercept,transit,capture);
  for(const {shell,point,id} of bursts){
   for(const target of bodies){
    if(target.id===shell.ownerId||target.ownerId===shell.ownerId||shell.hits.has(target.id))continue;
    const dx=target.position.x-point.x,dy=target.position.y-point.y,distance=Math.hypot(dx,dy);
    if(distance>shell.radius+target.radius||distance>0&&clearSpearLength(point,{x:dx/distance,y:dy/distance},distance,0,arena)<distance-.01)continue;
    shell.hits.add(target.id);
    const request:DamageRequest={tick,targetId:target.id,amount:shell.damage,source:{kind:'area',attackerId:shell.ownerId,abilityId:shell.abilityId,areaId:`${id}-blast`}};
    if(!intercept?.(request))requests.push(request);
   }
   emit({tick,ownerId:shell.ownerId,abilityId:shell.abilityId,kind:'detonate',point,reason:shell.heavy?'cannon-wall-burst':'cannon-burst'});
  }
  const active=new Set(this.bolts.snapshot().map(p=>p.id));for(const id of this.shells.keys())if(!active.has(id))this.shells.delete(id);
  return requests;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){
  this.salvos=this.salvos.filter(s=>!finished&&living.has(s.ownerId));
  if(finished)this.bolts.clear();else this.bolts.removeOwners(living);
  for(const [id,s] of this.shells)if(finished||!living.has(s.ownerId))this.shells.delete(id);
  this.recoil=this.recoil.filter(r=>!finished&&living.has(r.ownerId));
 }
 projectileSnapshot(){return this.bolts.snapshot();}
}
