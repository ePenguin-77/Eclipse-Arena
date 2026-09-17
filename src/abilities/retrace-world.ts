import type { AbilityDefinition, AbilityEvent, RetracePoint, RetraceSwordSnapshot } from '../contracts/abilities';
import type { BodySnapshot, Vec2 } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';

type Emit = (event:Omit<AbilityEvent,'id'>)=>void;
type Memory = RetracePoint & {tick:number};
type Sword = RetraceSwordSnapshot & {damage:number;hit:Set<string>;recordUntil:number;rate:number};
const distance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.y-b.y);
const mix=(a:Vec2,b:Vec2,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
// Relative swept circles: fast bodies crossing between ticks are still hit.
export function retraceTouches(a:Vec2,b:Vec2,from:Vec2,to:Vec2,radius:number){
 const p={x:a.x-from.x,y:a.y-from.y},q={x:b.x-to.x,y:b.y-to.y};
 const dx=q.x-p.x,dy=q.y-p.y,l=dx*dx+dy*dy;
 const t=l?Math.max(0,Math.min(1,-(p.x*dx+p.y*dy)/l)):0;
 return Math.hypot(p.x+dx*t,p.y+dy*t)<=radius;
}
export function validateRetrace(d:AbilityDefinition){
 const e=d.effect;if(e.kind!=='retrace-follow'&&e.kind!=='retrace-return')return;
 if(!Number.isFinite(e.damage)||e.damage<=0||e.damage>60||d.range!==5||!Number.isFinite(e.radius)||e.radius<8||e.radius>28)throw Error('Invalid retrace damage/radius');
 const integer=(v:number,min:number,max:number)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(e.kind==='retrace-follow'&&(d.ultimate||!integer(e.delayTicks,12,120)||!integer(e.recordTicks,60,180)))throw Error('Invalid retrace follow');
 if(e.kind==='retrace-return'&&(!d.ultimate||!integer(e.historyTicks,60,180)||!integer(e.warningTicks,18,60)||!integer(e.intervalTicks,10,30)||e.durationTicks!==e.warningTicks+2*e.intervalTicks+Math.ceil(e.historyTicks/2)))throw Error('Invalid retrace return');
}
export class RetraceWorld {
 private history=new Map<string,Memory[]>();
 private swords:Sword[]=[];
 private serial=0;
 record(tick:number,bodies:readonly BodySnapshot[],owners:ReadonlySet<string>){
  for(const b of bodies){
   if(!owners.has(b.id))continue;
   const h=this.history.get(b.id)??[],last=h.at(-1);
   if(last?.tick===tick)continue;
   // Teleports are discontinuities, not damaging chords across the arena.
   const connected=!!last&&last.tick===tick-1&&distance(last,b.position)<=Math.max(45,b.speed/60*4);
   const p={...b.position,tick,connected};h.push(p);
   while(h.length>181||h[0]!.tick<tick-180)h.shift();
   this.history.set(b.id,h);
   for(const s of this.swords)if(s.ownerId===b.id&&!s.ultimate&&tick>s.startedTick&&tick<=s.recordUntil)s.path.push({...p});
  }
 }
 start(tick:number,owner:BodySnapshot,d:AbilityDefinition,multiplier:number){
  const e=d.effect;if(e.kind!=='retrace-follow'&&e.kind!=='retrace-return')return;
  const ultimate=e.kind==='retrace-return';
  if(ultimate&&this.hasUltimate(owner.id))return;
  let path:RetracePoint[]=[{...owner.position,connected:false}];
  if(e.kind==='retrace-return'){
   const h=(this.history.get(owner.id)??[]).filter(p=>p.tick>=tick-e.historyTicks);
   path=h.slice().reverse().map((p,i)=>({x:p.x,y:p.y,connected:i>0?h[h.length-i]!.connected:false}));
   if(!path.length)path=[{...owner.position,connected:false}];
  }
  const count=ultimate?3:1;
  for(let i=0;i<count;i++){
   const launchTick=tick+(e.kind==='retrace-return'?e.warningTicks+i*e.intervalTicks:e.delayTicks);
   const endsTick=launchTick+(e.kind==='retrace-return'?Math.max(1,Math.ceil((path.length-1)/2)):e.recordTicks);
   this.swords.push({id:`retrace-${++this.serial}`,ownerId:owner.id,abilityId:d.id,ultimate,startedTick:tick,launchTick,endsTick,
    position:{...path[0]!},previousPosition:{...path[0]!},angle:Math.atan2(owner.velocity.y,owner.velocity.x)+(ultimate?Math.PI:0),path:structuredClone(path),cursor:0,radius:e.radius,
    damage:e.damage*multiplier,hit:new Set(),recordUntil:ultimate?tick:tick+e.recordTicks,rate:ultimate?2:1});
  }
 }
 hasUltimate(id:string){return this.swords.some(s=>s.ownerId===id&&s.ultimate);}
 remaining(id:string,tick:number){return Math.max(0,...this.swords.filter(s=>s.ownerId===id&&s.ultimate).map(s=>s.endsTick-tick));}
 step(tick:number,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit):DamageRequest[]{
  this.cleanup(new Set(bodies.map(b=>b.id)),false);
  this.swords=this.swords.filter(s=>tick<s.endsTick&&!locked.has(s.ownerId));
  const requests:DamageRequest[]=[];
  for(const s of this.swords){
   s.previousPosition={...s.position};
   if(tick<s.launchTick)continue;
   const next=Math.min(s.path.length-1,(tick-s.launchTick+1)*s.rate);
   const first=s.cursor,steps=Math.max(1,next-first);
   for(let i=first+1;i<=next;i++){
    const a=s.path[i-1]!,b=s.path[i]!;
    s.position={x:b.x,y:b.y};
    if(!b.connected){s.previousPosition={...s.position};continue;}
    if(distance(a,b)>.01)s.angle=Math.atan2(b.y-a.y,b.x-a.x);
    for(const target of bodies){
     if(target.id===s.ownerId||target.ownerId===s.ownerId||s.hit.has(target.id))continue;
     // A target teleport must not create a fake swept collision either.
     const prev=distance(target.previousPosition,target.position)>Math.max(45,target.speed/60*4)?target.position:target.previousPosition;
     if(!retraceTouches(a,b,mix(prev,target.position,(i-first-1)/steps),mix(prev,target.position,(i-first)/steps),s.radius+target.radius))continue;
     s.hit.add(target.id);
     requests.push({tick,targetId:target.id,amount:s.damage,source:{kind:'projectile',attackerId:s.ownerId,abilityId:s.abilityId,projectileId:s.id}});
     emit({tick,ownerId:s.ownerId,abilityId:s.abilityId,targetId:target.id,kind:'hit',point:{...target.position},end:{...a},reason:'retrace-strike'});
    }
   }
   s.cursor=next;
  }
  return requests;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){
  this.swords=this.swords.filter(s=>!finished&&living.has(s.ownerId));
  for(const id of this.history.keys())if(finished||!living.has(id))this.history.delete(id);
 }
 snapshot(){return {retraceSwords:this.swords.map(({damage,hit,recordUntil,rate,...s})=>structuredClone(s))};}
}
