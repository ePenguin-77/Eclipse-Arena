import type { AbilityDefinition, AbilityEvent, TimeMarkSnapshot, TimeRewindSnapshot, TimeEchoSnapshot } from '../contracts/abilities';
import type { DamageRequest, DamageResult, CombatantState } from '../contracts/combat';
import type { ArenaDefinition, BodySnapshot, Vec2 } from '../contracts/types';
import { clearOfArena } from '../arenas/arena-registry';
import { clearSpearLength } from './spear-world';

type Emit = (event:Omit<AbilityEvent,'id'>)=>void;
type Mark = TimeMarkSnapshot & { ratio:number; cap:number };
type Rewind = TimeRewindSnapshot & { startHP:number; damage:number; radius:number; healRatio:number; healCap:number };
const distance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.y-b.y);

export function validateTime(d:AbilityDefinition) {
  if(d.effect.kind==='time-rewind') {
    const e=d.effect;
    if(!d.ultimate || !Number.isInteger(e.durationTicks) || e.durationTicks<60 || e.durationTicks>300 ||
      !Number.isFinite(e.radius) || e.radius<=0 || e.radius>250 || !Number.isFinite(e.healRatio) || e.healRatio<0 || e.healRatio>.6 ||
      !Number.isFinite(e.healCap) || e.healCap<0 || e.healCap>20) throw Error('Invalid time rewind');
  }
  if(d.effect.kind==='projectile' && d.effect.timeMark) {
    const e=d.effect.timeMark;
    if(!Number.isInteger(e.durationTicks) || e.durationTicks<30 || e.durationTicks>240 || !Number.isFinite(e.ratio) || e.ratio<=0 || e.ratio>.5 ||
      !Number.isFinite(e.cap) || e.cap<=0 || e.cap>12) throw Error('Invalid time mark');
  }
}

/** Stores applied HP damage, never requested damage, and never replays another echo. */
export class TimeWorld {
  private marks:Mark[]=[];
  private rewinds:Rewind[]=[];
  private echoes:TimeEchoSnapshot[]=[];
  private pending:DamageRequest[]=[];
  private health=new Map<string,number>();
  private damageScale=1;
  hasOwner(id:string) { return this.rewinds.some(r=>r.ownerId===id); }
  remaining(id:string,tick:number) { return Math.max(0,...this.rewinds.filter(r=>r.ownerId===id).map(r=>r.endsTick-tick)); }

  prepare(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],health:readonly CombatantState[],damageScale:number,locked:ReadonlySet<string>,
    teleport:(id:string,point:Vec2)=>boolean,heal:(id:string,amount:number,ceiling:number)=>number,emit:Emit) {
    this.health=new Map(health.filter(h=>h.alive).map(h=>[h.id,h.hp]));
    this.damageScale=damageScale;
    this.echoes=this.echoes.filter(e=>tick<e.endsTick);
    const keep:Rewind[]=[];
    for(const r of this.rewinds) {
      const owner=bodies.find(b=>b.id===r.ownerId);
      if(!owner || !this.health.has(owner.id) || locked.has(owner.id)) continue;
      if(tick<r.endsTick) {
        if((tick-r.startedTick)%5===0) r.path.push({...owner.position});
        keep.push(r);continue;
      }
      // Return near the anchor if another fighter occupies it; never overlap a wall/pillar.
      const candidates=[r.anchor];
      for(const radius of [owner.radius*2+8,owner.radius*4+16]) for(let i=0;i<8;i++)
        candidates.push({x:r.anchor.x+Math.cos(i*Math.PI/4)*radius,y:r.anchor.y+Math.sin(i*Math.PI/4)*radius});
      let point={...owner.position};
      for(const p of candidates) if(clearOfArena(arena,p,owner.radius) && bodies.every(b=>b.id===owner.id || distance(p,b.position)>owner.radius+b.radius+3) && teleport(owner.id,p)) {point={...p};break;}
      const amount=Math.min(r.healCap,r.receivedDamage*r.healRatio,Math.max(0,r.startHP-(this.health.get(owner.id)??r.startHP)));
      heal(owner.id,amount,r.startHP);
      this.echoes.push({ownerId:owner.id,abilityId:r.abilityId,point,path:[...r.path,{...owner.position}],startedTick:tick,endsTick:tick+36,radius:r.radius});
      emit({tick,ownerId:owner.id,abilityId:r.abilityId,kind:'area',point,reason:'time-return'});
      for(const target of bodies) {
        const length=distance(point,target.position);
        if(target.id===owner.id || target.ownerId===owner.id || length>r.radius+target.radius) continue;
        const direction=length>0?{x:(target.position.x-point.x)/length,y:(target.position.y-point.y)/length}:{x:1,y:0};
        if(clearSpearLength(point,direction,length,0,arena)<length-.01) continue;
        this.pending.push({tick,targetId:target.id,amount:r.damage,source:{kind:'area',attackerId:owner.id,abilityId:r.abilityId,areaId:`rewind-${tick}-${owner.id}`}});
        emit({tick,ownerId:owner.id,abilityId:r.abilityId,kind:'hit',targetId:target.id,point:{...target.position}});
      }
    }
    this.rewinds=keep;
  }

  start(tick:number,owner:BodySnapshot,d:AbilityDefinition,multiplier:number) {
    if(d.effect.kind!=='time-rewind' || this.hasOwner(owner.id)) return false;
    const startHP=this.health.get(owner.id);if(startHP===undefined)return false;
    const e=d.effect;
    this.rewinds.push({ownerId:owner.id,abilityId:d.id,anchor:{...owner.position},startedTick:tick,endsTick:tick+e.durationTicks,
      receivedDamage:0,path:[{...owner.position}],startHP,damage:e.damage*multiplier,radius:e.radius,healRatio:e.healRatio,healCap:e.healCap});
    return true;
  }

  record(tick:number,results:readonly DamageResult[],living:ReadonlySet<string>) {
    for(const hit of results) {
      if(hit.appliedDamage<=0 || hit.outcome!=='applied' || hit.request.source.attackerId===hit.request.targetId) continue;
      for(const r of this.rewinds) if(r.ownerId===hit.request.targetId && living.has(r.ownerId)) r.receivedDamage+=hit.appliedDamage;
      if(hit.request.source.kind==='status' && hit.request.source.statusId==='time-echo') continue;
      for(const mark of this.marks) if(tick<mark.endsTick && mark.targetId===hit.request.targetId)
        mark.storedDamage=Math.min(mark.cap/mark.ratio,mark.storedDamage+hit.appliedDamage);
    }
  }

  confirm(tick:number,hit:DamageResult,d:AbilityDefinition,living:ReadonlySet<string>) {
    if(d.effect.kind!=='projectile' || !d.effect.timeMark || hit.request.source.kind!=='projectile' || hit.appliedDamage<=0 ||
      !living.has(hit.request.targetId) || !living.has(hit.request.source.attackerId)) return;
    const ownerId=hit.request.source.attackerId,targetId=hit.request.targetId;
    if(this.marks.some(m=>m.ownerId===ownerId&&m.targetId===targetId)) return;
    this.marks.push({ownerId,targetId,abilityId:d.id,startedTick:tick,endsTick:tick+d.effect.timeMark.durationTicks,storedDamage:0,
      ratio:d.effect.timeMark.ratio,cap:d.effect.timeMark.cap});
  }

  step(tick:number,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,emit:Emit) {
    const keep:Mark[]=[];
    for(const m of this.marks) {
      const target=bodies.find(b=>b.id===m.targetId);
      if(!target || !bodies.some(b=>b.id===m.ownerId) || locked.has(m.ownerId))continue;
      if(tick<m.endsTick){keep.push(m);continue;}
      const amount=Math.min(m.cap,m.storedDamage*m.ratio);
      if(amount>0) this.pending.push({tick,targetId:m.targetId,amount:amount/this.damageScale,
        source:{kind:'status',attackerId:m.ownerId,abilityId:m.abilityId,statusId:'time-echo'}});
      emit({tick,ownerId:m.ownerId,abilityId:m.abilityId,kind:'detonate',point:{...target.position},reason:'time-mark'});
    }
    this.marks=keep;
    const pending=this.pending;this.pending=[];return pending;
  }
  cleanup(living:ReadonlySet<string>,finished:boolean) {
    this.marks=this.marks.filter(m=>!finished&&living.has(m.ownerId)&&living.has(m.targetId));
    this.rewinds=this.rewinds.filter(r=>!finished&&living.has(r.ownerId));
    if(finished){this.echoes=[];this.pending=[];}
  }
  snapshot() {
    return {timeMarks:this.marks.map(({ratio,cap,...m})=>structuredClone(m)),
      timeRewinds:this.rewinds.map(({startHP,damage,radius,healRatio,healCap,...r})=>structuredClone(r)),timeEchoes:structuredClone(this.echoes)};
  }
}
