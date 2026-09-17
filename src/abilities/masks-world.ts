import {MASKS_BALANCE as M} from '../config/masks';
import type {AbilityDefinition,AbilityEvent,MaskFace,MasksSnapshot,ProjectileSnapshot} from '../contracts/abilities';
import type {ArenaDefinition,BodySnapshot,PhysicsEvent,Vec2} from '../contracts/types';
import type {DamageRequest,DamageResult} from '../contracts/combat';
import type {DashRequest} from '../contracts/motion';
import type {KnockbackRequest} from '../contracts/forces';
import type {StatusDefinition} from '../contracts/status';
import {clearSpearLength} from './spear-world';
import {retraceTouches} from './retrace-world';
import {projectileAim} from './targeting';

const FACES:MaskFace[]=['wrath','sorrow','smile'];
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
type Shot=Omit<ProjectileSnapshot,'id'>;
type Action={face:MaskFace;empowered:boolean;phase:'windup'|'dash'|'guard';targetId:string;endsTick:number;multiplier:number;remaining:number;released:boolean};
type State={face:MaskFace;charge:number;remaining:MaskFace[];braceUntil?:number;action?:Action};
const aim=(a:Vec2,b:Vec2)=>{const x=b.x-a.x,y=b.y-a.y,n=Math.hypot(x,y)||1;return{x:x/n,y:y/n};};
const distance=(a:BodySnapshot,b:BodySnapshot)=>Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y);
export function validateMasks(d:AbilityDefinition){if(d.effect.kind!=='masks-shift'&&d.effect.kind!=='masks-awaken')return;if(d.range!==5||!Number.isFinite(d.effect.damage)||d.effect.damage<0||Boolean(d.ultimate)!==(d.effect.kind==='masks-awaken'))throw Error('Invalid masks ability');}

/** One deterministic face cycle; awakening stores unused faces, never a timer. */
export class MasksWorld {
 private states=new Map<string,State>();
 private motions:DashRequest[]=[];
 private pulses:{ownerId:string;empowered:boolean;multiplier:number}[]=[];
 private marks=new Map<string,{ownerId:string;targetId:string;expiresTick:number;multiplier:number}>();
 private serial=0;
 register(id:string){if(!this.states.has(id))this.states.set(id,{face:'wrath',charge:0,remaining:[]});}
 state(id:string){return this.states.get(id);}
 busy(id:string){return !!this.states.get(id)?.action;}
 awakened(id:string){return !!this.states.get(id)?.remaining.length;}
 charge(id:string){return this.states.get(id)?.charge??0;}
 target(owner:BodySnapshot,bodies:readonly BodySnapshot[]){const s=this.states.get(owner.id),face=s?.face??'wrath',empowered=!!s?.remaining.includes(face);const reach=face==='wrath'?(empowered?185:115):face==='sorrow'?430:(empowered?M.smileAwakenedRange:M.smileRange);return bodies.filter(b=>b.id!==owner.id&&!b.ownerId&&distance(owner,b)<=owner.radius+b.radius+reach).sort((a,b)=>distance(owner,a)-distance(owner,b)||a.id.localeCompare(b.id))[0];}
 awaken(tick:number,owner:BodySnapshot,emit:Emit){const s=this.states.get(owner.id);if(!s||s.action||s.remaining.length||s.charge<6)return false;s.charge=0;s.remaining=[...FACES];emit({tick,ownerId:owner.id,abilityId:'masks-awaken',kind:'cast',point:{...owner.position}});return true;}
 start(tick:number,owner:BodySnapshot,target:BodySnapshot,multiplier:number){const s=this.states.get(owner.id);if(!s||s.action)return false;s.action={face:s.face,empowered:s.remaining.includes(s.face),phase:'windup',targetId:target.id,endsTick:tick+8,multiplier,remaining:0,released:false};return true;}
 private complete(id:string,a:Action){const s=this.states.get(id)!;s.face=FACES[(FACES.indexOf(a.face)+1)%3]!;if(a.empowered)s.remaining=s.remaining.filter(f=>f!==a.face);}
 private released(id:string,a:Action){a.released=true;const s=this.states.get(id)!;if(!a.empowered&&!s.remaining.length)s.charge=Math.min(6,s.charge+1);}
 takeMotions(){const r=this.motions;this.motions=[];return r;}
 mitigate(tick:number,r:DamageRequest,locked:ReadonlySet<string>){
  const state=this.states.get(r.targetId);
  if(tick<(state?.braceUntil??0)&&!locked.has(r.targetId)&&!r.dodged&&r.amount>0&&r.source.attackerId!==r.targetId&&(r.source.kind==='melee'||r.source.kind==='collision'))return {...r,amount:r.amount*(1-M.wrathBraceReduction)};
  const a=state?.action;
  if(!a||a.phase!=='guard'||a.remaining<=0||tick>=a.endsTick||locked.has(r.targetId)||r.dodged||r.amount<=0||r.source.kind==='status'||r.source.attackerId===r.targetId)return r;
  a.remaining--;this.pulses.push({ownerId:r.targetId,empowered:a.empowered,multiplier:a.multiplier});
  return {...r,amount:r.amount*(1-(a.empowered?M.smileAwakenedReduction:M.smileReduction))};
 }
 private burst(tick:number,owner:BodySnapshot,arena:ArenaDefinition,bodies:readonly BodySnapshot[],empowered:boolean,multiplier:number,emit:Emit):DamageRequest[]{
  const radius=empowered?150:120;
  emit({tick,ownerId:owner.id,abilityId:'masks-shift',kind:'area',point:{...owner.position},reason:'masks-smile',end:{x:radius,y:0}});
  return bodies.filter(b=>b.id!==owner.id&&b.ownerId!==owner.id&&distance(owner,b)<=radius+b.radius&&clearSpearLength(owner.position,aim(owner.position,b.position),distance(owner,b),0,arena)>=distance(owner,b)-b.radius).map(b=>({tick,targetId:b.id,amount:(empowered?M.smileAwakenedDamage:M.smileDamage)*multiplier,maskStrike:{face:'smile',empowered},source:{kind:'area',attackerId:owner.id,abilityId:'masks-shift',areaId:`mask-pulse-${++this.serial}`}}));
 }
 step(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,impacts:readonly Omit<PhysicsEvent,'id'>[],emit:Emit,spawn:(p:Shot)=>boolean,onRelease:(id:string)=>void):DamageRequest[]{
  const requests:DamageRequest[]=[];
  for(const [key,m] of this.marks){const target=bodies.find(b=>b.id===m.targetId);if(!target||!bodies.some(b=>b.id===m.ownerId)||tick>m.expiresTick){this.marks.delete(key);continue;}if(impacts.some(e=>e.type==='wall'&&e.bodyId===m.targetId&&e.impulseApplied&&e.impactSpeed>0)){requests.push({tick,targetId:m.targetId,amount:12*m.multiplier,source:{kind:'status',attackerId:m.ownerId,abilityId:'masks-shift',statusId:'masks-wrath-mark'}});emit({tick,ownerId:m.ownerId,targetId:m.targetId,abilityId:'masks-shift',kind:'detonate',point:{...target.position},reason:'masks-mark'});this.marks.delete(key);}}
  for(const pulse of this.pulses){const owner=bodies.find(b=>b.id===pulse.ownerId);if(owner&&!locked.has(owner.id))requests.push(...this.burst(tick,owner,arena,bodies,pulse.empowered,pulse.multiplier,emit));}this.pulses=[];
  for(const [id,s] of this.states){const a=s.action;if(!a)continue;const owner=bodies.find(b=>b.id===id);
   if(!owner){s.action=undefined;continue;}
   if(locked.has(id)){if(a.released&&a.phase==='guard')this.complete(id,a);s.action=undefined;continue;}
   if(a.phase==='windup'){
    if(tick<a.endsTick)continue;const target=this.target(owner,bodies);
    if(!target){s.action=undefined;continue;}
    a.targetId=target.id;
    if(a.face==='sorrow'){
     const direction=projectileAim(owner,target,arena,660,13,1.8,.22),heading=Math.atan2(direction.y,direction.x),group=`masks-${id}-${++this.serial}`;
     let sent=0;for(const offset of [-.22,0,.22]){const angle=heading+offset;if(spawn({ownerId:id,abilityId:'masks-shift',visualAbilityId:'masks-sorrow',position:{...owner.position},previousPosition:{...owner.position},velocity:{x:Math.cos(angle)*660,y:Math.sin(angle)*660},radius:13,damage:(a.empowered?M.sorrowAwakenedDamage:M.sorrowDamage)*a.multiplier,spawnedTick:tick,expiresTick:tick+100,pierce:a.empowered?3:0,hitGroup:group,maskStrike:{face:'sorrow',empowered:a.empowered}}))sent++;}
     if(!sent){s.action=undefined;continue;}
     emit({tick,ownerId:id,abilityId:'masks-shift',kind:'projectile',point:{...owner.position},end:{...target.position},reason:'masks-sorrow'});
    }
    this.released(id,a);onRelease(id);emit({tick,ownerId:id,abilityId:'masks-shift',kind:'cast',point:{...owner.position},end:{...target.position},reason:`masks-${a.face}`});
    if(a.face==='wrath'){s.braceUntil=tick+M.wrathBraceTicks;a.phase='dash';a.endsTick=tick+24;this.motions.push({ownerId:id,targetId:target.id,abilityId:'masks-shift',speed:a.empowered?950:780,durationTicks:18,phaseTarget:false,direction:aim(owner.position,target.position)});this.complete(id,a);}
    else if(a.face==='sorrow'){this.complete(id,a);s.action=undefined;}
    else{a.phase='guard';a.endsTick=tick+90;a.remaining=a.empowered?2:1;}
    continue;
   }
   if(a.phase==='guard'){if(a.remaining<=0||tick>=a.endsTick){if(a.empowered&&a.remaining>0)requests.push(...this.burst(tick,owner,arena,bodies,true,a.multiplier,emit));this.complete(id,a);s.action=undefined;}continue;}
   const target=bodies.find(b=>b.id===a.targetId);if(!target||tick>a.endsTick){s.action=undefined;continue;}
   const len=distance(owner,target),dir=aim(owner.position,target.position),reach=owner.radius+target.radius+24;
   const continuous=(b:BodySnapshot)=>Math.hypot(b.position.x-b.previousPosition.x,b.position.y-b.previousPosition.y)<50;
   const near=len<=reach||(continuous(owner)&&continuous(target)&&retraceTouches(owner.previousPosition,owner.position,target.previousPosition,target.position,reach));
   if(near&&clearSpearLength(owner.position,dir,len,0,arena)>=len-target.radius){requests.push({tick,targetId:target.id,amount:(a.empowered?M.wrathAwakenedDamage:M.wrathDamage)*a.multiplier,maskStrike:{face:'wrath',empowered:a.empowered},source:{kind:'melee',attackerId:id,abilityId:'masks-shift'}});emit({tick,ownerId:id,targetId:target.id,abilityId:'masks-shift',kind:'slash',point:{...owner.position},end:{...target.position},reason:'masks-wrath'});s.action=undefined;}
  }
  return requests;
 }
 confirm(tick:number,results:readonly DamageResult[],living:ReadonlySet<string>,bodies:readonly BodySnapshot[]):KnockbackRequest[]{const pushes:KnockbackRequest[]=[];for(const r of results){const m=r.request.maskStrike,s=r.request.source;if(!m||m.face!=='wrath'||r.appliedDamage<=0||!living.has(s.attackerId)||!living.has(r.request.targetId))continue;const owner=bodies.find(b=>b.id===s.attackerId),target=bodies.find(b=>b.id===r.request.targetId);if(!owner||!target)continue;pushes.push({ownerId:owner.id,targetId:target.id,direction:aim(owner.position,target.position),strength:m.empowered?900:620});if(m.empowered)this.marks.set(`${owner.id}:${target.id}`,{ownerId:owner.id,targetId:target.id,expiresTick:tick+180,multiplier:r.request.amount/M.wrathAwakenedDamage});}return pushes;}
 statuses(results:readonly DamageResult[],living:ReadonlySet<string>){return results.flatMap(r=>{const m=r.request.maskStrike,s=r.request.source;if(!m||m.face!=='sorrow'||r.appliedDamage<=0||!living.has(s.attackerId)||!living.has(r.request.targetId))return[];const definitions:StatusDefinition[]=[{id:'masks-sorrow',name:'โศก',durationTicks:m.empowered?180:120,stacking:'refresh',effect:{kind:'speed-modifier',reductionPerStack:m.empowered?.25:.15,group:'masks-sorrow'}}];if(m.empowered)definitions.push({id:'masks-grief',name:'ทุกข์ทับถม',durationTicks:180,stacking:'refresh',effect:{kind:'damage-modifier',outgoing:.8,incoming:1}});return definitions.map(definition=>({sourceId:s.attackerId,targetId:r.request.targetId,abilityId:'masks-shift',definition}));});}
 cleanup(living:ReadonlySet<string>,finished:boolean){for(const id of this.states.keys())if(finished||!living.has(id))this.states.delete(id);for(const[k,m]of this.marks)if(finished||!living.has(m.ownerId)||!living.has(m.targetId))this.marks.delete(k);this.motions=this.motions.filter(m=>!finished&&living.has(m.ownerId));this.pulses=this.pulses.filter(p=>!finished&&living.has(p.ownerId));}
 snapshot():{masks:MasksSnapshot[];maskMarks:{ownerId:string;targetId:string;expiresTick:number}[]}{return{masks:[...this.states].map(([ownerId,s])=>({ownerId,face:s.face,charge:s.charge,remaining:[...s.remaining],phase:s.action?.phase??'idle',guardHits:s.action?.phase==='guard'?s.action.remaining:0})),maskMarks:[...this.marks.values()].map(({multiplier,...m})=>({...m}))};}
}
