import type { AbilityDefinition, AbilityEffect, AbilityEvent, GuardSnapshot, ReturningWeaponSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';
import { sweepCircle } from '../math/sweep-circle';
import { clearSpearLength } from './spear-world';

type ThrowEffect = Extract<AbilityEffect,{kind:'returning-weapon'}>;
type GuardEffect = Extract<AbilityEffect,{kind:'guard-burst'}>;
type Emit = (e:Omit<AbilityEvent,'id'>)=>void;
interface Flight extends ReturningWeaponSnapshot { origin:Vec2; end:Vec2; normal:Vec2; effect:ThrowEffect; multiplier:number; hits:Set<string> }
interface Guard extends GuardSnapshot { effect:GuardEffect; multiplier:number }

export function validateReturningWeapon(d:AbilityDefinition){
  const e=d.effect;
  const bounded=(v:number,min:number,max:number)=>Number.isFinite(v)&&v>=min&&v<=max;
  if(e.kind==='returning-weapon' && (d.ultimate || d.range===0 || !bounded(e.reach,80,500) || !bounded(e.radius,10,50) ||
    !Number.isInteger(e.outboundTicks)||!bounded(e.outboundTicks,12,90)||!bounded(e.returnSpeed,100,1400)||
    !Number.isInteger(e.lifetimeTicks)||!bounded(e.lifetimeTicks,e.outboundTicks+1,300)||!bounded(e.curve,-80,80)||!bounded(e.heldReduction,0,.5)))throw Error('Invalid returning weapon');
  if(e.kind==='guard-burst' && (!d.ultimate || !Number.isInteger(e.durationTicks)||!bounded(e.durationTicks,30,180)||
    !bounded(e.reduction,0,.7)||!bounded(e.bonusCap,0,60)||!bounded(e.radius,50,250)))throw Error('Invalid guard burst');
}

/** One outbound arc and one homing return; combat stays independent from sprite rotation. */
export class ReturningWeaponWorld {
  private flights:Flight[]=[];
  private guards:Guard[]=[];
  private nextId=1;
  hasFlight(id:string){return this.flights.some(f=>f.ownerId===id);}
  hasGuard(id:string){return this.guards.some(g=>g.ownerId===id);}
  guardRemaining(id:string,tick:number){const g=this.guards.find(g=>g.ownerId===id);return g?Math.max(0,g.endsTick-tick):0;}
  launch(tick:number,owner:BodySnapshot,aim:Vec2,d:AbilityDefinition,multiplier:number,distance:number){
    if(d.effect.kind!=='returning-weapon'||this.hasFlight(owner.id))return;
    const e=d.effect,reach=Math.min(e.reach,Math.max(100,distance+40));
    this.flights.push({id:`returning-${this.nextId++}`,ownerId:owner.id,abilityId:d.id,position:{...owner.position},previousPosition:{...owner.position},
      origin:{...owner.position},end:{x:owner.position.x+aim.x*reach,y:owner.position.y+aim.y*reach},normal:{x:-aim.y,y:aim.x},
      radius:e.radius,spawnedTick:tick,returning:false,effect:e,multiplier,hits:new Set()});
  }
  startGuard(tick:number,ownerId:string,d:AbilityDefinition,multiplier:number){
    if(d.effect.kind!=='guard-burst')return;
    this.flights=this.flights.filter(f=>f.ownerId!==ownerId);
    this.guards.push({ownerId,abilityId:d.id,startedTick:tick,endsTick:tick+d.effect.durationTicks,absorbed:0,bonusCap:d.effect.bonusCap,effect:d.effect,multiplier});
  }
  /** Called after other mitigation. Poison, burn, and zero-damage evades never feed the guard. */
  mitigate(tick:number,request:DamageRequest,heldReduction:number):{request:DamageRequest;blocked:boolean;charging:boolean}{
    if(request.source.kind==='status'||request.source.attackerId===request.targetId||request.amount<=0)return {request,blocked:false,charging:false};
    const g=this.guards.find(g=>g.ownerId===request.targetId&&tick<g.endsTick);
    const reduction=g?.effect.reduction??(this.hasFlight(request.targetId)?0:heldReduction);
    const absorbed=request.amount*reduction;
    if(g)g.absorbed=Math.min(g.bonusCap,g.absorbed+absorbed);
    return {request:absorbed>0?{...request,amount:request.amount-absorbed}:request,blocked:absorbed>0,charging:absorbed>0&&!g};
  }
  step(tick:number,dt:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit):DamageRequest[]{
    const requests:DamageRequest[]=[];
    this.guards=this.guards.filter(g=>{
      const owner=bodies.find(b=>b.id===g.ownerId);
      if(!owner||locked.has(g.ownerId))return false;
      if(tick<g.endsTick)return true;
      emit({tick,ownerId:g.ownerId,abilityId:g.abilityId,kind:'area',point:{...owner.position},reason:'guard-release'});
      for(const b of bodies){
        if(b.id===owner.id||b.ownerId===owner.id)continue;
        const dx=b.position.x-owner.position.x,dy=b.position.y-owner.position.y,dist=Math.hypot(dx,dy);
        if(dist>g.effect.radius+b.radius||(dist>1e-6&&clearSpearLength(owner.position,{x:dx/dist,y:dy/dist},dist,0,arena)<dist-.01))continue;
        requests.push({tick,targetId:b.id,source:{kind:'melee',attackerId:owner.id,abilityId:g.abilityId},amount:(g.effect.damage+g.absorbed)*g.multiplier});
        emit({tick,ownerId:owner.id,abilityId:g.abilityId,kind:'hit',targetId:b.id,point:{...b.position}});
      }
      return false;
    });
    this.flights=this.flights.filter(f=>{
      const owner=bodies.find(b=>b.id===f.ownerId),e=f.effect;
      if(!owner||locked.has(f.ownerId)||tick>=f.spawnedTick+e.lifetimeTicks)return false;
      if(tick<=f.spawnedTick)return true;
      const start={...f.position};f.previousPosition=start;
      let end:Vec2;
      if(!f.returning){
        const p=Math.min(1,(tick-f.spawnedTick)/e.outboundTicks),bend=Math.sin(Math.PI*p)*e.curve;
        end={x:f.origin.x+(f.end.x-f.origin.x)*p+f.normal.x*bend,y:f.origin.y+(f.end.y-f.origin.y)*p+f.normal.y*bend};
      }else{
        const dx=owner.position.x-start.x,dy=owner.position.y-start.y,dist=Math.hypot(dx,dy),travel=Math.min(dist,e.returnSpeed*dt);
        end=dist>1e-6?{x:start.x+dx/dist*travel,y:start.y+dy/dist*travel}:{...start};
      }
      const dx=end.x-start.x,dy=end.y-start.y,dist=Math.hypot(dx,dy);
      const clear=dist>1e-6?clearSpearLength(start,{x:dx/dist,y:dy/dist},dist,f.radius,arena):0;
      const stop=dist>1e-6?Math.min(1,clear/dist):1;
      // Catch time clips the return sweep so it cannot hit anything beyond its owner.
      const catchTime=f.returning?sweepCircle({x:start.x-owner.previousPosition.x,y:start.y-owner.previousPosition.y},{x:end.x-owner.position.x,y:end.y-owner.position.y},owner.radius+f.radius):null;
      const limit=Math.min(stop,catchTime??1);
      for(const b of bodies){
        if(b.id===owner.id||b.ownerId===owner.id||f.hits.has(b.id))continue;
        const t=sweepCircle({x:start.x-b.previousPosition.x,y:start.y-b.previousPosition.y},{x:end.x-b.position.x,y:end.y-b.position.y},f.radius+b.radius);
        if(t===null||t>limit||stop<1&&t>=stop)continue;
        f.hits.add(b.id);
        requests.push({tick,targetId:b.id,source:{kind:'projectile',attackerId:owner.id,abilityId:f.abilityId,projectileId:f.id},amount:e.damage*f.multiplier});
        emit({tick,ownerId:owner.id,abilityId:f.abilityId,kind:'hit',targetId:b.id,point:{...b.position}});
      }
      f.position={x:start.x+dx*limit,y:start.y+dy*limit};
      if(catchTime!==null&&catchTime<=stop)return false;
      if(stop<1){
        emit({tick,ownerId:owner.id,abilityId:f.abilityId,kind:'wall',point:{...f.position}});
        if(f.returning)return false;
        // Back off the wall before returning; the return still cannot travel through pillars.
        if(dist>1e-6){f.position.x-=dx/dist*.05;f.position.y-=dy/dist*.05;}
        f.returning=true;f.hits.clear();
      }else if(!f.returning&&tick-f.spawnedTick>=e.outboundTicks){f.returning=true;f.hits.clear();}
      return true;
    });
    return requests;
  }
  cleanup(living:ReadonlySet<string>,finished:boolean){this.flights=this.flights.filter(f=>!finished&&living.has(f.ownerId));this.guards=this.guards.filter(g=>!finished&&living.has(g.ownerId));}
  snapshot():ReturningWeaponSnapshot[]{return this.flights.map(({origin,end,normal,effect,multiplier,hits,...f})=>structuredClone(f));}
  guardSnapshot():GuardSnapshot[]{return this.guards.map(({effect,multiplier,...g})=>({...g}));}
}
