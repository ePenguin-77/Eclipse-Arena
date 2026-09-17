import type { AbilityDefinition, AbilityContact, AbilityEvent, ChainSnapshot } from '../contracts/abilities';
import type { ArenaDefinition, BodySnapshot } from '../contracts/types';
import type { DamageRequest, DamageResult } from '../contracts/combat';
import type { RadialForce } from '../contracts/forces';
import { clearSpearLength } from './spear-world';

interface Tether extends ChainSnapshot { damage: number; acceleration: number; constriction?: {intervalTicks:number;pulseDamage:number;finisherDamage:number}; nextPulse?:number; multiplier:number }
type Emit=(e:Omit<AbilityEvent,'id'>)=>void;
/** Confirmed grapples apply ordinary physics forces; they never teleport or silence a target. */
export class ChainWorld {
  private tethers:Tether[]=[];
  private nextId=1;
  releaseOwner(ownerId:string){this.tethers=this.tethers.filter(t=>t.ownerId!==ownerId);}
  private locked:ReadonlySet<string>=new Set();
  private arena?:ArenaDefinition;
  prepare(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>) {
    this.locked=locked;this.arena=arena;
    this.tethers=this.tethers.filter(t=>{
      const a=bodies.find(b=>b.id===t.ownerId),b=bodies.find(b=>b.id===t.targetId);
      if(!a||!b||tick>t.expiresTick||locked.has(a.id))return false;
      const dx=b.position.x-a.position.x,dy=b.position.y-a.position.y,d=Math.hypot(dx,dy);
      return d<=520&&(d<1e-6||clearSpearLength(a.position,{x:dx/d,y:dy/d},d,2,arena)>=d-.01);
    });
  }
  forces(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>):RadialForce[] {
    this.prepare(tick,arena,bodies,locked);
    return this.tethers.map(t=>({ownerId:t.ownerId,targetId:t.targetId,position:{...bodies.find(b=>b.id===t.ownerId)!.position},radius:520,acceleration:t.acceleration}));
  }
  confirm(tick:number,r:DamageResult,d:AbilityDefinition,bodies:readonly BodySnapshot[],multiplier:number):boolean {
    const s=r.request.source,e=d.effect;
    if(e.kind!=='hook'||s.kind!=='projectile'||r.appliedDamage<=0||r.outcome!=='applied'||this.locked.has(s.attackerId))return false;
    const a=bodies.find(b=>b.id===s.attackerId),b=bodies.find(b=>b.id===r.request.targetId);
    if(!a||!b||a.id===b.id||b.ownerId===a.id)return false;
    const distance=Math.hypot(b.position.x-a.position.x,b.position.y-a.position.y);
    // One tether per owner-target pair; subsequent hooks replace the previous pull.
    this.tethers=this.tethers.filter(t=>t.ownerId!==a.id||t.targetId!==b.id);
    this.tethers.push({id:`chain-${this.nextId++}`,ownerId:a.id,targetId:b.id,abilityId:d.id,spawnedTick:tick,expiresTick:tick+e.pullTicks,
      damage:(e.contactDamage+e.distanceBonus*Math.min(1,Math.max(0,distance-a.radius-b.radius)/320))*multiplier,acceleration:e.acceleration,
      constriction:e.constriction,nextPulse:e.constriction?tick+e.constriction.intervalTicks:undefined,multiplier});
    return true;
  }
  step(tick:number,bodies:readonly BodySnapshot[],contacts:readonly AbilityContact[],emit:Emit):DamageRequest[] {
    const requests:DamageRequest[]=[];
    if(this.arena)this.prepare(tick,this.arena,bodies,this.locked);
    this.tethers=this.tethers.filter(t=>{
      if(t.constriction){
        if(tick<(t.nextPulse??Infinity))return true;
        const b=bodies.find(b=>b.id===t.targetId);if(!b)return false;
        const finish=tick>=t.expiresTick;
        requests.push({tick,targetId:t.targetId,source:{kind:'melee',attackerId:t.ownerId,abilityId:t.abilityId},amount:(finish?t.constriction.finisherDamage:t.constriction.pulseDamage)*t.multiplier});
        emit({tick,ownerId:t.ownerId,targetId:t.targetId,abilityId:t.abilityId,kind:'hit',point:{...b.position},reason:finish?'chain-crush':'chain-squeeze'});
        t.nextPulse=tick+t.constriction.intervalTicks;
        return !finish;
      }
      // An actual new collision is required, not mere proximity or pre-latch contact.
      const contact=tick>t.spawnedTick&&contacts.some(c=>c.impulseApplied&&c.impactSpeed>0&&
        ((c.bodyId===t.ownerId&&c.otherId===t.targetId)||(c.otherId===t.ownerId&&c.bodyId===t.targetId)));
      if(!contact)return true;
      const b=bodies.find(b=>b.id===t.targetId)!;
      requests.push({tick,targetId:t.targetId,source:{kind:'melee',attackerId:t.ownerId,abilityId:t.abilityId},amount:t.damage});
      emit({tick,ownerId:t.ownerId,targetId:t.targetId,abilityId:t.abilityId,kind:'hit',point:{...b.position},reason:'chain-contact'});
      return false;
    });
    return requests;
  }
  snapshot():ChainSnapshot[]{return this.tethers.map(({damage:_,acceleration:__,constriction:___,nextPulse:____,multiplier:_____,...s})=>({...s}));}
  cleanup(living:ReadonlySet<string>,finished:boolean){this.tethers=this.tethers.filter(t=>!finished&&living.has(t.ownerId)&&living.has(t.targetId));}
}
