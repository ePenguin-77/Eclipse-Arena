import type { AbilityDefinition,AbilityEvent,AutomatonSnapshot,ProjectileSnapshot } from '../contracts/abilities';
import type { ArenaDefinition,BodySnapshot,Vec2 } from '../contracts/types';
import type { CombatantState,DamageRequest } from '../contracts/combat';
import { projectileAim } from './targeting';
import { resolveObstacle } from '../physics/obstacle-solver';
import { clearSpearLength } from './spear-world';
import { sweepTouches } from './sweep-world';
import { retraceTouches } from './retrace-world';
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
type Basic=Extract<AbilityDefinition['effect'],{kind:'automaton-command'}>;
type Ultimate=Extract<AbilityDefinition['effect'],{kind:'automaton-awaken'}>;
type Robot=AutomatonSnapshot & {basic:Basic;multiplier:number;ultimate?:Ultimate;ultimateId?:string;nextAttack:number;entryArmed:boolean;refillReady:number;
 volley?:{left:number;nextTick:number;boosted:boolean};contacts:Map<string,number>;swingHits:Set<string>};
const dist=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.y-b.y);
export function validateAutomaton(d:AbilityDefinition){
 const e=d.effect;if(e.kind!=='automaton-command'&&e.kind!=='automaton-awaken')return;
 const integer=(n:number,a:number,b:number)=>Number.isInteger(n)&&n>=a&&n<=b;
 if(d.range!==5||!Number.isFinite(e.damage)||e.damage<=0||e.damage>40||!Number.isFinite(e.speed)||e.speed<100||e.speed>900)throw Error('Invalid automaton combat');
 if(e.kind==='automaton-command'&&(d.ultimate||!integer(e.maxHP,10,60)||!Number.isFinite(e.refillRadius)||e.refillRadius<65||e.refillRadius>130))throw Error('Invalid automaton turret');
 if(e.kind==='automaton-awaken'&&(!d.ultimate||!integer(e.durationTicks,60,480)||!integer(e.intervalTicks,30,120)||!Number.isFinite(e.radius)||e.radius<65||e.radius>140))throw Error('Invalid automaton warrior');
}
export class AutomatonWorld {
 private robots:Robot[]=[];
 private serial=0;
 hasWarrior(ownerId:string){return this.robots.some(r=>r.ownerId===ownerId&&r.mode==='warrior');}
 remaining(ownerId:string,tick:number){return Math.max(0,...this.robots.filter(r=>r.ownerId===ownerId&&r.mode==='warrior').map(r=>r.warriorUntil-tick));}
 private constrain(r:Robot,arena:ArenaDefinition){
  const b={...this.target(r),targetSpeed:480,minSpeed:1,maxSpeed:480};
  for(const obstacle of arena.obstacles??[])resolveObstacle(b,obstacle,r.previousPosition);
  r.position={x:Math.max(r.radius,Math.min(arena.width-r.radius,b.position.x)),y:Math.max(r.radius,Math.min(arena.height-r.radius,b.position.y))};
 }
 private ensure(tick:number,owner:BodySnapshot,basic:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(basic.effect.kind!=='automaton-command')return;
  let r=this.robots.find(r=>r.ownerId===owner.id);
  if(!r){
   r={id:`automaton-${++this.serial}`,ownerId:owner.id,abilityId:basic.id,position:{...owner.position},previousPosition:{...owner.position},velocity:{x:0,y:0},radius:26,
    hp:basic.effect.maxHP,maxHP:basic.effect.maxHP,mode:'turret',angle:0,spawnedTick:tick,transformedTick:-1000,warriorUntil:0,charged:false,chargeTick:-1000,shotTick:-1000,shotBoosted:false,
    basic:structuredClone(basic.effect),multiplier,nextAttack:tick+18,entryArmed:false,refillReady:tick,contacts:new Map(),swingHits:new Set()};
   this.constrain(r,arena);r.previousPosition={...r.position};this.robots.push(r);
  }
  r.multiplier=multiplier;return r;
 }
 command(tick:number,owner:BodySnapshot,basic:AbilityDefinition,multiplier:number,arena:ArenaDefinition,emit:Emit){
  const existed=this.robots.some(r=>r.ownerId===owner.id),r=this.ensure(tick,owner,basic,multiplier,arena);if(!r||r.mode==='warrior')return;
  r.volley={left:3,nextTick:tick+(existed?4:18),boosted:r.charged};r.charged=false;
  if(!existed)emit({tick,ownerId:owner.id,abilityId:basic.id,kind:'summon',point:{...r.position},reason:'automaton-deploy'});
 }
 awaken(tick:number,owner:BodySnapshot,ultimate:AbilityDefinition,basic:AbilityDefinition,multiplier:number,arena:ArenaDefinition){
  if(ultimate.effect.kind!=='automaton-awaken'||this.hasWarrior(owner.id))return false;
  const r=this.ensure(tick,owner,basic,multiplier,arena);if(!r)return false;
  r.mode='warrior';r.radius=32;this.constrain(r,arena);r.transformedTick=tick;r.warriorUntil=tick+ultimate.effect.durationTicks;r.ultimate=structuredClone(ultimate.effect);r.ultimateId=ultimate.id;
  r.volley=undefined;r.charged=false;r.swing=undefined;r.nextAttack=tick+18;r.entryArmed=false;return true;
 }
 private target(r:Robot):BodySnapshot{return {id:r.id,ownerId:r.ownerId,position:{...r.position},previousPosition:{...r.previousPosition},velocity:{...r.velocity},radius:r.radius,mass:1,targetSpeed:480,minSpeed:1,maxSpeed:480,restitution:1,speed:Math.hypot(r.velocity.x,r.velocity.y)};}
 targets(){return this.robots.map(r=>this.target(r));}
 combatants(){return this.robots.map(r=>({id:r.id,maxHP:r.maxHP,damageMultiplier:1}));}
 private turret(r:Robot){r.mode='turret';r.radius=26;r.velocity={x:0,y:0};r.swing=undefined;r.volley=undefined;r.warriorUntil=0;r.entryArmed=false;}
 step(tick:number,dt:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit,shoot:(p:Omit<ProjectileSnapshot,'id'>)=>boolean):DamageRequest[]{
  const requests:DamageRequest[]=[];
  this.robots=this.robots.filter(r=>r.hp>0&&bodies.some(b=>b.id===r.ownerId));
  for(const r of this.robots){
   const owner=bodies.find(b=>b.id===r.ownerId)!;r.previousPosition={...r.position};r.velocity={x:0,y:0};
   if(r.mode==='warrior'&&(tick>=r.warriorUntil||locked.has(r.ownerId)))this.turret(r);
   const enemies=bodies.filter(b=>b.id!==r.ownerId&&b.ownerId!==r.ownerId&&b.id!==r.id);
   const target=[...enemies].sort((a,b)=>Number(!!a.ownerId)-Number(!!b.ownerId)||dist(r.position,a.position)-dist(r.position,b.position)||a.id.localeCompare(b.id))[0];
   if(!locked.has(r.ownerId)){
    if(r.mode==='turret'){
     const wasArmed=r.entryArmed;
     if(dist(owner.position,r.position)>r.basic.refillRadius+36)r.entryArmed=true;
     if(wasArmed&&tick>=r.refillReady&&!r.charged&&retraceTouches(owner.previousPosition,owner.position,r.position,r.position,r.basic.refillRadius)){
      r.charged=true;r.chargeTick=tick;r.refillReady=tick+180;r.entryArmed=false;
     }
     if(target){const aim=projectileAim({...this.target(r),id:r.ownerId},target,arena,r.basic.speed,9,2,.3);r.angle=Math.atan2(aim.y,aim.x);
      if(r.volley&&tick>=r.volley.nextTick){
       const boosted=r.volley.boosted,position={...r.position};
       if(shoot({ownerId:r.ownerId,abilityId:r.abilityId,position,previousPosition:{...position},velocity:{x:aim.x*r.basic.speed,y:aim.y*r.basic.speed},radius:9,
        damage:r.basic.damage*r.multiplier*(boosted?1.3:1),spawnedTick:tick,expiresTick:tick+120,...(boosted?{pierce:2,visualScale:1.25}:{})})){
        r.shotTick=tick;r.shotBoosted=boosted;emit({tick,ownerId:r.ownerId,abilityId:r.abilityId,kind:'projectile',point:position,reason:boosted?'automaton-pierce':'automaton-dart'});
       }
       r.volley.left--;r.volley.nextTick=tick+8;if(!r.volley.left)r.volley=undefined;
      }
     }
    }else if(target&&r.ultimate){
     const e=r.ultimate;
     if(r.swing&&tick>=r.swing.endsTick)r.swing=undefined;
     if(!r.swing&&tick>=r.transformedTick+18){
      let dx=target.position.x+target.velocity.x*.12-r.position.x,dy=target.position.y+target.velocity.y*.12-r.position.y,len=Math.hypot(dx,dy);
      if(len>1){
       let aim={x:dx/len,y:dy/len};
       // Walk around pillars while preserving swept collision against their solid boundary.
       for(const o of arena.obstacles??[]){const od=dist(r.position,o.center),reach=clearSpearLength(r.position,aim,len,r.radius,arena);
        if(reach<len&&od<o.radius+r.radius+95){const nx=(r.position.x-o.center.x)/(od||1),ny=(r.position.y-o.center.y)/(od||1),side=Math.sign(nx*dy-ny*dx)||1;aim={x:-ny*side+nx*.3,y:nx*side+ny*.3};const l=Math.hypot(aim.x,aim.y)||1;aim={x:aim.x/l,y:aim.y/l};break;}}
       const travel=Math.min(e.speed*dt,Math.max(0,len-48));r.velocity={x:aim.x*e.speed,y:aim.y*e.speed};r.position={x:r.position.x+aim.x*travel,y:r.position.y+aim.y*travel};this.constrain(r,arena);
      }
      dx=target.position.x-r.position.x;dy=target.position.y-r.position.y;len=Math.hypot(dx,dy);r.angle=Math.atan2(dy,dx);
      if(tick>=r.nextAttack&&len<=e.radius+target.radius&&clearSpearLength(r.position,{x:dx/(len||1),y:dy/(len||1)},len,0,arena)>=len-target.radius){
       r.swing={origin:{...r.position},angle:r.angle,startedTick:tick,hitTick:tick+10,endsTick:tick+20};r.swingHits.clear();r.nextAttack=tick+e.intervalTicks;
      }
     }
     if(r.swing&&tick>=r.swing.hitTick){
      for(const victim of enemies){
       if(r.swingHits.has(victim.id)||!sweepTouches(r.swing.origin,r.swing.angle,e.radius,130,victim))continue;
       const dx=victim.position.x-r.swing.origin.x,dy=victim.position.y-r.swing.origin.y,len=Math.hypot(dx,dy);
       if(clearSpearLength(r.swing.origin,{x:dx/(len||1),y:dy/(len||1)},len,0,arena)<len-victim.radius)continue;
       r.swingHits.add(victim.id);requests.push({tick,targetId:victim.id,amount:e.damage*r.multiplier,source:{kind:'summon',attackerId:r.ownerId,abilityId:r.ultimateId!,summonId:r.id}});
       emit({tick,ownerId:r.ownerId,abilityId:r.ultimateId!,targetId:victim.id,kind:'hit',point:{...victim.position},end:{...r.swing.origin},reason:'automaton-sweep'});
      }
     }
    }
   }else r.volley=undefined;
   // Hitting the robot damages its own HP, never the summoner's HP.
   for(const b of enemies){if(tick<(r.contacts.get(b.id)??0)||!retraceTouches(r.previousPosition,r.position,b.previousPosition,b.position,r.radius+b.radius))continue;
    requests.push({tick,targetId:r.id,amount:8,source:{kind:'collision',attackerId:b.ownerId??b.id}});r.contacts.set(b.id,tick+36);}
  }
  return requests;
 }
 afterCombat(states:readonly CombatantState[],living:ReadonlySet<string>,finished:boolean){
  for(const r of this.robots)r.hp=states.find(s=>s.id===r.id)?.hp??r.hp;
  this.robots=this.robots.filter(r=>!finished&&living.has(r.ownerId)&&r.hp>0);
 }
 snapshot():AutomatonSnapshot[]{return this.robots.map(({basic,multiplier,ultimate,ultimateId,nextAttack,entryArmed,refillReady,volley,contacts,swingHits,...r})=>structuredClone(r));}
}
