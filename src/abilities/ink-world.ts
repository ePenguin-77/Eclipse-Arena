import type { AbilityEffect, AbilityEvent, InkStrokeSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';
import { clearOfArena } from '../arenas/arena-registry';
import { sweepCircle } from '../math/sweep-circle';

type Stroke = Extract<AbilityEffect,{kind:'ink-stroke'}>;
type Emit = (e:Omit<AbilityEvent,'id'>)=>void;

/** Sweep a moving disk against the capsule occupied by a brush stroke. */
export function crossesInk(b: BodySnapshot, s: InkStrokeSnapshot) {
  const c=Math.cos(s.angle),n=Math.sin(s.angle);
  const local=(p:Vec2)=>({x:(p.x-s.position.x)*c+(p.y-s.position.y)*n,y:-(p.x-s.position.x)*n+(p.y-s.position.y)*c});
  const a=local(b.previousPosition),z=local(b.position),r=b.radius+s.radius,h=s.length/2;
  if ([a,z].some(p=>Math.abs(p.x)<=h&&Math.abs(p.y)<=r)) return true;
  for (const x of [-h,h]) if(sweepCircle({x:a.x-x,y:a.y},{x:z.x-x,y:z.y},r)!==null)return true;
  if (Math.abs(z.y-a.y)>1e-9) for(const y of [-r,r]){
    const t=(y-a.y)/(z.y-a.y),x=a.x+(z.x-a.x)*t;
    if(t>=0&&t<=1&&Math.abs(x)<=h)return true;
  }
  return false;
}
export class InkWorld {
  private strokes:InkStrokeSnapshot[]=[];
  private nextId=1;
  count(ownerId:string){return this.strokes.filter(s=>s.ownerId===ownerId).length;}
  prune(tick:number,living:ReadonlySet<string>){this.strokes=this.strokes.filter(s=>tick<s.expiresTick&&living.has(s.ownerId));}
  spawn(tick:number,owner:BodySnapshot,point:Vec2,angle:number,abilityId:string,e:Stroke,damage:number,
    arena:ArenaDefinition,bodies:readonly BodySnapshot[],emit:Emit):DamageRequest[]{
    if(this.count(owner.id)>=3)return [];
    // Keep the whole stroke out of obstacles and inside the arena; finite deterministic alternatives.
    const margin=e.length/2+e.radius;
    const clamp=(p:Vec2)=>({x:Math.max(margin,Math.min(arena.width-margin,p.x)),y:Math.max(margin,Math.min(arena.height-margin,p.y))});
    const center=[point,...[0,Math.PI/2,Math.PI,Math.PI*1.5].map(a=>({x:point.x+Math.cos(a)*margin,y:point.y+Math.sin(a)*margin})),owner.position]
      .map(clamp).find(p=>clearOfArena(arena,p,margin));
    if(!center){emit({tick,ownerId:owner.id,abilityId,kind:'miss',point,reason:'ink-blocked'});return [];}
    const stroke:InkStrokeSnapshot={id:'ink-'+this.nextId++,ownerId:owner.id,abilityId,position:center,angle,
      length:e.length,radius:e.radius,spawnedTick:tick,expiresTick:tick+e.lifetimeTicks,fieldStatus:structuredClone(e.fieldStatus)};
    this.strokes.push(stroke);
    emit({tick,ownerId:owner.id,abilityId,kind:'area',point:center,reason:'ink-stroke'});
    return bodies.filter(b=>b.id!==owner.id&&b.ownerId!==owner.id&&crossesInk({...b,previousPosition:b.position},stroke)).map(b=>{
      emit({tick,ownerId:owner.id,abilityId,kind:'hit',targetId:b.id,point:b.position});
      return {tick,targetId:b.id,amount:damage,source:{kind:'area' as const,attackerId:owner.id,abilityId,areaId:stroke.id}};
    });
  }
  fields(tick:number,bodies:readonly BodySnapshot[]){
    return this.strokes.filter(s=>tick>s.spawnedTick&&tick<s.expiresTick&&bodies.some(b=>b.id===s.ownerId))
      .flatMap(s=>bodies.filter(b=>b.id!==s.ownerId&&b.ownerId!==s.ownerId&&crossesInk(b,s))
        .map(b=>({sourceId:s.ownerId,targetId:b.id,abilityId:s.abilityId,definition:s.fieldStatus})));
  }
  consume(ownerId:string){
    const owned=this.strokes.filter(s=>s.ownerId===ownerId);
    if(owned.length!==3)return [];
    this.strokes=this.strokes.filter(s=>s.ownerId!==ownerId);
    return structuredClone(owned);
  }
  cleanup(living:ReadonlySet<string>,finished:boolean){this.strokes=this.strokes.filter(s=>!finished&&living.has(s.ownerId));}
  snapshot(){return structuredClone(this.strokes);}
}
