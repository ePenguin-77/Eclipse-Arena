import type { AbilityDefinition, AbilityEvent, ScribeMemorySnapshot, ScribeMode, ScribeCastSnapshot, ScribeStrikeSnapshot } from '../contracts/abilities';
import type { BodySnapshot, ArenaDefinition, Vec2 } from '../contracts/types';
import type { DamageResult, DamageRequest } from '../contracts/combat';
import { ProjectileWorld } from '../projectiles/projectile-world';
import type { ProjectileCapture } from '../projectiles/projectile-world';
import type { ProjectileSnapshot } from '../contracts/abilities';
import { projectileAim } from './targeting';
import { beamEnd } from './beam-world';
import { goLineTouches } from './go-world';
import { clearSpearLength } from './spear-world';

type Emit=(event:Omit<AbilityEvent,'id'>)=>void;
interface Cast extends ScribeCastSnapshot {targetId:string;damage:number;multiplier:number;index:number;nextTick:number}
interface Strike extends ScribeStrikeSnapshot {damage:number;hit:boolean}
export function scribeMode(d:AbilityDefinition):ScribeMode {
 switch(d.effect.kind){
  case 'beam':return 'beam';
  case 'automaton-command':return 'projectile';
  case 'retrace-follow':case 'retrace-return':return 'projectile';
  case 'summon':case 'decoy':case 'ink-dragons':return 'summon';
  case 'wind-fan':case 'melee':case 'dash':case 'thrust':case 'flurry':case 'sweep':case 'impact-form':case 'guard-burst':return 'melee';
  case 'cannon-shot':case 'cannon-salvo':case 'crystal-lance':case 'crystal-array':case 'dream-wave':case 'feather-shot':case 'feather-recall':case 'lantern':case 'soul-release':case 'time-rewind':case 'portal':case 'projectile':case 'projectile-sequence':case 'hook':case 'returning-weapon':return 'projectile';
  default:return 'field';
 }
}
export function validateScribe(d:AbilityDefinition){if(d.effect.kind!=='script-return')return;
 if(!d.ultimate||d.range===0||!Number.isFinite(d.effect.damage)||d.effect.damage<=0||d.effect.damage>90)throw Error('Invalid manuscript return');
}
const visible=(a:Vec2,b:Vec2,arena:ArenaDefinition)=>{const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);return l<1e-6||clearSpearLength(a,{x:dx/l,y:dy/l},l,0,arena)>=l-.01;};
export class ScribeWorld {
 setWindFields(fields:readonly import('../contracts/forces').VortexField[]){this.projectiles.setWindFields(fields);}
 private memories=new Map<string,ScribeMemorySnapshot>();
 private casts:Cast[]=[];private strikes:Strike[]=[];private projectiles=new ProjectileWorld(24,'scribe');private serial=1;
 hasOwner(ownerId:string){return this.casts.some(c=>c.ownerId===ownerId);}
 remaining(ownerId:string,tick:number){return Math.max(0,(this.casts.find(c=>c.ownerId===ownerId)?.endsTick??tick)-tick);}
 memory(ownerId:string){const m=this.memories.get(ownerId);return m?structuredClone(m):undefined;}
 reserve(ownerId:string){const m=this.memory(ownerId);this.memories.delete(ownerId);return m;}
 record(tick:number,results:readonly DamageResult[],owners:ReadonlySet<string>,basics:ReadonlyMap<string,string>,definitions:readonly AbilityDefinition[],living:ReadonlySet<string>){
  for(const r of results){const source=r.request.source;
   if(r.outcome!=='applied'||r.appliedDamage<=0||!owners.has(r.request.targetId)||!living.has(r.request.targetId)||!living.has(source.attackerId)||source.attackerId===r.request.targetId||source.kind==='collision'||source.kind==='status'||basics.get(source.attackerId)!==source.abilityId)continue;
   const d=definitions.find(d=>d.id===source.abilityId);if(!d||d.ultimate)continue;
   this.memories.set(r.request.targetId,{ownerId:r.request.targetId,sourceId:source.attackerId,abilityId:d.id,mode:scribeMode(d),recordedTick:tick});
  }
 }
 start(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,memory?:ScribeMemorySnapshot){
  if(d.effect.kind!=='script-return'||this.hasOwner(owner.id))return;
  this.casts.push({ownerId:owner.id,abilityId:d.id,recordedAbilityId:memory?.abilityId,mode:memory?.mode??'beam',position:{...owner.position},startedTick:tick,endsTick:tick+84,targetId:target.id,damage:d.effect.damage,multiplier,index:0,nextTick:tick});
 }
 step(tick:number,dt:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit,capture?:(p:ProjectileSnapshot,start:Vec2,end:Vec2)=>ProjectileCapture|undefined){
  const requests:DamageRequest[]=[],living=new Set(bodies.map(b=>b.id));
  for(const id of locked)this.projectiles.removeAbilities(id,new Set(['scribe-return']));
  this.casts=this.casts.filter(c=>living.has(c.ownerId)&&!locked.has(c.ownerId)&&tick<c.endsTick);
  this.strikes=this.strikes.filter(s=>living.has(s.ownerId)&&!locked.has(s.ownerId)&&tick<s.endsTick);
  for(const c of this.casts){const owner=bodies.find(b=>b.id===c.ownerId)!;c.position={...owner.position};
   const count=c.mode==='melee'?2:c.mode==='projectile'||c.mode==='summon'?3:1;
   if(tick<c.nextTick||c.index>=count)continue;
   const target=bodies.find(b=>b.id===c.targetId)??bodies.find(b=>b.id!==c.ownerId&&!b.ownerId);if(!target){c.endsTick=tick;continue;}
   const aim=projectileAim(owner,target,arena,700,14,.8,.16),damage=c.damage*c.multiplier/count;
   if(c.mode==='projectile'||c.mode==='summon'){
    const position={...owner.position};
    this.projectiles.spawn({ownerId:owner.id,abilityId:c.abilityId,visualAbilityId:c.mode==='projectile'?c.recordedAbilityId:undefined,position,previousPosition:{...position},velocity:{x:aim.x*700,y:aim.y*700},radius:14,damage,spawnedTick:tick,expiresTick:tick+55});
   }else{
    const position=c.mode==='field'?{x:Math.max(24,Math.min(arena.width-24,target.position.x+target.velocity.x*.18)),y:Math.max(24,Math.min(arena.height-24,target.position.y+target.velocity.y*.18))}:{...owner.position};
    if(c.mode==='field'){const dx=position.x-owner.position.x,dy=position.y-owner.position.y,length=Math.hypot(dx,dy);
     if(length>1e-6){const reach=clearSpearLength(owner.position,{x:dx/length,y:dy/length},length,0,arena);if(reach<length){position.x=owner.position.x+dx/length*Math.max(0,reach-2);position.y=owner.position.y+dy/length*Math.max(0,reach-2);}}
    }
    const end=c.mode==='beam'?beamEnd(position,aim,26,arena):{x:position.x+aim.x*180,y:position.y+aim.y*180};
    const delay=c.mode==='field'?24:10;
    this.strikes.push({id:`scribe-strike-${this.serial++}`,ownerId:c.ownerId,abilityId:c.abilityId,recordedAbilityId:c.recordedAbilityId,mode:c.mode,position,end,radius:c.mode==='field'?100:180,startedTick:tick,releasesTick:tick+delay,endsTick:tick+delay+20,damage,hit:false});
   }
   c.index++;c.nextTick=tick+(c.mode==='melee'?22:10);
  }
  for(const s of this.strikes){if(s.hit||tick<s.releasesTick)continue;s.hit=true;
   const dx=s.end.x-s.position.x,dy=s.end.y-s.position.y,len=Math.hypot(dx,dy)||1;
   emit({tick,ownerId:s.ownerId,abilityId:s.abilityId,kind:'detonate',point:{...s.position},reason:`scribe-${s.mode}`});
   for(const b of bodies){if(b.id===s.ownerId||b.ownerId===s.ownerId||!visible(s.position,b.position,arena))continue;
    const x=b.position.x-s.position.x,y=b.position.y-s.position.y,distance=Math.hypot(x,y);
    const touches=s.mode==='beam'?goLineTouches(b,{start:s.position,end:s.end,width:26} as Parameters<typeof goLineTouches>[1],true):s.mode==='field'?distance<=s.radius+b.radius:distance<=s.radius+b.radius&&(x*dx+y*dy)/len>=-b.radius&&(distance<1||((x*dx+y*dy)/len)/distance>=Math.cos(Math.PI*.4)-b.radius/Math.max(1,distance));
    if(!touches)continue;
    requests.push({tick,targetId:b.id,amount:s.damage,source:{kind:'area',attackerId:s.ownerId,abilityId:s.abilityId,areaId:s.id}});
    emit({tick,ownerId:s.ownerId,abilityId:s.abilityId,kind:'hit',targetId:b.id,point:{...b.position}});
   }
  }
  requests.push(...this.projectiles.step(tick,dt,arena,bodies,emit,undefined,undefined,capture));return requests;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){
  this.casts=this.casts.filter(c=>!finished&&living.has(c.ownerId));this.strikes=this.strikes.filter(s=>!finished&&living.has(s.ownerId));
  for(const id of this.memories.keys())if(finished||!living.has(id))this.memories.delete(id);
  this.projectiles.removeOwners(living);if(finished)this.projectiles.clear();
 }
 projectileSnapshot(){return this.projectiles.snapshot();}
 snapshot(){return {scribeMemories:structuredClone([...this.memories.values()]),scribeCasts:this.casts.map(({targetId,damage,multiplier,index,nextTick,...c})=>structuredClone(c)),scribeStrikes:this.strikes.map(({damage,hit,...s})=>structuredClone(s))};}
}
