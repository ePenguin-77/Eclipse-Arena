import type { AbilityContact, AbilityEffect, AbilityEvent } from '../contracts/abilities';
import type { DamageRequest } from '../contracts/combat';
import type { BodySnapshot } from '../contracts/types';
import type { ArenaObstacle } from '../contracts/arenas';
import { validateContactDefense } from './contact-defense';
import { inAbilityRange, surfaceGap } from './targeting';
import { sweepCircle } from '../math/sweep-circle';
import type { KnockbackRequest } from '../contracts/forces';

type FormEffect = Extract<AbilityEffect, { kind: 'impact-form' }>;
interface Form { ownerId: string; abilityId: string; effect: FormEffect; damage: number; startedTick: number; expiresTick: number; remaining: number; lastStrikeTick: number; last: Map<string, number>; counts: Map<string,number> }
const hasPower = (f: Form) => f.effect.endCondition === 'duration' || f.remaining > 0;
export function validateImpactForm(e: FormEffect) {
  if(e.rebound && (!Number.isFinite(e.rebound.strength)||e.rebound.strength<=0||e.rebound.strength>600||!Number.isInteger(e.rebound.delayTicks)||e.rebound.delayTicks<1||e.rebound.delayTicks>30||!Number.isFinite(e.rebound.radius)||e.rebound.radius<20||e.rebound.radius>120||!Number.isInteger(e.rebound.maxHitsPerTarget)||e.rebound.maxHitsPerTarget<1||e.rebound.maxHitsPerTarget>4))throw new Error('Invalid rebound strike');
  if (e.lifestealBonus !== undefined && (!Number.isFinite(e.lifestealBonus) || e.lifestealBonus < 0 || e.lifestealBonus > 1)) throw new Error('Invalid form lifesteal');
  if (e.endCondition !== undefined && e.endCondition !== 'duration') throw new Error('Invalid form end condition');
  if (e.strikeCooldownTicks !== undefined && (!Number.isInteger(e.strikeCooldownTicks) || e.strikeCooldownTicks < 1)) throw new Error('Invalid form strike cooldown');
  if (e.defense) validateContactDefense(e.defense);
  if (e.strikeRange !== undefined && ![0,1,2].includes(e.strikeRange)) throw new Error('Invalid form strike range');
  if (!Number.isFinite(e.speedMultiplier) || e.speedMultiplier <= 1 || e.speedMultiplier > 2 ||
    !Number.isInteger(e.durationTicks) || e.durationTicks < 1 || e.durationTicks > 600 ||
    !Number.isInteger(e.hits) || e.hits < 1 || e.hits > 8 || !Number.isInteger(e.pairCooldownTicks) || e.pairCooldownTicks < 1) throw new Error('Invalid impact form');
}
/** Contact or short-range discharge; optional rebound changes velocity without teleporting. */
export class ImpactFormWorld {
  private forms = new Map<string, Form>();
  private rebounds: KnockbackRequest[]=[];
  private pending: {due:number;ownerId:string;targetId:string;abilityId:string;point:BodySnapshot['position'];radius:number;damage:number}[]=[];
  takeRebounds(){const result=this.rebounds;this.rebounds=[];return result;}
  dodgeCounter(tick:number,ownerId:string,targetId:string,bodies:readonly BodySnapshot[],obstacles:readonly ArenaObstacle[]=[]){
    const f=this.forms.get(ownerId),owner=bodies.find(b=>b.id===ownerId),target=bodies.find(b=>b.id===targetId);
    if(!f||!owner||!target||f.effect.endCondition==='duration'||!hasPower(f)||tick>=f.expiresTick||!f.effect.rebound)return;
    const dx=target.position.x-owner.position.x,dy=target.position.y-owner.position.y,len=Math.hypot(dx,dy);
    if(len>240||obstacles.some(o=>sweepCircle({x:owner.position.x-o.center.x,y:owner.position.y-o.center.y},{x:target.position.x-o.center.x,y:target.position.y-o.center.y},o.radius)!==null))return;
    f.remaining=0;
    this.rebounds.push({ownerId,targetId:ownerId,direction:{x:-dy/(len||1),y:dx/(len||1)},strength:f.effect.rebound.strength,selfRebound:true});
    this.pending.push({due:tick+f.effect.rebound.delayTicks,ownerId,targetId,abilityId:f.abilityId,point:{...target.position},radius:f.effect.rebound.radius,damage:f.damage});
  }
  start(tick: number, ownerId: string, abilityId: string, effect: FormEffect, multiplier: number) {
    validateImpactForm(effect);
    this.forms.set(ownerId, { ownerId, abilityId, effect: structuredClone(effect), damage: effect.damage * multiplier,
      startedTick: tick, expiresTick: tick + effect.durationTicks, remaining: effect.hits, lastStrikeTick: -Infinity, last: new Map(),counts:new Map() });
  }
  hasOwner(id: string) { return this.forms.has(id); }
  lifestealBonus(id: string, tick: number) { const f = this.forms.get(id); return f && tick < f.expiresTick && hasPower(f) ? f.effect.lifestealBonus ?? 0 : 0; }
  defense(id: string, tick: number) { const f = this.forms.get(id); return f && tick < f.expiresTick && hasPower(f) ? f.effect.defense : undefined; }
  speed(id: string, tick: number) { const f = this.forms.get(id); return f && tick < f.expiresTick && hasPower(f) ? f.effect.speedMultiplier : 1; }
  snapshot(tick: number) { return [...this.forms.values()].map(f => ({ ownerId:f.ownerId, abilityId:f.abilityId, startedTick:f.startedTick,
    remaining:f.remaining, expiresTick:f.expiresTick, activeTicksRemaining:Math.max(0,f.expiresTick-tick) })); }
  step(tick: number, contacts: readonly AbilityContact[], bodies: readonly BodySnapshot[], emit: (e: Omit<AbilityEvent,'id'>)=>void, locked: ReadonlySet<string> = new Set(), obstacles: readonly ArenaObstacle[] = []) {
    const requests: DamageRequest[] = [], living = new Set(bodies.map(b=>b.id));
    this.cleanup(tick,living,false);
    for (const id of locked) this.forms.delete(id);
    this.pending=this.pending.filter(p=>{
      if(locked.has(p.ownerId)||!living.has(p.ownerId)||!living.has(p.targetId))return false;
      if(tick<p.due)return true;
      const target=bodies.find(b=>b.id===p.targetId)!;
      const hit=Math.hypot(target.position.x-p.point.x,target.position.y-p.point.y)<=p.radius+target.radius;
      emit({tick,ownerId:p.ownerId,abilityId:p.abilityId,targetId:p.targetId,kind:hit?'melee':'miss',point:p.point,end:p.point});
      if(hit)requests.push({tick,targetId:p.targetId,source:{kind:'melee',attackerId:p.ownerId,abilityId:p.abilityId},amount:p.damage});
      return false;
    });
    for (const f of this.forms.values()) {
      const owner = bodies.find(b => b.id === f.ownerId)!;
      const strike = (targetId: string, point: BodySnapshot['position'], end = point) => {
        if(f.effect.rebound && (f.counts.get(targetId)??0)>=f.effect.rebound.maxHitsPerTarget)return;
        if (tick <= f.startedTick || !hasPower(f) || tick-f.lastStrikeTick<(f.effect.strikeCooldownTicks??0) || tick-(f.last.get(targetId)??-Infinity)<f.effect.pairCooldownTicks) return;
        f.last.set(targetId,tick); f.lastStrikeTick=tick;
        if (f.effect.endCondition !== 'duration') f.remaining--;
        f.counts.set(targetId,(f.counts.get(targetId)??0)+1);
        if(f.effect.rebound){
          const target=bodies.find(b=>b.id===targetId)!;
          const dx=target.position.x-owner.position.x,dy=target.position.y-owner.position.y,len=Math.hypot(dx,dy)||1;
          const side=((f.counts.get(targetId)??1)%2)?1:-1;
          this.rebounds.push({ownerId:f.ownerId,targetId:f.ownerId,direction:{x:-dy/len*side,y:dx/len*side},strength:f.effect.rebound.strength,selfRebound:true});
          this.pending.push({due:tick+f.effect.rebound.delayTicks,ownerId:f.ownerId,targetId,abilityId:f.abilityId,point:{...target.position},radius:f.effect.rebound.radius,damage:f.damage});
          return;
        }
        requests.push({tick,targetId,source:{kind:'melee',attackerId:f.ownerId,abilityId:f.abilityId},amount:f.damage});
        emit({tick,ownerId:f.ownerId,abilityId:f.abilityId,targetId,kind:'melee',point:{...point},end:{...end}});
      };
      for (const c of contacts) {
      if (tick <= f.startedTick || !hasPower(f) || !c.impulseApplied || c.impactSpeed <= 0 || (c.bodyId !== f.ownerId && c.otherId !== f.ownerId)) continue;
      const targetId = c.bodyId === f.ownerId ? c.otherId : c.bodyId;
      if (targetId === f.ownerId || !living.has(targetId) || tick-(f.last.get(targetId)??-Infinity)<f.effect.pairCooldownTicks) continue;
      if (bodies.find(b=>b.id===targetId)?.ownerId === f.ownerId) continue;
      strike(targetId,c.point);
      }
      if (f.effect.strikeRange) {
        const nearby = bodies.filter(b => inAbilityRange(owner,b,f.effect.strikeRange!))
          .sort((a,b) => surfaceGap(owner,a)-surfaceGap(owner,b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        for (const target of nearby) {
          const blocked = obstacles.some(o => sweepCircle(
            {x:owner.position.x-o.center.x,y:owner.position.y-o.center.y},
            {x:target.position.x-o.center.x,y:target.position.y-o.center.y},o.radius) !== null);
          if (!blocked) strike(target.id,owner.position,target.position);
        }
      }
    }
    return requests;
  }
  cleanup(tick: number, living: ReadonlySet<string>, finished: boolean) {
    this.pending=this.pending.filter(p=>!finished&&living.has(p.ownerId)&&living.has(p.targetId));
    this.rebounds=this.rebounds.filter(p=>!finished&&living.has(p.ownerId));
    for (const [id,f] of this.forms) if (finished || !living.has(id) || tick>=f.expiresTick || !hasPower(f)) this.forms.delete(id);
  }
}
