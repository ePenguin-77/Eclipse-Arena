import type { AbilityDefinition, AbilityEffect, AbilityEvent } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2, PhysicsEvent } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';
import { sweepCircle } from '../math/sweep-circle';

type Thrust = Extract<AbilityEffect, {kind:'thrust'}>;
type Emit = (event: Omit<AbilityEvent,'id'>) => void;

/** Swept target against a fixed shaft capsule; catches crossing between ticks. */
function shaftContact(origin:Vec2,aim:Vec2,length:number,radius:number,b:BodySnapshot){
  const local=(p:Vec2)=>({x:(p.x-origin.x)*aim.x+(p.y-origin.y)*aim.y,y:-(p.x-origin.x)*aim.y+(p.y-origin.y)*aim.x});
  const a=local(b.previousPosition),z=local(b.position),r=radius+b.radius;
  if(sweepCircle(a,z,r)!==null||sweepCircle({x:a.x-length,y:a.y},{x:z.x-length,y:z.y},r)!==null)return true;
  let lo=0,hi=1;
  for(const [p,q,min,max] of [[a.x,z.x,0,length],[a.y,z.y,-r,r]]){
    const d=q!-p!;if(Math.abs(d)<1e-8){if(p!<min!||p!>max!)return false;continue;}
    const t0=(min!-p!)/d,t1=(max!-p!)/d;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
  }
  return lo<=hi;
}

/** First solid obstruction, shared by thrust reach and burst line of sight. */
export function clearSpearLength(origin: Vec2, direction: Vec2, length: number, radius: number, arena: ArenaDefinition) {
  let limit=length;
  for (const axis of ['x','y'] as const) {
    const d=direction[axis], bound=axis==='x'?arena.width:arena.height;
    if(d>0)limit=Math.min(limit,(bound-radius-origin[axis])/d);
    if(d<0)limit=Math.min(limit,(radius-origin[axis])/d);
  }
  const end={x:origin.x+direction.x*length,y:origin.y+direction.y*length};
  for(const o of arena.obstacles??[]) {
    const t=sweepCircle({x:origin.x-o.center.x,y:origin.y-o.center.y},{x:end.x-o.center.x,y:end.y-o.center.y},o.radius+radius);
    if(t!==null)limit=Math.min(limit,t*length);
  }
  return Math.max(0,limit);
}

export function spearStrike(tick:number, owner:BodySnapshot, aim:Vec2, d:AbilityDefinition, multiplier:number,
  arena:ArenaDefinition, targets:readonly BodySnapshot[], emit:Emit, swept=false): DamageRequest[] {
  const e=d.effect as Thrust, length=clearSpearLength(owner.position,aim,e.length,e.radius,arena);
  const end={x:owner.position.x+aim.x*length,y:owner.position.y+aim.y*length};
  emit({tick,ownerId:owner.id,abilityId:d.id,kind:'thrust',point:{...owner.position},end});
  return targets.filter(b=>b.id!==owner.id&&b.ownerId!==owner.id).flatMap(b=>{
    const dx=b.position.x-owner.position.x,dy=b.position.y-owner.position.y;
    const along=dx*aim.x+dy*aim.y;
    // Shortening the shaft at a wall must not create a new sweet spot.
    const t=sweepCircle({x:-dx,y:-dy},{x:end.x-b.position.x,y:end.y-b.position.y},b.radius+e.radius);
    if(length===0||(!swept&&(along<0||t===null||t*length>=length))||(swept&&!shaftContact(owner.position,aim,length,e.radius,b)))return [];
    const dist=Math.hypot(dx,dy);
    if(dist>1e-6&&clearSpearLength(owner.position,{x:dx/dist,y:dy/dist},dist,0,arena)<dist-.01)return [];
    const tip=along>=e.tipStart*e.length;
    emit({tick,ownerId:owner.id,abilityId:d.id,kind:'hit',targetId:b.id,point:{...b.position},reason:tip?'spear-tip':'spear-shaft'});
    return [{tick,targetId:b.id,source:{kind:'melee' as const,attackerId:owner.id,abilityId:d.id},amount:e.damage*multiplier*(tip?e.tipMultiplier:1)}];
  });
}

interface Lunge { ownerId:string; abilityId:string; aim:Vec2; started:number; ends:number; effect:Thrust; multiplier:number; hit:Set<string> }
export class SpearWorld {
  private thrusts:{owner:BodySnapshot;aim:Vec2;definition:AbilityDefinition;multiplier:number;ends:number;hit:Set<string>}[]=[];
  startThrust(tick:number,owner:BodySnapshot,aim:Vec2,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition,targets:readonly BodySnapshot[],emit:Emit){
    const requests=spearStrike(tick,owner,aim,d,multiplier,arena,targets,emit);
    this.thrusts.push({owner:structuredClone(owner),aim:{...aim},definition:d,multiplier,ends:tick+((d.effect as Thrust).activeTicks??1),hit:new Set(requests.map(r=>r.targetId))});
    return requests;
  }
  private lunges:Lunge[]=[];
  hasLunge(id:string){return this.lunges.some(s=>s.ownerId===id);}
  hasOwner(id:string){return this.lunges.some(s=>s.ownerId===id)||this.thrusts.some(s=>s.owner.id===id);}
  remaining(id:string,tick:number){const s=this.lunges.find(s=>s.ownerId===id);return s?Math.max(1,s.ends-tick):undefined;}
  start(tick:number,ownerId:string,d:AbilityDefinition,aim:Vec2,multiplier:number) {
    const effect=d.effect as Thrust;
    this.lunges.push({ownerId,abilityId:d.id,aim:{...aim},started:tick,ends:tick+effect.lunge!.durationTicks,effect,multiplier,hit:new Set()});
  }
  step(tick:number,arena:ArenaDefinition,targets:readonly BodySnapshot[],locked:ReadonlySet<string>,
    impacts:readonly Omit<PhysicsEvent,'id'>[],emit:Emit):DamageRequest[] {
    const requests:DamageRequest[]=[];
    this.thrusts=this.thrusts.filter(s=>{
      if(tick>=s.ends||locked.has(s.owner.id)||!targets.some(b=>b.id===s.owner.id))return false;
      const hits=spearStrike(tick,s.owner,s.aim,s.definition,s.multiplier,arena,targets.filter(b=>!s.hit.has(b.id)),e=>{if(e.kind!=='thrust')emit(e);},true);
      for(const h of hits)s.hit.add(h.targetId);requests.push(...hits);return true;
    });
    this.lunges=this.lunges.filter(s=>{
      const owner=targets.find(b=>b.id===s.ownerId),e=s.effect;
      if(!owner||locked.has(s.ownerId))return false;
      if(tick<=s.started)return true;
      const collided=impacts.some(i=>i.bodyId===owner.id&&(i.type==='wall'||i.type==='obstacle')&&i.impulseApplied);
      const done=tick>=s.ends||collided;
      const start=owner.previousPosition;
      const dx=owner.position.x-start.x,dy=owner.position.y-start.y;
      const distance=Math.hypot(dx,dy),aim=s.aim;
      const length=clearSpearLength(start,aim,distance+80,e.radius,arena);
      const end={x:start.x+aim.x*length,y:start.y+aim.y*length};
      if((tick-s.started)%2===0)emit({tick,ownerId:s.ownerId,abilityId:s.abilityId,kind:'thrust',point:{...start},end,reason:'spear-lunge'});
      const hit=(b:BodySnapshot,damage:number)=>{
        requests.push({tick,targetId:b.id,source:{kind:'melee',attackerId:owner.id,abilityId:s.abilityId},amount:damage*s.multiplier});
        emit({tick,ownerId:owner.id,abilityId:s.abilityId,kind:'hit',targetId:b.id,point:{...b.position}});
      };
      for(const b of targets) {
        if(b.id===owner.id||b.ownerId===owner.id)continue;
        const bx=b.position.x-start.x,by=b.position.y-start.y,dist=Math.hypot(bx,by);
        if(shaftContact(start,aim,length,e.radius,b)&&!s.hit.has(b.id)&&(dist<1e-6||clearSpearLength(start,{x:bx/dist,y:by/dist},dist,0,arena)>=dist-.01)){s.hit.add(b.id);hit(b,e.damage);}
        if(done) {
          const bx=b.position.x-owner.position.x,by=b.position.y-owner.position.y,dist=Math.hypot(bx,by);
          if(dist<=e.lunge!.burstRadius+b.radius&&(dist<1e-6||clearSpearLength(owner.position,{x:bx/dist,y:by/dist},dist,0,arena)>=dist-.01))hit(b,e.lunge!.burstDamage);
        }
      }
      if(done)emit({tick,ownerId:owner.id,abilityId:s.abilityId,kind:'lunge-burst',point:{...owner.position}});
      return !done;
    });
    return requests;
  }
  cleanup(living:ReadonlySet<string>,finished:boolean){this.lunges=this.lunges.filter(s=>!finished&&living.has(s.ownerId));this.thrusts=this.thrusts.filter(s=>!finished&&living.has(s.owner.id));}
}
