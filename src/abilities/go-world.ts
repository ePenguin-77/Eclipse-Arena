import type { AbilityDefinition, AbilityEvent, GoStoneSnapshot, GoLineSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import type { DamageRequest } from '../contracts/combat';
import { clearSpearLength } from './spear-world';
import { crossesInk } from './ink-world';
import { sweepCircle } from '../math/sweep-circle';
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
interface Stone extends GoStoneSnapshot { goal:Vec2; definition:AbilityDefinition; multiplier:number }
interface Line extends GoLineSnapshot { damage:number; cooldown:number; ready:Map<string,number>; touching:Set<string> }
interface Board { id:string; ownerId:string; definition:AbilityDefinition; center:Vec2; ends:number; multiplier:number }
export function goLineTouches(b:BodySnapshot,line:GoLineSnapshot,stationary=false){
 return crossesInk(stationary?{...b,previousPosition:b.position}:b,{position:{x:(line.start.x+line.end.x)/2,y:(line.start.y+line.end.y)/2},angle:Math.atan2(line.end.y-line.start.y,line.end.x-line.start.x),length:Math.hypot(line.end.x-line.start.x,line.end.y-line.start.y),radius:line.width/2} as Parameters<typeof crossesInk>[1]);
}
export function validateGo(d:AbilityDefinition){const e=d.effect;if(e.kind!=='go-stone'&&e.kind!=='go-board')return;
 if(d.range===0||!Number.isFinite(e.lineDamage)||e.lineDamage<=0||!Number.isFinite(e.lineWidth)||e.lineWidth<2||e.lineWidth>24)throw Error('Invalid Go line');
 if(e.kind==='go-stone'&&(d.ultimate||!Number.isFinite(e.speed)||e.speed<100||e.speed>1000||!Number.isInteger(e.lifetimeTicks)||e.lifetimeTicks<120||e.lifetimeTicks>600||!Number.isInteger(e.lineCooldownTicks)||e.lineCooldownTicks<30))throw Error('Invalid Go stone');
 if(e.kind==='go-board'&&(!d.ultimate||!Number.isFinite(e.radius)||e.radius<60||e.radius>220||!Number.isInteger(e.intervalTicks)||e.intervalTicks<18||e.intervalTicks>60))throw Error('Invalid Go board');
}
/** Stones and visible lines share the exact same world-space geometry used for hits. */
export class GoWorld {
 private stones:Stone[]=[];private lines:Line[]=[];private boards:Board[]=[];private next=1;private colors=new Map<string,0|1>();
 hasBoard(ownerId:string){return this.boards.some(b=>b.ownerId===ownerId);}
 launch(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(d.effect.kind!=='go-stone')return;
  const color=this.colors.get(owner.id)??0;this.colors.set(owner.id,color===0?1:0);
  const dx=target.position.x-owner.position.x,dy=target.position.y-owner.position.y,len=Math.hypot(dx,dy)||1,side=color===0?1:-1;
  const wanted={x:Math.max(20,Math.min(arena.width-20,target.position.x+target.velocity.x*.16-dy/len*side*40)),y:Math.max(20,Math.min(arena.height-20,target.position.y+target.velocity.y*.16+dx/len*side*40))};
  const gx=wanted.x-owner.position.x,gy=wanted.y-owner.position.y,l=Math.hypot(gx,gy)||1,clear=clearSpearLength(owner.position,{x:gx/l,y:gy/l},l,12,arena);
  const goal={x:owner.position.x+gx/l*clear,y:owner.position.y+gy/l*clear};
  this.stones.push({id:'go-stone-'+this.next++,ownerId:owner.id,abilityId:d.id,position:{...owner.position},previousPosition:{...owner.position},goal,color,flying:true,spawnedTick:tick,expiresTick:tick+d.effect.lifetimeTicks,definition:d,multiplier});
 }
 private line(id:string,ownerId:string,abilityId:string,a:Vec2,b:Vec2,width:number,starts:number,ends:number,damage:number,cooldown:number,ultimate:boolean,arena:ArenaDefinition){
  const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);
  if(l<20||clearSpearLength(a,{x:dx/l,y:dy/l},l,width/2,arena)<l-.01)return;
  this.lines.push({id,ownerId,abilityId,start:{...a},end:{...b},width,startsTick:starts,endsTick:ends,damage,cooldown,ultimate,ready:new Map(),touching:new Set()});
 }
 private land(tick:number,s:Stone,arena:ArenaDefinition,emit:Emit){
  s.flying=false;s.previousPosition={...s.position};s.expiresTick=tick+(s.definition.effect as Extract<AbilityDefinition['effect'],{kind:'go-stone'}>).lifetimeTicks;
  this.stones=this.stones.filter(o=>o===s||o.ownerId!==s.ownerId||o.flying||o.abilityId!==s.abilityId||o.color!==s.color);
  this.lines=this.lines.filter(l=>l.ownerId!==s.ownerId||l.ultimate);
  const other=this.stones.find(o=>o!==s&&o.ownerId===s.ownerId&&!o.flying&&o.abilityId===s.abilityId&&o.color!==s.color);
  const e=s.definition.effect;if(e.kind!=='go-stone')return;
  if(other)this.line('go-link-'+this.next++,s.ownerId,s.abilityId,s.position,other.position,e.lineWidth,tick+18,Math.min(s.expiresTick,other.expiresTick),e.lineDamage*s.multiplier,e.lineCooldownTicks,false,arena);
  emit({tick,ownerId:s.ownerId,abilityId:s.abilityId,kind:'area',point:{...s.position},reason:'go-land'});
 }
 startBoard(tick:number,owner:BodySnapshot,target:BodySnapshot,d:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(d.effect.kind!=='go-board')return;const e=d.effect,id='go-board-'+this.next++,r=Math.min(e.radius,arena.width/2-18,arena.height/2-18);
  const center={x:Math.max(r+16,Math.min(arena.width-r-16,target.position.x)),y:Math.max(r+16,Math.min(arena.height-r-16,target.position.y))},ends=tick+e.intervalTicks*4+12;
  const points=Array.from({length:6},(_,i)=>({x:center.x+Math.cos(i*Math.PI/3)*r,y:center.y+Math.sin(i*Math.PI/3)*r}));
  for(let i=0;i<6;i++){const p=points[i]!;this.stones.push({id:id+'-'+i,ownerId:owner.id,abilityId:d.id,position:p,previousPosition:p,goal:p,color:i%2 as 0|1,flying:false,spawnedTick:tick,expiresTick:ends,definition:d,multiplier});}
  for(let i=0;i<3;i++)this.line(id+'-line-'+i,owner.id,d.id,points[i]!,points[i+3]!,e.lineWidth,tick+e.intervalTicks*(i+1),tick+e.intervalTicks*(i+2),e.lineDamage*multiplier,999,true,arena);
  this.boards.push({id,ownerId:owner.id,definition:d,center,ends,multiplier});
 }
 step(tick:number,dt:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit){
  const requests:DamageRequest[]=[];
  this.cleanup(new Set(bodies.map(b=>b.id)),false);
  const hit=(ownerId:string,abilityId:string,target:BodySnapshot,amount:number,id:string,kind:'area'|'projectile')=>{
   requests.push({tick,targetId:target.id,amount,source:kind==='area'?{kind,attackerId:ownerId,abilityId,areaId:id}:{kind,attackerId:ownerId,abilityId,projectileId:id}});
   emit({tick,ownerId,abilityId,targetId:target.id,kind:'hit',point:{...target.position},reason:id.startsWith('go-final')?'go-final':kind==='area'?'go-line':'go-stone'});
  };
  for(const s of [...this.stones])if(s.flying&&s.definition.effect.kind==='go-stone'){
   s.previousPosition={...s.position};const dx=s.goal.x-s.position.x,dy=s.goal.y-s.position.y,len=Math.hypot(dx,dy),travel=Math.min(len,s.definition.effect.speed*dt);
   if(len>0)s.position={x:s.position.x+dx/len*travel,y:s.position.y+dy/len*travel};
   const collisions=bodies.filter(b=>b.id!==s.ownerId&&b.ownerId!==s.ownerId).map(b=>({b,t:sweepCircle({x:s.previousPosition.x-b.previousPosition.x,y:s.previousPosition.y-b.previousPosition.y},{x:s.position.x-b.position.x,y:s.position.y-b.position.y},b.radius+12)})).filter(c=>c.t!==null).sort((a,b)=>a.t!-b.t!);
   const first=collisions[0];if(first){s.position={x:s.previousPosition.x+(s.position.x-s.previousPosition.x)*first.t!,y:s.previousPosition.y+(s.position.y-s.previousPosition.y)*first.t!};hit(s.ownerId,s.abilityId,first.b,s.definition.effect.damage*s.multiplier,s.id,'projectile');}
   if(first||travel>=len)this.land(tick,s,arena,emit);
  }
  for(const l of this.lines){if(tick<l.startsTick||tick>=l.endsTick||(l.ultimate&&locked.has(l.ownerId)))continue;
   for(const b of bodies){if(b.id===l.ownerId||b.ownerId===l.ownerId)continue;
    const crosses=goLineTouches(b,l),touches=goLineTouches(b,l,true);
    if(crosses&&!l.touching.has(b.id)&&tick>=(l.ready.get(b.id)??0)){hit(l.ownerId,l.abilityId,b,l.damage,l.id,'area');l.ready.set(b.id,tick+l.cooldown);}
    if(touches)l.touching.add(b.id);else l.touching.delete(b.id);
   }
  }
  for(const b of this.boards)if(tick>=b.ends){const e=b.definition.effect;if(e.kind!=='go-board'||locked.has(b.ownerId))continue;
   for(const target of bodies)if(target.id!==b.ownerId&&target.ownerId!==b.ownerId){const dx=target.position.x-b.center.x,dy=target.position.y-b.center.y,l=Math.hypot(dx,dy);
    if(l<=e.radius+target.radius&&(l<1e-6||clearSpearLength(b.center,{x:dx/l,y:dy/l},l,0,arena)>=l-.01))hit(b.ownerId,b.definition.id,target,e.damage*b.multiplier,'go-final-'+b.id,'area');}
   emit({tick,ownerId:b.ownerId,abilityId:b.definition.id,kind:'detonate',point:b.center,reason:'go-final'});
  }
  this.boards=this.boards.filter(b=>tick<b.ends&&!locked.has(b.ownerId));
  const activeBoardIds=new Set(this.boards.map(b=>b.id));
  this.stones=this.stones.filter(s=>tick<s.expiresTick&&(s.definition.effect.kind!=='go-board'||[...activeBoardIds].some(id=>s.id.startsWith(id+'-'))));
  this.lines=this.lines.filter(l=>tick<l.endsTick&&(!l.ultimate||[...activeBoardIds].some(id=>l.id.startsWith(id+'-'))));
  return requests;
 }
 cleanup(living:ReadonlySet<string>,finished:boolean){this.stones=this.stones.filter(s=>!finished&&living.has(s.ownerId));this.lines=this.lines.filter(s=>!finished&&living.has(s.ownerId));this.boards=this.boards.filter(s=>!finished&&living.has(s.ownerId));}
 snapshot(){return {goStones:this.stones.map(({goal,definition,multiplier,...s})=>structuredClone(s)),goLines:this.lines.map(({damage,cooldown,ready,touching,...l})=>structuredClone(l))};}
}
