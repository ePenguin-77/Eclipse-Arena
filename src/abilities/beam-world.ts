import type { AbilityDefinition, AbilityEvent, BeamSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import type { DamageRequest, DamageResult } from '../contracts/combat';
import { clearSpearLength } from './spear-world';
import { sweepCircle } from '../math/sweep-circle';
import { goLineTouches } from './go-world';
type Emit=(event:Omit<AbilityEvent,'id'>)=>void;
interface Beam extends BeamSnapshot {definition:AbilityDefinition;targetId:string;aim:Vec2;multiplier:number;serial:number}
export function validateBeam(d:AbilityDefinition){const e=d.effect;if(e.kind!=='beam')return;
 if(d.range===0||![e.width,e.chargeTicks,e.recoveryTicks,e.aimLockTicks].every(Number.isFinite)||e.width<2||e.width>100||!Number.isInteger(e.chargeTicks)||e.chargeTicks<12||e.chargeTicks>120||!Number.isInteger(e.recoveryTicks)||e.recoveryTicks<6||e.recoveryTicks>36||!Number.isInteger(e.aimLockTicks)||e.aimLockTicks<0||e.aimLockTicks>=e.chargeTicks)throw Error('Invalid charged beam');
}
/** A beam reaches the actual wall; obstacles intercept the full beam thickness. */
export function beamEnd(origin:Vec2,aim:Vec2,width:number,arena:ArenaDefinition){
 const max=Math.hypot(arena.width,arena.height)*2;
 let length=clearSpearLength(origin,aim,max,0,{...arena,obstacles:[]});
 const end={x:origin.x+aim.x*length,y:origin.y+aim.y*length};
 for(const obstacle of arena.obstacles??[]){const t=sweepCircle({x:origin.x-obstacle.center.x,y:origin.y-obstacle.center.y},{x:end.x-obstacle.center.x,y:end.y-obstacle.center.y},obstacle.radius+width/2);if(t!==null)length=Math.min(length,t*Math.hypot(end.x-origin.x,end.y-origin.y));}
 return {x:origin.x+aim.x*length,y:origin.y+aim.y*length};
}
export class BeamWorld {
 private beams:Beam[]=[];private serial=1;
 hasOwner(id:string){return this.beams.some(b=>b.ownerId===id);}
 hasUltimate(id:string){return this.beams.some(b=>b.ownerId===id&&b.ultimate);}
 locks(){return this.beams.map(b=>b.ownerId);}
 state(id:string,abilityId:string){return this.beams.find(b=>b.ownerId===id&&b.abilityId===abilityId);}
 start(tick:number,owner:BodySnapshot,target:BodySnapshot,definition:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(definition.effect.kind!=='beam')return;const e=definition.effect,dx=target.position.x-owner.position.x,dy=target.position.y-owner.position.y,l=Math.hypot(dx,dy)||1,aim={x:dx/l,y:dy/l};
  this.beams.push({ownerId:owner.id,abilityId:definition.id,start:{...owner.position},end:beamEnd(owner.position,aim,e.width,arena),width:e.width,startedTick:tick,releaseTick:tick+e.chargeTicks,endsTick:tick+e.chargeTicks+e.recoveryTicks+1,phase:'charge',ultimate:!!definition.ultimate,definition,targetId:target.id,aim,multiplier,serial:this.serial++});
 }
 interrupt(tick:number,results:readonly DamageResult[],emit:Emit){
  const hit=new Set(results.filter(r=>r.outcome==='applied'&&r.appliedDamage>0&&r.request.source.attackerId!==r.request.targetId).map(r=>r.request.targetId));
  this.beams=this.beams.filter(b=>{if(b.phase!=='charge'||!hit.has(b.ownerId))return true;emit({tick,ownerId:b.ownerId,abilityId:b.abilityId,kind:'cancelled',point:b.start,reason:'charge-interrupted'});return false;});
 }
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit){
  const requests:DamageRequest[]=[];
  this.beams=this.beams.filter(b=>{
   const owner=bodies.find(o=>o.id===b.ownerId),e=b.definition.effect;if(!owner||tick>=b.endsTick)return false;
   if(locked.has(b.ownerId)){emit({tick,ownerId:b.ownerId,abilityId:b.abilityId,kind:'cancelled',point:b.start,reason:'ability-locked'});return false;}
   if(e.kind!=='beam'||b.phase==='fire')return true;
   const target=bodies.find(o=>o.id===b.targetId);
   if(!target){emit({tick,ownerId:b.ownerId,abilityId:b.abilityId,kind:'cancelled',point:b.start,reason:'target-defeated'});return false;}
   b.start={...owner.position};
   if(tick<=b.releaseTick-e.aimLockTicks){
    const lead=e.aimLockTicks/60,dx=target.position.x+target.velocity.x*lead-b.start.x,dy=target.position.y+target.velocity.y*lead-b.start.y,l=Math.hypot(dx,dy);
    if(l>1e-6)b.aim={x:dx/l,y:dy/l};
   }
   b.end=beamEnd(b.start,b.aim,b.width,arena);
   // The last charging tick still resolves incoming damage before next tick's release.
   if(tick<=b.releaseTick)return true;
   b.phase='fire';emit({tick,ownerId:b.ownerId,abilityId:b.abilityId,kind:'thrust',point:b.start,end:b.end,reason:'beam-release'});
   if(Math.hypot(b.end.x-b.start.x,b.end.y-b.start.y)<1e-6)return true;
   for(const target of bodies){
    if(target.id===b.ownerId||target.ownerId===b.ownerId)continue;
    const dx=target.position.x-b.start.x,dy=target.position.y-b.start.y,l=Math.hypot(dx,dy);
    if(dx*b.aim.x+dy*b.aim.y<0||!goLineTouches(target,{start:b.start,end:b.end,width:b.width} as Parameters<typeof goLineTouches>[1],true)||l>1e-6&&clearSpearLength(b.start,{x:dx/l,y:dy/l},l,0,arena)<l-.01)continue;
    requests.push({tick,targetId:target.id,amount:e.damage*b.multiplier,source:{kind:'projectile',attackerId:b.ownerId,abilityId:b.abilityId,projectileId:'beam-'+b.serial}});
    emit({tick,ownerId:b.ownerId,abilityId:b.abilityId,kind:'hit',targetId:target.id,point:{...target.position},reason:'beam-hit'});
   }
   return true;
  });return requests;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.beams=this.beams.filter(b=>!finished&&living.has(b.ownerId));}
 snapshot(){return this.beams.map(({definition,targetId,aim,multiplier,serial,...b})=>structuredClone(b));}
}
