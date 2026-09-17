import type { AbilityDefinition, AbilityEvent, PortalPairSnapshot, ProjectileSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';
import type { DashRequest } from '../contracts/motion';
import { clearSpearLength } from './spear-world';
import { clearOfArena } from '../arenas/arena-registry';
import { sweepCircle } from '../projectiles/sweep';
import { abilityTarget } from './targeting';
import type { ProjectileTransit } from '../projectiles/projectile-world';

type Emit=(event:Omit<AbilityEvent,'id'>)=>void;
type Pair=PortalPairSnapshot & {damage:number;nextShot:number;shots:number;lastBodyTick:number};
type Shot=Omit<ProjectileSnapshot,'id'>;
const unit=(v:Vec2):Vec2=>{const n=Math.hypot(v.x,v.y);return n>1e-6?{x:v.x/n,y:v.y/n}:{x:1,y:0};};
const toward=(a:Vec2,b:Vec2)=>unit({x:b.x-a.x,y:b.y-a.y});
const distance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.y-b.y);
const crossed=(a:Vec2,b:Vec2,p:Vec2,r:number)=>sweepCircle({x:a.x-p.x,y:a.y-p.y},{x:b.x-p.x,y:b.y-p.y},r);
export function validatePortal(d:AbilityDefinition){if(d.effect.kind!=='portal')return;const e=d.effect;
 if(d.range===0||!Number.isInteger(e.durationTicks)||e.durationTicks<30||e.durationTicks>600||!Number.isInteger(e.bodyUses)||e.bodyUses<1||e.bodyUses>3||!Number.isInteger(e.shots)||e.shots<0||e.shots>4||!Number.isInteger(e.projectileUses)||e.projectileUses<0||e.projectileUses>6||!!d.ultimate!==(e.shots>0))throw Error('Invalid portal skill');
}

export class PortalWorld {
 private pairs:Pair[]=[];private serial=0;private requests:DamageRequest[]=[];private motions:DashRequest[]=[];private shots:Shot[]=[];
 hasOwner(id:string,ultimate?:boolean){return this.pairs.some(p=>p.ownerId===id&&(ultimate===undefined||p.ultimate===ultimate));}
 remaining(id:string,tick:number){return Math.max(0,...this.pairs.filter(p=>p.ownerId===id&&p.ultimate).map(p=>p.endsTick-tick));}
 private clamp(p:Vec2,r:number,a:ArenaDefinition){return {x:Math.max(r+3,Math.min(a.width-r-3,p.x)),y:Math.max(r+3,Math.min(a.height-r-3,p.y))};}
 private safe(p:Vec2,owner:BodySnapshot,bodies:readonly BodySnapshot[],arena:ArenaDefinition){return clearOfArena(arena,p,owner.radius)&&bodies.every(b=>b.id===owner.id||distance(p,b.position)>owner.radius+b.radius+3);}
 start(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],emit:Emit){
  if(d.effect.kind!=='portal')return false;const e=d.effect,ultimate=!!d.ultimate;
  let entry:Vec2,exit:Vec2;
  if(ultimate){
   const dir=unit(owner.velocity),r=owner.radius+10;
   const tx=dir.x>0?(arena.width-r-owner.position.x)/dir.x:dir.x<0?(r-owner.position.x)/dir.x:Infinity;
   const ty=dir.y>0?(arena.height-r-owner.position.y)/dir.y:dir.y<0?(r-owner.position.y)/dir.y:Infinity;
   const t=Math.max(0,Math.min(tx,ty));entry=this.clamp({x:owner.position.x+dir.x*t,y:owner.position.y+dir.y*t},r-3,arena);
   exit=tx<ty?{x:entry.x<arena.width/2?arena.width-r:r,y:arena.height-entry.y}:{x:arena.width-entry.x,y:entry.y<arena.height/2?arena.height-r:r};
   if(!clearOfArena(arena,entry,owner.radius)||!clearOfArena(arena,exit,owner.radius))return false;
  }else{
   const dir=unit(owner.velocity);entry=this.clamp({x:owner.position.x+dir.x*70,y:owner.position.y+dir.y*70},owner.radius,arena);
   if(!clearOfArena(arena,entry,owner.radius))return false;
   const aim=toward(owner.position,target.position),candidates=[Math.PI/2,-Math.PI/2,Math.PI,0].map(angle=>this.clamp({x:target.position.x+(aim.x*Math.cos(angle)-aim.y*Math.sin(angle))*112,y:target.position.y+(aim.x*Math.sin(angle)+aim.y*Math.cos(angle))*112},owner.radius,arena));
   const point=candidates.find(p=>this.safe(p,owner,bodies,arena)&&distance(p,entry)>85);if(!point)return false;exit=point;
  }
  this.pairs=this.pairs.filter(p=>p.ownerId!==owner.id||p.ultimate!==ultimate);
  this.pairs.push({id:`portal-${++this.serial}`,ownerId:owner.id,abilityId:d.id,entry,exit,radius:ultimate?43:35,ultimate,startedTick:tick,endsTick:tick+e.durationTicks,bodyUses:e.bodyUses,projectileUses:e.projectileUses,lastTransitTick:-1000,damage:e.damage*multiplier,nextShot:tick+24,shots:e.shots,lastBodyTick:-1000});
  emit({tick,ownerId:owner.id,abilityId:d.id,kind:'area',point:entry,end:exit,reason:'portal-open'});return true;
 }
 /** Called before physics movement; the shared teleport callback rejects occupied exits. */
 prepare(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,teleport:(id:string,p:Vec2)=>boolean,emit:Emit){
  this.pairs=this.pairs.filter(p=>tick<p.endsTick&&bodies.some(b=>b.id===p.ownerId)&&!locked.has(p.ownerId));
  const warped=new Set<string>();
  for(const p of this.pairs){const owner=bodies.find(b=>b.id===p.ownerId)!;
   if(warped.has(owner.id)||p.bodyUses<=0||tick<p.startedTick+4||tick-p.lastBodyTick<48)continue;
   const target=abilityTarget(owner,bodies.filter(b=>!b.ownerId),5);if(!target)continue;
   const froms=p.ultimate?[p.entry,p.exit]:[p.entry];
   for(const entry of froms){
    if(crossed(owner.previousPosition,owner.position,entry,p.radius)===null)continue;
    const exit=entry===p.entry?p.exit:p.entry;
    const dir=toward(exit,target.position);
    const landing=p.ultimate?this.clamp({x:exit.x+dir.x*(p.radius+owner.radius+5),y:exit.y+dir.y*(p.radius+owner.radius+5)},owner.radius,arena):exit;
    if(!this.safe(landing,owner,bodies,arena)||!teleport(owner.id,landing))continue;
    p.bodyUses--;p.lastBodyTick=tick;p.lastTransitTick=tick;warped.add(owner.id);
    this.motions.push({ownerId:owner.id,targetId:target.id,abilityId:p.abilityId,direction:toward(landing,target.position),speed:620,durationTicks:12});
    emit({tick,ownerId:owner.id,abilityId:p.abilityId,kind:'area',point:entry,reason:'portal-transit'});
    emit({tick,ownerId:owner.id,abilityId:p.abilityId,kind:'area',point:landing,reason:'portal-transit'});
    if(!p.ultimate){this.launch(tick,p,landing,toward(landing,target.position),p.damage);p.endsTick=Math.min(p.endsTick,tick+12);}
    else for(const b of bodies){if(b.id===owner.id||b.ownerId===owner.id||distance(b.position,landing)>90+b.radius)continue;
     const range=distance(landing,b.position);if(clearSpearLength(landing,toward(landing,b.position),range,0,arena)<range-.01)continue;
     this.requests.push({tick,targetId:b.id,amount:p.damage*.5,source:{kind:'area',attackerId:owner.id,abilityId:p.abilityId,areaId:p.id}});
     emit({tick,ownerId:owner.id,abilityId:p.abilityId,kind:'hit',targetId:b.id,point:{...b.position}});
    }
    break;
   }
  }
 }
 private launch(tick:number,p:Pair,position:Vec2,direction:Vec2,damage:number){this.shots.push({ownerId:p.ownerId,abilityId:p.abilityId,position:{...position},previousPosition:{...position},velocity:{x:direction.x*700,y:direction.y*700},radius:12,damage,spawnedTick:tick,expiresTick:tick+100});}
 step(tick:number,bodies:readonly BodySnapshot[]){
  for(const p of this.pairs){if(!p.ultimate||p.shots<=0||tick<p.nextShot)continue;const owner=bodies.find(b=>b.id===p.ownerId);if(!owner)continue;
   const entry=distance(owner.position,p.entry)<distance(owner.position,p.exit)?p.entry:p.exit;
   this.launch(tick,p,owner.position,toward(owner.position,entry),p.damage);p.shots--;p.nextShot=tick+60;
  }
  const result={requests:this.requests,motions:this.motions,shots:this.shots};this.requests=[];this.motions=[];this.shots=[];return result;
 }
 projectileTransit(tick:number,p:ProjectileSnapshot,start:Vec2,end:Vec2,arena:ArenaDefinition,bodies:readonly BodySnapshot[],emit:Emit):ProjectileTransit|undefined{
  if(p.portalHops)return;const pair=this.pairs.find(g=>g.ultimate&&g.ownerId===p.ownerId&&g.projectileUses>0&&tick<g.endsTick);if(!pair)return;
  const intersections=[pair.entry,pair.exit].map(entry=>({entry,time:crossed(start,end,entry,pair.radius+p.radius)})).filter((v):v is {entry:Vec2;time:number}=>v.time!==null).sort((a,b)=>a.time-b.time);
  const crossing=intersections[0];if(!crossing)return;
  const exit=crossing.entry===pair.entry?pair.exit:pair.entry;
  const target=bodies.filter(b=>b.id!==p.ownerId&&b.ownerId!==p.ownerId).sort((a,b)=>distance(exit,a.position)-distance(exit,b.position)||a.id.localeCompare(b.id))[0];if(!target)return;
  const dir=toward(exit,{x:target.position.x+target.velocity.x*.15,y:target.position.y+target.velocity.y*.15});
  const position=this.clamp({x:exit.x+dir.x*(pair.radius+p.radius+4),y:exit.y+dir.y*(pair.radius+p.radius+4)},p.radius,arena);
  if(!clearOfArena(arena,position,p.radius))return;
  const speed=Math.hypot(p.velocity.x,p.velocity.y);
  return {time:crossing.time,position,velocity:{x:dir.x*speed,y:dir.y*speed},commit:()=>{pair.projectileUses--;pair.lastTransitTick=tick;p.portalHops=1;emit({tick,ownerId:p.ownerId,abilityId:pair.abilityId,kind:'area',point:exit,reason:'portal-transit'});}};
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.pairs=this.pairs.filter(p=>!finished&&living.has(p.ownerId));if(finished){this.requests=[];this.motions=[];this.shots=[];}}
 snapshot(){return this.pairs.map(({damage,nextShot,shots,lastBodyTick,...p})=>structuredClone(p));}
}
