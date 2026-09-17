import type { AbilityDefinition, AbilityEffect, AbilityEvent } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2, PhysicsEvent } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';
import { clearSpearLength } from './spear-world';
type Effect=Extract<AbilityEffect,{kind:'sweep'}>;
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
interface Sweep {ownerId:string;definition:AbilityDefinition;origin:Vec2;angle:number;ends:number;started:number;dashEnds?:number;multiplier:number;hits:Set<string>}
const cross=(a:Vec2,b:Vec2,c:Vec2)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function pointDistance(p:Vec2,a:Vec2,b:Vec2){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function segmentDistance(a:Vec2,b:Vec2,c:Vec2,d:Vec2){
 const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);
 if(ab1*ab2<0&&cd1*cd2<0)return 0;
 return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));
}
function inside(p:Vec2,poly:Vec2[]){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i]!,b=poly[j]!;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
/** A fine polygon approximates the arc (<1 unit error); swept disks cover its complete sector. */
export function sweepTouches(origin:Vec2,angle:number,radius:number,arc:number,b:BodySnapshot){
 const half=arc*Math.PI/360,n=Math.ceil(arc/8),poly:Vec2[]=arc<360?[origin]:[];
 for(let i=0;i<=n;i++){const theta=angle-half+2*half*i/n;poly.push({x:origin.x+Math.cos(theta)*radius,y:origin.y+Math.sin(theta)*radius});}
 return inside(b.position,poly)||inside(b.previousPosition,poly)||poly.some((p,i)=>segmentDistance(b.previousPosition,b.position,p,poly[(i+1)%poly.length]!)<=b.radius);
}
export function validateSweep(d:AbilityDefinition){const e=d.effect;if(e.kind!=='sweep')return;
 if(d.range===0||![e.radius,e.arcDegrees,e.activeTicks,e.tipStart,e.tipMultiplier].every(Number.isFinite)||e.radius<50||e.radius>240||e.arcDegrees<45||e.arcDegrees>360||!Number.isInteger(e.activeTicks)||e.activeTicks<1||e.activeTicks>18||e.tipStart<0||e.tipStart>1||e.tipMultiplier<1||e.tipMultiplier>1.6||Boolean(d.ultimate)!==Boolean(e.dash))throw Error('Invalid sweep');
 if(e.dash&&(!Number.isFinite(e.dash.speed)||e.dash.speed<100||e.dash.speed>1200||!Number.isInteger(e.dash.durationTicks)||e.dash.durationTicks<1||e.dash.durationTicks>30))throw Error('Invalid sweep dash');
}
export class SweepWorld {
 private active:Sweep[]=[];
 hasOwner(id:string){return this.active.some(s=>s.ownerId===id);}
 hasUltimate(id:string){return this.active.some(s=>s.ownerId===id&&s.definition.ultimate);}
 start(tick:number,owner:BodySnapshot,aim:Vec2,definition:AbilityDefinition,multiplier:number,emit:Emit){
  if(definition.effect.kind!=='sweep')return;
  const e=definition.effect,s:Sweep={ownerId:owner.id,definition,origin:{...owner.position},angle:Math.atan2(aim.y,aim.x),started:tick,ends:tick+e.activeTicks,dashEnds:e.dash?tick+e.dash.durationTicks:undefined,multiplier,hits:new Set()};
  this.active.push(s);if(!e.dash)this.release(tick,s,emit);
 }
 private release(tick:number,s:Sweep,emit:Emit){emit({tick,ownerId:s.ownerId,abilityId:s.definition.id,kind:'thrust',point:{...s.origin},end:{x:s.origin.x+Math.cos(s.angle),y:s.origin.y+Math.sin(s.angle)},reason:'crescent-sweep'});}
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,impacts:readonly Omit<PhysicsEvent,'id'>[],emit:Emit){
  const requests:DamageRequest[]=[];
  this.active=this.active.filter(s=>{
   const owner=bodies.find(b=>b.id===s.ownerId),e=s.definition.effect as Effect;
   if(!owner||locked.has(s.ownerId))return false;
   if(s.dashEnds!==undefined){
    const blocked=impacts.some(p=>p.bodyId===owner.id&&(p.type==='wall'||p.type==='obstacle')&&p.impulseApplied);
    if(tick<s.dashEnds&&!blocked)return true;
    s.origin={...owner.position};s.angle+=Math.PI;s.dashEnds=undefined;s.ends=tick+e.activeTicks;this.release(tick,s,emit);
   }
   if(tick>=s.ends)return false;
   for(const b of bodies){
    if(b.id===owner.id||b.ownerId===owner.id||s.hits.has(b.id)||!sweepTouches(s.origin,s.angle,e.radius,e.arcDegrees,b))continue;
    const dx=b.position.x-s.origin.x,dy=b.position.y-s.origin.y,dist=Math.hypot(dx,dy);
    if(dist>1e-6&&clearSpearLength(s.origin,{x:dx/dist,y:dy/dist},dist,0,arena)<dist-.01)continue;
    s.hits.add(b.id);const tip=dist>=e.radius*e.tipStart;
    requests.push({tick,targetId:b.id,source:{kind:'melee',attackerId:owner.id,abilityId:s.definition.id},amount:e.damage*s.multiplier*(tip?e.tipMultiplier:1)});
    emit({tick,ownerId:owner.id,abilityId:s.definition.id,kind:'hit',targetId:b.id,point:{...b.position},reason:tip?'crescent-tip':'crescent-hit'});
   }
   return true;
  });return requests;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.active=this.active.filter(s=>!finished&&living.has(s.ownerId));}
}
