import type {AbilityDefinition,AbilityEvent,GoLineSnapshot,ProjectileSnapshot} from '../contracts/abilities';
import type {ArenaDefinition,BodySnapshot,Vec2} from '../contracts/types';
import type {DamageRequest} from '../contracts/combat';
import {ProjectileWorld,type ProjectileCapture,type ProjectileTransit} from '../projectiles/projectile-world';
import {sweepCircle} from '../math/sweep-circle';
import {projectileAim} from './targeting';
import {clearSpearLength} from './spear-world';
import {goLineTouches} from './go-world';
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
interface Prism {id:string;ownerId:string;position:Vec2;startedTick:number;flashTick:number}
interface ArrayState {id:string;ownerId:string;abilityId:string;center:Vec2;points:Vec2[];startedTick:number;endsTick:number;definition:AbilityDefinition;multiplier:number;index:number}
interface Line extends GoLineSnapshot {damage:number;hits:Set<string>}
const PATH=[0,3,6,2,5,1,4,0];
export function validateCrystal(d:AbilityDefinition){const e=d.effect;if(e.kind!=='crystal-lance'&&e.kind!=='crystal-array')return;
 if(d.range===0)throw Error('Invalid crystal range');
 if(e.kind==='crystal-lance'&&(!!d.ultimate||!Number.isFinite(e.speed)||e.speed<200||e.speed>1000||!Number.isFinite(e.splitMultiplier)||e.splitMultiplier<=0||e.splitMultiplier>1))throw Error('Invalid crystal lance');
 if(e.kind==='crystal-array'&&(!d.ultimate||![e.lineDamage,e.radius,e.lineWidth].every(Number.isFinite)||e.lineDamage<=0||e.radius<80||e.radius>180||e.lineWidth<2||e.lineWidth>24||!Number.isInteger(e.intervalTicks)||e.intervalTicks<12||e.intervalTicks>40))throw Error('Invalid crystal array');
}
export class CrystalWorld {
 setWindFields(fields:readonly import('../contracts/forces').VortexField[]){this.bolts.setWindFields(fields);}
 private prisms:Prism[]=[];private arrays:ArrayState[]=[];private lines:Line[]=[];
 private bolts=new ProjectileWorld(64,'crystal');private serial=0;
 private casts=new Map<string,number>();private splitMultipliers=new Map<string,number>();
 hasOwner(id:string){return this.arrays.some(a=>a.ownerId===id);}
 remaining(id:string,tick:number){return Math.max(0,...this.arrays.filter(a=>a.ownerId===id).map(a=>a.endsTick-tick));}
 private pin(tick:number,ownerId:string,p:Vec2,arena:ArenaDefinition){
  const position={x:Math.max(18,Math.min(arena.width-18,p.x)),y:Math.max(18,Math.min(arena.height-18,p.y))};
  // A hit near an existing prism refreshes that location instead of stacking two crystals.
  const old=this.prisms.find(n=>n.ownerId===ownerId&&Math.hypot(n.position.x-p.x,n.position.y-p.y)<36);
  if(old){old.flashTick=tick;return;}
  this.prisms.push({id:`prism-${++this.serial}`,ownerId,position,startedTick:tick,flashTick:tick});
  const owned=this.prisms.filter(n=>n.ownerId===ownerId);if(owned.length>2)this.prisms=this.prisms.filter(n=>n.id!==owned[0]!.id);
 }
 launch(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition,emit:Emit){
  const e=d.effect;if(e.kind!=='crystal-lance')return;
  const count=(this.casts.get(owner.id)??0)+1;this.casts.set(owner.id,count);this.splitMultipliers.set(d.id,e.splitMultiplier);
  let direction=projectileAim(owner,target,arena,e.speed,13,3,.22);
  const candidates=this.prisms.filter(p=>p.ownerId===owner.id).filter(p=>{const dx=p.position.x-owner.position.x,dy=p.position.y-owner.position.y,l=Math.hypot(dx,dy);return l>48&&clearSpearLength(owner.position,{x:dx/l,y:dy/l},l,13,arena)>=l-.01;}).sort((a,b)=>Math.hypot(a.position.x-owner.position.x,a.position.y-owner.position.y)-Math.hypot(b.position.x-owner.position.x,b.position.y-owner.position.y)||a.id.localeCompare(b.id));
  const via=count%2===0?candidates[0]:undefined;
  if(via){const dx=via.position.x-owner.position.x,dy=via.position.y-owner.position.y,l=Math.hypot(dx,dy);direction={x:dx/l,y:dy/l};}
  this.bolts.spawn({ownerId:owner.id,abilityId:d.id,position:{...owner.position},previousPosition:{...owner.position},velocity:{x:direction.x*e.speed,y:direction.y*e.speed},radius:13,damage:e.damage*multiplier,pierce:16,prismSeed:true,hitGroup:`crystal-shot-${++this.serial}`,spawnedTick:tick,expiresTick:tick+Math.ceil(Math.hypot(arena.width,arena.height)/e.speed*60)+20});
  emit({tick,ownerId:owner.id,abilityId:d.id,kind:'projectile',point:{...owner.position},reason:via?'crystal-route':'crystal-direct'});
 }
 start(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  const e=d.effect;if(e.kind!=='crystal-array'||this.hasOwner(owner.id))return false;
  const radius=Math.min(e.radius,arena.width/2-24,arena.height/2-24),margin=radius+20;
  const center={x:Math.max(margin,Math.min(arena.width-margin,target.position.x)),y:Math.max(margin,Math.min(arena.height-margin,target.position.y))};
  const points=Array.from({length:7},(_,i)=>({x:center.x+Math.cos(-Math.PI/2+i*Math.PI*2/7)*radius,y:center.y+Math.sin(-Math.PI/2+i*Math.PI*2/7)*radius}));
  const a:ArrayState={id:`crystal-array-${++this.serial}`,ownerId:owner.id,abilityId:d.id,center,points,startedTick:tick,endsTick:tick+18+7*e.intervalTicks+100,definition:d,multiplier,index:0};this.arrays.push(a);this.nextLine(a,tick+18,arena);return true;
 }
 private nextLine(a:ArrayState,startTick:number,arena:ArenaDefinition){
  const e=a.definition.effect;if(e.kind!=='crystal-array'||a.index>=7)return;
  const start=a.points[PATH[a.index]!]!,goal=a.points[PATH[a.index+1]!]!,dx=goal.x-start.x,dy=goal.y-start.y,length=Math.hypot(dx,dy),clear=clearSpearLength(start,{x:dx/length,y:dy/length},length,e.lineWidth/2,arena);
  this.lines.push({id:`${a.id}-line-${a.index}`,ownerId:a.ownerId,abilityId:a.abilityId,start:{...start},end:{x:start.x+dx/length*clear,y:start.y+dy/length*clear},width:e.lineWidth,startsTick:startTick,endsTick:startTick+e.intervalTicks,ultimate:true,damage:e.lineDamage*a.multiplier,hits:new Set()});
 }
 step(tick:number,dt:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit,intercept?:(r:DamageRequest)=>boolean,transit?:(p:ProjectileSnapshot,a:Vec2,b:Vec2)=>ProjectileTransit|undefined,capture?:(p:ProjectileSnapshot,a:Vec2,b:Vec2)=>ProjectileCapture|undefined){
  const living=new Set(bodies.map(b=>b.id));this.cleanup(living,false);
  const cancelled=new Set(this.arrays.filter(a=>locked.has(a.ownerId)).map(a=>a.ownerId));
  this.arrays=this.arrays.filter(a=>tick<a.endsTick&&!cancelled.has(a.ownerId));this.lines=this.lines.filter(l=>tick<l.endsTick&&!cancelled.has(l.ownerId));
  for(const a of this.arrays){const e=a.definition.effect;if(e.kind!=='crystal-array')continue;
   if(a.index<7&&tick>=a.startedTick+18+a.index*e.intervalTicks){
    const l=this.lines.find(l=>l.id===`${a.id}-line-${a.index}`);
    if(l)emit({tick,ownerId:a.ownerId,abilityId:a.abilityId,kind:'area',point:{...l.start},end:{...l.end},reason:'crystal-refraction'});
    a.index++;this.nextLine(a,a.startedTick+18+a.index*e.intervalTicks,arena);
   }
   if(a.index===7&&tick>=a.startedTick+18+7*e.intervalTicks){
    for(const p of a.points){const dx=a.center.x-p.x,dy=a.center.y-p.y,l=Math.hypot(dx,dy)||1;
     this.bolts.spawn({ownerId:a.ownerId,abilityId:a.abilityId,position:{...p},previousPosition:{...p},velocity:{x:dx/l*650,y:dy/l*650},radius:14,damage:e.damage*a.multiplier,hitGroup:`${a.id}-burst`,spawnedTick:tick,expiresTick:tick+Math.ceil(l/650*60)+1});
     emit({tick,ownerId:a.ownerId,abilityId:a.abilityId,kind:'detonate',point:{...p},reason:'crystal-shatter'});
    }a.index++;
   }
  }
  const requests:DamageRequest[]=[];
  for(const l of this.lines){if(tick<l.startsTick||tick>=l.startsTick+8)continue;
   for(const b of bodies){if(b.id===l.ownerId||b.ownerId===l.ownerId||l.hits.has(b.id)||!goLineTouches(b,l,tick===l.startsTick))continue;
    l.hits.add(b.id);const request:DamageRequest={tick,targetId:b.id,amount:l.damage,source:{kind:'area',attackerId:l.ownerId,abilityId:l.abilityId,areaId:l.id}};
    if(!intercept?.(request))requests.push(request);emit({tick,ownerId:l.ownerId,abilityId:l.abilityId,kind:'hit',targetId:b.id,point:{...b.position},reason:'crystal-line'});
   }
  }
  const before=new Map(this.bolts.snapshot().map(p=>[p.id,p]));const pending:Omit<ProjectileSnapshot,'id'>[]=[];
  const refract=(p:ProjectileSnapshot,start:Vec2,end:Vec2):ProjectileCapture|undefined=>{
   const enemyCapture=capture?.(p,start,end);if(!p.prismSeed)return enemyCapture;
   let nearest:{node:Prism;t:number}|undefined;
   for(const node of this.prisms){if(node.ownerId!==p.ownerId)continue;const t=sweepCircle({x:start.x-node.position.x,y:start.y-node.position.y},{x:end.x-node.position.x,y:end.y-node.position.y},p.radius+17);if(t!==null&&(!nearest||t<nearest.t))nearest={node,t};}
   if(!nearest||enemyCapture&&enemyCapture.time<=nearest.t)return enemyCapture;
   const {node,t}=nearest;
   return {time:t,commit:()=>{
    node.flashTick=tick;
    const owner=bodies.find(b=>b.id===p.ownerId)!,target=bodies.filter(b=>b.id!==p.ownerId&&b.ownerId!==p.ownerId).sort((a,b)=>Math.hypot(a.position.x-node.position.x,a.position.y-node.position.y)-Math.hypot(b.position.x-node.position.x,b.position.y-node.position.y)||a.id.localeCompare(b.id))[0];
    const position={...node.position};let angle=Math.atan2(-p.velocity.y,-p.velocity.x);const speed=Math.hypot(p.velocity.x,p.velocity.y);
    if(target){const dir=projectileAim({...owner,position,velocity:{x:0,y:0}},target,arena,speed,10,3,.18);angle=Math.atan2(dir.y,dir.x);}
    for(const delta of [-.22,0,.22])pending.push({ownerId:p.ownerId,abilityId:p.abilityId,position:{...position},previousPosition:{...position},velocity:{x:Math.cos(angle+delta)*speed,y:Math.sin(angle+delta)*speed},radius:10,damage:p.damage*(this.splitMultipliers.get(p.abilityId)??.75),hitGroup:p.hitGroup,hitTargets:[...p.hitTargets??[]],spawnedTick:tick,expiresTick:tick+75,visualScale:.8});
    emit({tick,ownerId:p.ownerId,abilityId:p.abilityId,kind:'area',point:position,reason:'crystal-split'});
   }};
  };
  requests.push(...this.bolts.step(tick,dt,arena,bodies,e=>{emit(e);const p=e.projectileId?before.get(e.projectileId):undefined;if(e.kind==='wall'&&p?.prismSeed){this.pin(tick,e.ownerId,e.point,arena);emit({...e,kind:'area',reason:'crystal-pin'});}},intercept,transit,refract));
  for(const p of pending)this.bolts.spawn(p);
  return requests;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.prisms=this.prisms.filter(p=>!finished&&living.has(p.ownerId));this.arrays=this.arrays.filter(a=>!finished&&living.has(a.ownerId));this.lines=this.lines.filter(l=>!finished&&living.has(l.ownerId));if(finished)this.bolts.clear();else this.bolts.removeOwners(living);for(const id of this.casts.keys())if(finished||!living.has(id))this.casts.delete(id);}
 snapshot(){return {crystalPrisms:structuredClone(this.prisms),crystalArrays:this.arrays.filter(a=>a.index<=7).map(({id,ownerId,points,center,startedTick,endsTick})=>({id,ownerId,points:structuredClone(points),center:{...center},startedTick,endsTick})),crystalLines:this.lines.map(({damage,hits,...l})=>structuredClone(l))};}
 projectileSnapshot(){return this.bolts.snapshot();}
}
