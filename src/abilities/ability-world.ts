import {AutomatonWorld,validateAutomaton} from './automaton-world';
import {GatesWorld,validateGates} from './gates-world';
import {MasksWorld,validateMasks} from './masks-world';
import {RetraceWorld,validateRetrace} from './retrace-world';
import {CannonWorld,validateCannon} from './cannon-world';
import {WindWorld,validateWind} from './wind-world';
import {ThornWorld,validateThorn} from './thorn-world';
import {CrystalWorld,validateCrystal} from './crystal-world';
import { DreamWorld,validateDream } from './dream-world';
import { FeatherWorld,validateFeather } from './feather-world';
import { PortalWorld, validatePortal } from './portal-world';
import { LanternWorld,validateLantern } from './lantern-world';
import { TimeWorld, validateTime } from './time-world';
import { ThreadWorld, validateThread } from './thread-world';
import { ScribeWorld, validateScribe } from './scribe-world';
import type { ScribeMemorySnapshot } from '../contracts/abilities';
import { FoxWorld, validateFox } from './fox-world';
import { BellWorld, validateBell } from './bell-world';
import { BeamWorld, validateBeam } from './beam-world';
import { GoWorld, validateGo } from './go-world';
import { DecoyWorld } from './decoy-world';
import { SweepWorld, validateSweep } from './sweep-world';
import { ReturningWeaponWorld, validateReturningWeapon } from './returning-weapon-world';
import { ChainWorld } from './chain-world';
import { SpearWorld } from './spear-world';
import { InkWorld } from './ink-world';
import type { InkStrokeSnapshot } from '../contracts/abilities';
import type { AbilityContact, AbilityDefinition, AbilityEvent, AbilitySetup, AbilitySnapshot } from '../contracts/abilities';
import type { DamageRequest, DamageResult } from '../contracts/combat';
import type { ArenaDefinition, BodySnapshot, Vec2, PhysicsEvent } from '../contracts/types';
import { abilityTarget, inAbilityRange, projectileAim } from './targeting';
import { ProjectileWorld } from '../projectiles/projectile-world';
import { UltimateCharge, validateUltimate, type ChargeTrigger } from './ultimate-charge';
import { BasicCharge, validateBasicCharge } from './basic-charge';
import { AreaWorld } from './area-world';
import { ZoneWorld } from './zone-world';
import { SummonWorld, validateSummon } from './summon-world';
import type { CombatantState } from '../contracts/combat';
import type { DashRequest } from '../contracts/motion';
import { FlurryWorld, validateFlurry } from './flurry-world';
import { WallSlamWorld } from './wall-slam-world';
import { validateKnockback, type KnockbackRequest } from '../contracts/forces';
import { ImpactFormWorld, validateImpactForm } from './impact-form-world';
import { NO_CONTACT_DEFENSE } from './contact-defense';
import type { StatusState, StatusDefinition, SkillDodge } from '../contracts/status';
import { validateStatus } from '../combat/status-world';

interface Runtime {
  ownerId: string; definition: AbilityDefinition; readyAt: number; casts: number; queued: boolean; dead: boolean;
  casting: { endsAt: number; targetId: string; aim: Vec2; chargeMultiplier: number; inkPoint?: Vec2 } | null;
  pendingInk?: { strokes: InkStrokeSnapshot[]; target: Vec2 };
  pendingThrust?: { aim: Vec2; targetId: string };
  pendingHook?: Vec2;
  pendingShot?: { aim: Vec2; targetId: string };
  retreatReadyAt?: number;
  lastThrustChargeCast?: number;
  lastReturningChargeCast?: number;
  lastSweepChargeCast?: number;
  lastBeamChargeTick?: number;
  lastBellChargeCast?: number;
  sequence?: { index: number; nextTick: number; angle: number; damageMultiplier: number };
  basicCharge: BasicCharge | null;
  meter: UltimateCharge | null; empoweredAt: number | null; expiresAt: number;
  pendingImpactTarget: string | null;
  pendingDetonation?: { targetId: string; point: Vec2; summonId: string }[];
  distanceCast?: { tick: number; full: boolean };
  boostUntil?: number;
  defenseUntil?: number;
  statusTarget?: string;
  pendingScript?:ScribeMemorySnapshot;
  lastScribeChargeCast?:number;
}
export class AbilityWorld {
  private lantern=new LanternWorld();
  private cannons=new CannonWorld();
  private wind=new WindWorld();
  private thorns=new ThornWorld();
  private retrace=new RetraceWorld();
  private automatons=new AutomatonWorld();
  private gates=new GatesWorld();
  private masks=new MasksWorld();
  takeCastCosts(){return this.gates.takeCosts();}
  windFields(tick:number,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>){return this.wind.fields(tick,new Set(bodies.map(b=>b.id)),locked);}
  private crystals=new CrystalWorld();
  private dreams=new DreamWorld();
  private feathers=new FeatherWorld();
  private time=new TimeWorld();
  prepareTime(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],health:readonly CombatantState[],scale:number,locked:ReadonlySet<string>,teleport:(id:string,point:Vec2)=>boolean,heal:(id:string,amount:number,ceiling:number)=>number) {
    this.time.prepare(tick,arena,bodies,health,scale,locked,teleport,heal,this.emit);
  }
  private portals=new PortalWorld();
  preparePortals(tick:number,arena:ArenaDefinition,bodies:readonly BodySnapshot[],locked:ReadonlySet<string>,teleport:(id:string,point:Vec2)=>boolean){
    this.portals.prepare(tick,arena,bodies,locked,teleport,this.emit);
  }
  private threads=new ThreadWorld();
  private scribe=new ScribeWorld();
  private fox=new FoxWorld();
  private bell=new BellWorld();
  private beams=new BeamWorld();
  motionLocks(){return new Set([...this.beams.locks(),...this.runtimes.filter(r=>!r.dead&&r.definition.effect.kind==='beam'&&r.empoweredAt!==null).map(r=>r.ownerId)]);}
  private go=new GoWorld();
  private sweeps=new SweepWorld();
  private returningWeapons = new ReturningWeaponWorld();
  private guardFeedback = new Map<string,number>();
  mitigateGuard(tick:number,request:DamageRequest,locked:ReadonlySet<string>,bodies:readonly BodySnapshot[]) {
    request=this.masks.mitigate(tick,request,locked);
    const source=request.source;
    const incoming=source.kind==='collision'?undefined:this.setup.definitions.find(d=>d.id===source.abilityId);
    const melee=source.kind==='collision'||source.kind==='melee'||(source.kind!=='status'&&['thrust','sweep','dash','flurry','impact-form'].includes(incoming?.effect.kind??''));
    request=this.lantern.mitigate(tick,request,melee,locked,this.emit);
    request=this.bell.mitigate(tick,request,locked);
    const r=this.runtimes.find(r=>r.ownerId===request.targetId&&!r.dead&&r.definition.effect.kind==='returning-weapon');
    if(!r||r.definition.effect.kind!=='returning-weapon'||locked.has(request.targetId))return request;
    const result=this.returningWeapons.mitigate(tick,request,r.definition.effect.heldReduction);
    if(result.charging)this.signal(request.targetId,'passive-proc',tick);
    const owner=bodies.find(b=>b.id===request.targetId);
    if(result.blocked&&owner&&tick-(this.guardFeedback.get(owner.id)??-Infinity)>=18){
      this.guardFeedback.set(owner.id,tick);
      this.emit({tick,ownerId:owner.id,abilityId:r.definition.id,kind:'dodge',point:{...owner.position},reason:'umbrella-block'});
    }
    return result.request;
  }
  private selfStatuses:{ownerId:string;abilityId:string;definition:StatusDefinition}[]=[];
  private lastDodgeFeedback=new Map<string,number>();
  takeSelfStatuses(){const items=this.selfStatuses;this.selfStatuses=[];return items;}
  recordDodges(tick:number,dodges:readonly SkillDodge[],bodies:readonly BodySnapshot[],arena:ArenaDefinition){
    const seen=new Set<string>();
    for(const d of dodges){const owner=bodies.find(b=>b.id===d.ownerId);if(!owner||seen.has(d.ownerId))continue;seen.add(d.ownerId);
      if(tick-(this.lastDodgeFeedback.get(d.ownerId)??-Infinity)>=18){
        this.lastDodgeFeedback.set(d.ownerId,tick);
        this.emit({tick,ownerId:d.ownerId,abilityId:d.abilityId,targetId:d.attackerId,kind:'dodge',point:{...owner.position}});
      }
      this.forms.dodgeCounter(tick,d.ownerId,d.attackerId,bodies,arena.obstacles);
    }
    this.knockbacks.push(...this.forms.takeRebounds());
  }
  private chains = new ChainWorld();
  private chainUltimateRemaining(ownerId:string,tick:number) {
    const ids=new Set(this.runtimes.filter(r=>r.ownerId===ownerId&&r.definition.ultimate&&(r.definition.effect.kind==='hook'||(r.definition.effect.kind==='zone'&&r.definition.effect.collapseRadius!==undefined))).map(r=>r.definition.id));
    if(!ids.size)return 0;
    return Math.max(0,...[...this.projectiles.snapshot(),...this.chains.snapshot(),...this.zones.snapshot().map(z=>({...z,expiresTick:z.detonatesTick}))].filter(p=>p.ownerId===ownerId&&ids.has(p.abilityId)).map(p=>p.expiresTick-tick));
  }
  private spear = new SpearWorld();
  private ink = new InkWorld();
  private decoys = new DecoyWorld();
  prepareDecoys(tick: number, bodies: readonly BodySnapshot[], locked: ReadonlySet<string>, teleport: (id: string, point: Vec2) => boolean) {
    this.decoys.prepare(tick,bodies,locked,teleport,this.emit);
  }
  private interceptDecoy(tick: number, request: DamageRequest) {
    const owner = this.decoys.break(request.targetId, request.source.attackerId, tick, this.emit);
    if (owner) this.signal(owner, 'passive-proc', tick);
    return !!owner;
  }
  private statusConsumptions: {sourceId:string;targetId:string;statusId:string}[]=[];
  syncStatuses(states:readonly StatusState[],tick:number) {
    this.fox.syncStatuses(states);
    for (const r of this.runtimes) if(r.meter&&r.definition.ultimate?.resource==='status-stacks'&&r.empoweredAt===null) {
      const candidates=states.filter(s=>s.sourceId===r.ownerId&&s.targetId!==r.ownerId&&s.definition.id===r.definition.ultimate!.statusId&&s.expiresTick>tick)
        .sort((a,b)=>b.stacks-a.stacks||(a.targetId<b.targetId?-1:1));
      r.statusTarget=candidates[0]?.targetId;
      r.meter.value=Math.min(r.definition.ultimate.maxCharge,candidates[0]?.stacks??0);
    }
  }
  takeStatusConsumptions() {const values=this.statusConsumptions;this.statusConsumptions=[];return values;}
  private setup: AbilitySetup;
  private runtimes: Runtime[];
  private projectiles: ProjectileWorld;
  private areas = new AreaWorld();
  private zones = new ZoneWorld();
  private summons = new SummonWorld();
  private flurries = new FlurryWorld();
  private motions: DashRequest[] = [];
  private wallSlams = new WallSlamWorld();
  private forms = new ImpactFormWorld();
  private formBlocked = new Set<string>();
  lifestealBonus(ownerId: string, tick: number) { return this.forms.lifestealBonus(ownerId, tick); }
  healthCosts(ownerId: string) { return new Map(this.runtimes.filter(r => r.ownerId === ownerId && r.definition.healthCostOnHit).map(r => [r.definition.id, r.definition.healthCostOnHit!])); }
  private transforming(id: string) { return this.forms.hasOwner(id) || this.runtimes.some(r=>r.ownerId===id && r.definition.effect.kind==='impact-form' && r.empoweredAt!==null); }
  recordMovement(tick: number, distances: ReadonlyMap<string,number>, locked: ReadonlySet<string> = new Set()) {
    this.forms.cleanup(tick,new Set(distances.keys()),false);
    for (const r of this.runtimes) if (!r.dead && !locked.has(r.ownerId) && !this.transforming(r.ownerId)) r.basicCharge?.addDistance(distances.get(r.ownerId)??0);
  }
  movementMultiplier(ownerId: string, tick: number) {
    if (this.forms.speed(ownerId,tick)>1) return this.forms.speed(ownerId,tick);
    const r=this.runtimes.find(r=>r.ownerId===ownerId && r.definition.basicCharge?.mode==='distance');
    if (!r || r.dead) return 1;
    const d=r.definition.basicCharge!, burst=d.afterHitBoost;
    const acceleration=1+(r.basicCharge?.stacks(tick)??0)*(d.speedPerStack??0);
    const boost=burst ? 1+(burst.multiplier-1)*Math.max(0,Math.min(1,((r.boostUntil??0)-tick)/burst.durationTicks)) : 1;
    return Math.max(acceleration,boost);
  }
  contactDefense(ownerId: string, tick: number) {
    const form = this.forms.defense(ownerId, tick);
    if (form) return form;
    const r = this.runtimes.find(r => r.ownerId === ownerId && !r.dead && r.definition.basicCharge?.defense);
    if (!r || this.transforming(ownerId)) return NO_CONTACT_DEFENSE;
    const d = r.definition.basicCharge!;
    return (r.basicCharge?.stacks(tick) === d.maxStacks || tick < (r.defenseUntil ?? 0)) ? d.defense! : NO_CONTACT_DEFENSE;
  }
  private knockbacks: KnockbackRequest[] = [];
  takeKnockbacks() { const requests = this.knockbacks; this.knockbacks = []; return requests; }
  takeMotions() { const motions = [...this.motions,...this.gates.takeMotions(),...this.masks.takeMotions()]; this.motions = []; return motions; }
  summonCombatants() { return [...this.summons.combatants(),...this.automatons.combatants()]; }
  private events: AbilityEvent[] = [];
  private nextEvent = 1;
  constructor(setup: AbilitySetup) {
    if (typeof setup.autoCast !== 'boolean' || !Number.isInteger(setup.maxProjectiles) || setup.maxProjectiles < 1 ||
      new Set(setup.definitions.map(d => d.id)).size !== setup.definitions.length ||
      new Set(setup.loadouts.map(l => l.ownerId)).size !== setup.loadouts.length) throw new Error('Invalid ability setup');
    for (const d of setup.definitions) {
      validateGates(d); validateMasks(d);
      validateAutomaton(d); validateRetrace(d); validateThorn(d); validateWind(d); validateCannon(d); validateCrystal(d); validateDream(d); validateFeather(d); validateLantern(d); validateTime(d); validatePortal(d); validateThread(d); validateSweep(d); validateGo(d); validateBeam(d); validateBell(d);validateFox(d);validateScribe(d);
      validateReturningWeapon(d);
      if(d.effect.kind==='hook') {
        const e=d.effect;
        if(d.range===0||!Number.isFinite(e.speed)||e.speed<100||e.speed>900||!Number.isFinite(e.radius)||e.radius<5||e.radius>30||
          !Number.isInteger(e.lifetimeTicks)||e.lifetimeTicks<1||e.lifetimeTicks>120||!Number.isInteger(e.pullTicks)||e.pullTicks<1||e.pullTicks>90||
          !Number.isFinite(e.acceleration)||e.acceleration<1||e.acceleration>1800||!Number.isFinite(e.contactDamage)||e.contactDamage<0||e.contactDamage>60||
          !Number.isFinite(e.distanceBonus)||e.distanceBonus<0||e.distanceBonus>30||e.angles.length!==(d.ultimate&&!e.constriction?3:1)||e.angles.some(a=>!Number.isFinite(a)||Math.abs(a)>90))throw new Error('Invalid chain hook');
        if(e.constriction&&(!d.ultimate||!Number.isInteger(e.constriction.intervalTicks)||e.constriction.intervalTicks<12||e.pullTicks!==e.constriction.intervalTicks*3||[e.constriction.pulseDamage,e.constriction.finisherDamage].some(v=>!Number.isFinite(v)||v<=0||v>40)))throw new Error('Invalid chain constriction');
      }
      if (d.effect.kind === 'thrust') {
        const e=d.effect, l=e.lunge;
        if(e.activeTicks!==undefined&&(!Number.isInteger(e.activeTicks)||e.activeTicks<1||e.activeTicks>18))throw new Error('Invalid thrust window');
        if(d.range===0 || !!d.ultimate!==!!l || !Number.isFinite(e.length) || e.length<40 || e.length>500 ||
          !Number.isFinite(e.radius) || e.radius<5 || e.radius>40 || !Number.isFinite(e.tipStart) || e.tipStart<.3 || e.tipStart>1 ||
          !Number.isFinite(e.tipMultiplier) || e.tipMultiplier<1 || e.tipMultiplier>2 ||
          (l && (!Number.isFinite(l.speed)||l.speed<100||l.speed>1400||!Number.isInteger(l.durationTicks)||l.durationTicks<1||l.durationTicks>30||!Number.isFinite(l.burstDamage)||l.burstDamage<=0||!Number.isFinite(l.burstRadius)||l.burstRadius<20||l.burstRadius>150))) throw new Error('Invalid spear thrust');
      }
      if (d.effect.kind === 'projectile' || d.effect.kind === 'projectile-sequence') {
        const e=d.effect;
        if(e.kind==='projectile') {
          if(e.pierce!==undefined && (!Number.isInteger(e.pierce)||e.pierce<1||e.pierce>8))throw new Error('Invalid piercing projectile');
          if(e.retreat && (d.ultimate || !Number.isFinite(e.retreat.range)||e.retreat.range<50||e.retreat.range>250||!Number.isFinite(e.retreat.strength)||e.retreat.strength<1||e.retreat.strength>900||!Number.isInteger(e.retreat.cooldownTicks)||e.retreat.cooldownTicks<60))throw new Error('Invalid retreat');
        }
        if(e.reflection && (e.reflection.remaining!==1 || !Number.isFinite(e.reflection.damageMultiplier) || e.reflection.damageMultiplier<=0 || e.reflection.damageMultiplier>=1)) throw new Error('Invalid projectile reflection');
        if(e.kind==='projectile-sequence'&&e.finisherReflection&&(!Number.isInteger(e.finisherReflection.remaining)||e.finisherReflection.remaining<1||e.finisherReflection.remaining>5||!Number.isFinite(e.finisherReflection.damageMultiplier)||e.finisherReflection.damageMultiplier<=0||e.finisherReflection.damageMultiplier>1))throw new Error('Invalid finisher reflection');
        if(e.kind==='projectile-sequence'&&e.finisherLifetimeTicks!==undefined&&(!Number.isInteger(e.finisherLifetimeTicks)||e.finisherLifetimeTicks<e.lifetimeTicks||e.finisherLifetimeTicks>600))throw new Error('Invalid finisher lifetime');
        if(e.kind==='projectile-sequence' && (!d.ultimate || d.range===0 || e.angles.length<2 || e.angles.length>9 || e.angles.some(a=>!Number.isFinite(a)||Math.abs(a)>180) || !Number.isInteger(e.intervalTicks) || e.intervalTicks<6 || e.intervalTicks>60 || !Number.isFinite(e.finisherMultiplier) || e.finisherMultiplier<1 || e.finisherMultiplier>3 || !Number.isFinite(e.finisherRadius) || e.finisherRadius<e.radius || e.finisherRadius>34 || !Number.isFinite(e.speed) || e.speed<100 || e.speed>900 || !Number.isFinite(e.radius) || e.radius<5 || e.radius>30 || !Number.isInteger(e.lifetimeTicks) || e.lifetimeTicks<1 || e.lifetimeTicks>300)) throw new Error('Invalid projectile sequence');
      }
      if ((d.effect.kind === 'ink-dragons') !== (d.ultimate?.resource === 'ink-strokes')) throw new Error('Ink dragons require a stroke resource');
      if (d.effect.kind === 'ink-stroke') {
        validateStatus(d.effect.fieldStatus);
        if (d.ultimate || d.range === 0 || !Number.isFinite(d.effect.length) || d.effect.length < 40 || d.effect.length > 180 || !Number.isFinite(d.effect.radius) || d.effect.radius < 5 || d.effect.radius > 25 || !Number.isInteger(d.effect.lifetimeTicks) || d.effect.lifetimeTicks < 180 || d.effect.lifetimeTicks > 900) throw new Error('Invalid ink stroke');
      }
      if (d.effect.kind === 'ink-dragons' && (d.range === 0 || !Number.isFinite(d.effect.speed) || d.effect.speed < 200 || d.effect.speed > 900 || !Number.isFinite(d.effect.radius) || d.effect.radius < 5 || d.effect.radius > 35 || !Number.isInteger(d.effect.lifetimeTicks) || d.effect.lifetimeTicks < 30 || d.effect.lifetimeTicks > 180)) throw new Error('Invalid ink dragon');
      if (d.effect.kind === 'decoy' && (d.ultimate || d.effect.damage !== 0 ||
        !Number.isInteger(d.effect.lifetimeTicks) || d.effect.lifetimeTicks < 30 || d.effect.lifetimeTicks > 300 ||
        !Number.isInteger(d.effect.swapDelayTicks) || d.effect.swapDelayTicks < 1 || d.effect.swapDelayTicks >= d.effect.lifetimeTicks ||
        !Number.isFinite(d.effect.distance) || d.effect.distance < 70 || d.effect.distance > 200)) throw new Error('Invalid decoy definition');
      if (d.onHitStatus) validateStatus(d.onHitStatus);
      if (d.effect.kind === 'zone') {
        if(d.effect.collapseRadius!==undefined&&(!d.ultimate||d.effect.triggerWindowTicks!==undefined||!Number.isFinite(d.effect.collapseRadius)||d.effect.collapseRadius<30||d.effect.collapseRadius>d.effect.radius))throw new Error('Invalid contracting domain');
        if (d.effect.fieldStatus) validateStatus(d.effect.fieldStatus);
        if (d.effect.placement !== undefined && d.effect.placement !== 'caster') throw new Error('Invalid zone placement');
        if (d.effect.triggerWindowTicks !== undefined && (!Number.isInteger(d.effect.triggerWindowTicks) || d.effect.triggerWindowTicks < 1 || d.effect.triggerWindowTicks > 600)) throw new Error('Invalid trap window');
      }
      if (d.healthCostOnHit !== undefined && (d.ultimate || d.effect.kind !== 'melee' || d.range !== 0 || !Number.isFinite(d.healthCostOnHit) || d.healthCostOnHit <= 0 || d.healthCostOnHit > .1)) throw new Error('Invalid health cost');
      if ((d.effect.kind==='status-burst') !== (d.ultimate?.resource==='status-stacks')) throw new Error('Status burst requires a status stack resource');
      if (d.effect.kind==='projectile' && d.effect.volley && (!Number.isInteger(d.effect.volley.count)||d.effect.volley.count<2||d.effect.volley.count>5||!Number.isFinite(d.effect.volley.spreadDegrees)||d.effect.volley.spreadDegrees<=0||d.effect.volley.spreadDegrees>90)) throw new Error('Invalid projectile volley');
      if (d.ultimate?.resource === 'attached-summons' && !(d.effect.kind === 'summon' && d.effect.detonation)) throw new Error('Attachment count requires summon detonation');
      if (!d.id || !d.name || !Number.isInteger(d.range) || d.range < 0 || d.range > 5 || !Number.isInteger(d.castTicks) ||
        (d.range === 0 ? d.castTicks !== 0 || !['melee', 'dash', 'flurry', 'area', 'impact-form', 'guard-burst'].includes(d.effect.kind) : d.castTicks < 1) ||
        !Number.isInteger(d.cooldownTicks) || d.cooldownTicks < Math.max(1, d.castTicks) || !Number.isFinite(d.effect.damage) || d.effect.damage < 0 || (d.effect.damage === 0 && d.effect.kind !== 'masks-awaken' && d.effect.kind !== 'decoy' && !(d.effect.kind === 'summon' && d.effect.summon.attachment && !d.ultimate)) ||
        !['masks-shift','masks-awaken','gates-punch','gates-combo','automaton-command','automaton-awaken','retrace-follow','retrace-return','thorn-plant','thorn-garden','wind-fan','wind-storm','cannon-shot','cannon-salvo','crystal-lance','crystal-array','dream-wave', 'feather-shot', 'feather-recall', 'lantern', 'soul-release', 'time-rewind', 'portal', 'script-return', 'fox-hunt', 'bell', 'beam', 'go-stone', 'go-board', 'sweep', 'returning-weapon', 'guard-burst', 'hook', 'thrust', 'melee', 'dash', 'flurry', 'projectile', 'projectile-sequence', 'area', 'zone', 'summon', 'decoy', 'ink-stroke', 'ink-dragons', 'impact-form', 'status-burst'].includes(d.effect.kind)) throw new Error('Invalid ability definition');
      if (d.effect.kind==='impact-form') { validateImpactForm(d.effect); if (d.ultimate ? d.range!==0 : d.range===0 || !d.effect.rebound) throw new Error('Impact form requires an ultimate or a ranged counter stance'); }
      if(d.selfStatus){validateStatus(d.selfStatus);if(d.effect.kind!=='impact-form'||d.selfStatus.durationTicks>d.effect.durationTicks)throw new Error('Invalid self status duration');}
      if (d.basicCharge?.mode==='distance' && (d.effect.kind!=='melee' || d.range!==0)) throw new Error('Distance charge requires contact melee');
      if (d.effect.kind === 'dash' && (d.range !== 0 || d.ultimate || !Number.isFinite(d.effect.speed) || d.effect.speed <= 0 || d.effect.speed > 1400 || !Number.isInteger(d.effect.durationTicks) || d.effect.durationTicks < 1 || d.effect.durationTicks > 30)) throw new Error('Invalid dash');
      if (d.effect.kind === 'flurry') { validateFlurry(d.effect); if (!d.ultimate || d.range !== 0) throw new Error('Flurry requires impact ultimate'); }
      if (d.ultimate?.activation === 'impact' && d.range !== 0) throw new Error('Impact activation requires range zero');
      if (d.effect.kind === 'summon') {
        validateSummon(d.effect.summon, d.effect.empowerment);
        if (!!d.ultimate !== !!(d.effect.empowerment || d.effect.detonation)) throw new Error('Summon ultimate requires empowerment or detonation');
        if (d.effect.detonation && (!d.effect.summon.attachment || d.ultimate?.resource !== 'attached-summons' || d.ultimate.maxCharge !== d.effect.summon.attachment.maxCount)) throw new Error('Invalid summon detonation');
      }
      if (d.effect.kind === 'projectile' && (!Number.isFinite(d.effect.speed) || d.effect.speed <= 0 || !Number.isFinite(d.effect.radius) || d.effect.radius <= 0 ||
        !Number.isInteger(d.effect.lifetimeTicks) || d.effect.lifetimeTicks < 1 || (d.effect.aiming !== undefined && d.effect.aiming !== 'predictive'))) throw new Error('Invalid projectile definition');
      if (d.effect.kind === 'projectile' && d.effect.maxLeadSeconds !== undefined &&
        (d.effect.aiming !== 'predictive' || !Number.isFinite(d.effect.maxLeadSeconds) || d.effect.maxLeadSeconds < 0 || d.effect.maxLeadSeconds > 1.2)) throw new Error('Invalid projectile lead time');
      if (d.effect.kind === 'area' && (!d.ultimate || !Number.isFinite(d.effect.radius) || d.effect.radius <= 0 || !Number.isInteger(d.effect.durationTicks) || d.effect.durationTicks < 1)) throw new Error('Invalid area ultimate');
      if (d.effect.kind === 'zone' && (!Number.isFinite(d.effect.radius) || d.effect.radius <= 0 || !Number.isInteger(d.effect.delayTicks) || d.effect.delayTicks < 1 || d.effect.delayTicks > 600 ||
        !Number.isFinite(d.effect.aimLeadSeconds) || d.effect.aimLeadSeconds < 0 || d.effect.aimLeadSeconds > .3 ||
        (d.effect.placementOrbitRadius !== undefined && (!Number.isFinite(d.effect.placementOrbitRadius) || d.effect.placementOrbitRadius < 0 || d.effect.placementOrbitRadius > d.effect.radius)) ||
        (d.effect.pullAcceleration !== undefined && (!Number.isFinite(d.effect.pullAcceleration) || d.effect.pullAcceleration <= 0 || d.effect.pullAcceleration > 1800)))) throw new Error('Invalid zone definition');
      if (d.ultimate) { validateUltimate(d.ultimate); if (d.range !== 0 && !['masks-shift','masks-awaken','gates-punch','gates-combo','automaton-command','automaton-awaken','retrace-follow','retrace-return','thorn-plant','thorn-garden','wind-fan','wind-storm','cannon-shot','cannon-salvo','crystal-lance','crystal-array','dream-wave', 'feather-shot', 'feather-recall', 'lantern', 'soul-release', 'time-rewind', 'portal', 'script-return', 'fox-hunt', 'bell', 'beam', 'go-board', 'sweep', 'projectile', 'hook', 'thrust', 'area', 'zone', 'summon', 'ink-dragons', 'status-burst', 'projectile-sequence'].includes(d.effect.kind)) throw new Error('Ultimate requires impact or area delivery'); }
      if (d.basicCharge) { validateBasicCharge(d.basicCharge); if (d.ultimate) throw new Error('Ultimate cannot use basic charge'); }
      if (d.knockback) validateKnockback(d.knockback);
      if (d.range === 0 && d.effect.kind === 'area' && d.ultimate?.activation !== 'impact') throw new Error('Contact area requires impact activation');
    }
    this.setup = structuredClone(setup);
    this.runtimes = this.setup.loadouts.flatMap(l => {
      if (new Set(l.abilityIds).size !== l.abilityIds.length) throw new Error('Duplicate loadout ability');
      if (l.slots && (JSON.stringify(l.abilityIds) !== JSON.stringify([l.slots.basic, ...(l.slots.ultimate ? [l.slots.ultimate] : [])]) ||
        this.setup.definitions.find(d => d.id === l.slots!.basic)?.ultimate ||
        (l.slots.ultimate && !this.setup.definitions.find(d => d.id === l.slots!.ultimate)?.ultimate))) throw new Error('Invalid basic/ultimate slots');
      return l.abilityIds.map(id => {
        const definition = this.setup.definitions.find(d => d.id === id);
        if (!definition) throw new Error('Unknown loadout ability');
        return { ownerId: l.ownerId, definition, readyAt: 0, casts: 0, queued: false, dead: false, casting: null,
          meter: definition.ultimate ? new UltimateCharge(definition.ultimate) : null, empoweredAt: null, expiresAt: 0,
          pendingImpactTarget: null,
          basicCharge: definition.basicCharge ? new BasicCharge(definition.basicCharge) : null };
      });
    });
    this.projectiles = new ProjectileWorld(setup.maxProjectiles);
  }
  private emit = (event: Omit<AbilityEvent, 'id'>) => {
    this.events.push({ ...structuredClone(event), id: this.nextEvent++ });
    if (this.events.length > 64) this.events.shift();
  };
  queue(ownerId: string, abilityId: string) {
    const runtime = this.runtimes.find(r => r.ownerId === ownerId && r.definition.id === abilityId);
    if (runtime && !runtime.dead) runtime.queued = true;
  }
  signal(ownerId: string, trigger: ChargeTrigger, tick: number, units = 1) {
    if(this.automatons.hasWarrior(ownerId)||this.retrace.hasUltimate(ownerId)||this.thorns.hasOwner(ownerId)||this.wind.hasOwner(ownerId)||this.cannons.hasOwner(ownerId)||this.crystals.hasOwner(ownerId)||this.dreams.hasOwner(ownerId)||this.feathers.hasUltimate(ownerId)||this.lantern.hasUltimate(ownerId)||this.time.hasOwner(ownerId)||this.portals.hasOwner(ownerId,true)||this.threads.hasOwner(ownerId)||this.scribe.hasOwner(ownerId)||this.fox.hasOwner(ownerId)||this.bell.hasOwner(ownerId)||this.go.hasBoard(ownerId)||this.sweeps.hasUltimate(ownerId)||this.beams.hasUltimate(ownerId))return;
    if(this.returningWeapons.hasGuard(ownerId))return;
    if (this.chainUltimateRemaining(ownerId,tick)>0 || this.spear.hasLunge(ownerId) || this.transforming(ownerId) || this.formBlocked.has(ownerId) || this.runtimes.some(r=>r.ownerId===ownerId&&r.sequence)) return;
    for (const r of this.runtimes) if (r.ownerId === ownerId && !r.dead && r.empoweredAt === null && tick >= r.readyAt) r.meter?.signal(trigger, tick, units);
  }
  recordDamageTaken(tick: number, results: readonly DamageResult[], living: ReadonlySet<string>) {
    this.time.record(tick,results,living);
    this.scribe.record(tick,results,new Set(this.runtimes.filter(r=>!r.dead&&r.definition.effect.kind==='script-return').map(r=>r.ownerId)),new Map(this.runtimes.filter(r=>!r.definition.ultimate).map(r=>[r.ownerId,r.definition.id])),this.setup.definitions,living);
    this.bell.receive(tick,results,new Set(this.runtimes.filter(r=>!r.dead&&living.has(r.ownerId)&&r.definition.effect.kind==='bell').map(r=>r.ownerId)));
    this.beams.interrupt(tick,results,this.emit);
    for(const r of this.runtimes)if(r.definition.effect.kind==='beam'&&r.empoweredAt!==null&&results.some(h=>h.request.targetId===r.ownerId&&h.appliedDamage>0&&h.request.source.attackerId!==r.ownerId)){
      r.empoweredAt=null;r.pendingScript=undefined;r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;
      this.emit({tick,ownerId:r.ownerId,abilityId:r.definition.id,kind:'cancelled',point:{x:0,y:0},reason:'charge-interrupted'});
    }
    const amounts = new Map<string, number>();
    for (const r of results) if (r.outcome === 'applied' && r.appliedDamage > 0 && living.has(r.request.targetId) && r.request.source.attackerId !== r.request.targetId)
      amounts.set(r.request.targetId, (amounts.get(r.request.targetId) ?? 0) + r.appliedDamage);
    for (const [id, amount] of amounts) this.signal(id, 'enemy-damage', tick, amount);
  }
  recordHits(tick: number, results: readonly DamageResult[], living: ReadonlySet<string>, bodies: readonly BodySnapshot[] = []) {
    this.knockbacks.push(...this.masks.confirm(tick,results,living,bodies));
    this.knockbacks.push(...this.gates.confirm(tick,results,living));
    for (const result of results) {
      const source = result.request.source;
      if (result.appliedDamage > 0 && living.has(source.attackerId) && source.kind === 'status' && source.statusId === 'wall-slam') this.signal(source.attackerId, 'wall-slam', tick);
      if (result.appliedDamage <= 0 || !living.has(source.attackerId) || source.kind === 'collision' || source.kind === 'status') continue;
      const definition = this.setup.definitions.find(d => d.id === source.abilityId);
      if(definition)this.time.confirm(tick,result,definition,living);
      if(definition?.id==='scribe-glyph'){const r=this.runtimes.find(r=>r.ownerId===source.attackerId&&r.definition.id===definition.id);if(r){if(r.lastScribeChargeCast===r.casts)continue;r.lastScribeChargeCast=r.casts;}}
      const threadKnockback=this.threads.confirmJerk(result,bodies);if(threadKnockback)this.knockbacks.push(threadKnockback);
      if(definition?.effect.kind==='projectile'&&definition.effect.fateThread){
        this.threads.confirm(tick,result,definition,bodies,living);
        if(source.kind!=='projectile')continue;
      }
      const bellKnockback=this.bell.confirm(result,bodies);if(bellKnockback)this.knockbacks.push(bellKnockback);
      const windPush=this.wind.confirmedPush(tick,source.attackerId,result.request.targetId,source.abilityId);if(windPush)this.knockbacks.push(windPush);
      if(definition?.effect.kind==='bell'&&!definition.ultimate){const r=this.runtimes.find(r=>r.ownerId===source.attackerId&&r.definition.id===definition.id);if(r){if(r.lastBellChargeCast===r.casts)continue;r.lastBellChargeCast=r.casts;}}
      if(definition?.effect.kind==='beam'&&!definition.ultimate){
        const r=this.runtimes.find(r=>r.ownerId===source.attackerId&&r.definition.id===definition.id);
        if(r){if(r.lastBeamChargeTick===tick)continue;r.lastBeamChargeTick=tick;}
      }
      if(definition?.effect.kind==='sweep'&&!definition.ultimate){
        const r=this.runtimes.find(r=>r.ownerId===source.attackerId&&r.definition.id===definition.id);
        if(r){if(r.lastSweepChargeCast===r.casts)continue;r.lastSweepChargeCast=r.casts;}
      }
      if(definition?.effect.kind==='returning-weapon') {
        const r=this.runtimes.find(r=>r.ownerId===source.attackerId&&r.definition.id===definition.id);
        if(r&&r.lastReturningChargeCast!==r.casts){r.lastReturningChargeCast=r.casts;this.signal(r.ownerId,'passive-proc',tick);}
      }
      if(definition?.effect.kind==='hook') {
        // Contact finishers must not grant another hook count or start another tether.
        if(!living.has(result.request.targetId)||!this.chains.confirm(tick,result,definition,bodies,result.request.amount/definition.effect.damage))continue;
      }
      const distanceRuntime=this.runtimes.find(r=>r.ownerId===source.attackerId && r.definition.id===source.abilityId && r.distanceCast?.tick===tick);
      if (distanceRuntime && !this.transforming(source.attackerId) && !this.formBlocked.has(source.attackerId)) {
        const cast=distanceRuntime.distanceCast!; distanceRuntime.distanceCast=undefined;
        if (cast.full) this.signal(source.attackerId,'charged-basic-hit',tick);
        const burst=definition?.basicCharge?.afterHitBoost;
        if (burst) distanceRuntime.boostUntil=tick+burst.durationTicks;
        if (cast.full && burst) distanceRuntime.defenseUntil=tick+burst.durationTicks;
      }
      const owner = bodies.find(b => b.id === source.attackerId), target = bodies.find(b => b.id === result.request.targetId);
      if (definition?.knockback && owner && target && living.has(target.id)) {
        this.knockbacks.push({ ownerId: owner.id, targetId: target.id, direction: { x: target.position.x - owner.position.x, y: target.position.y - owner.position.y }, strength: definition.knockback.strength });
        this.wallSlams.disarm(target.id);
        const slam = definition.knockback.wallSlam;
        if (slam) this.wallSlams.arm({ ownerId: owner.id, targetId: target.id, abilityId: definition.id, damage: slam.damage, appliedTick: tick, expiresTick: tick + slam.windowTicks });
      }
      const thrustRuntime=definition?.effect.kind==='thrust'&&!definition.ultimate?this.runtimes.find(r=>r.ownerId===source.attackerId&&r.definition.id===source.abilityId):undefined;
      if(thrustRuntime){if(thrustRuntime.lastThrustChargeCast===thrustRuntime.casts)continue;thrustRuntime.lastThrustChargeCast=thrustRuntime.casts;}
      if (this.runtimes.some(r => r.ownerId === source.attackerId && r.definition.id === source.abilityId && !r.meter))
        this.signal(source.attackerId, 'basic-hit', tick);
    }
  }
  physicsForces(tick: number, arena?:ArenaDefinition, bodies:readonly BodySnapshot[]=[], locked:ReadonlySet<string>=new Set()) {
    return [...(arena?this.fox.forces(tick,arena,bodies):[]),...this.zones.forces(tick),...(arena?this.chains.forces(tick,arena,bodies,locked):[])];
  }
  fieldApplications(tick: number, bodies: readonly BodySnapshot[]) { return [...this.dreams.fields(tick,bodies),...this.zones.fieldApplications(tick, bodies),...this.ink.fields(tick,bodies)]; }
  hitStatusApplications(results: readonly DamageResult[], living: ReadonlySet<string>) {
    return [...this.masks.statuses(results,living), ...results.flatMap(r => {
      const s = r.request.source;
      if (r.appliedDamage <= 0 || s.kind === 'collision' || s.kind === 'status' || !living.has(s.attackerId) || !living.has(r.request.targetId)) return [];
      const d = this.setup.definitions.find(d => d.id === s.abilityId);
      return d?.onHitStatus ? [{ sourceId: s.attackerId, targetId: r.request.targetId, abilityId: d.id, definition: d.onHitStatus }] : [];
    })];
  }
  private launchHooks(tick:number,owner:BodySnapshot,d:AbilityDefinition,aim:Vec2,damage:number,castIndex:number) {
    if(d.effect.kind!=='hook')return;
    const e=d.effect,heading=Math.atan2(aim.y,aim.x);
    for(const degrees of e.angles) {
      const angle=heading+degrees*Math.PI/180,position={...owner.position};
      const spawned=this.projectiles.spawn({ownerId:owner.id,abilityId:d.id,position,previousPosition:position,
        velocity:{x:Math.cos(angle)*e.speed,y:Math.sin(angle)*e.speed},radius:e.radius,damage,spawnedTick:tick,expiresTick:tick+e.lifetimeTicks,
        hitGroup:`${owner.id}:${d.id}:${castIndex}`,visualScale:d.ultimate?1.3:1});
      this.emit({tick,ownerId:owner.id,abilityId:d.id,kind:spawned?'projectile':'miss',point:position,reason:spawned?undefined:'capacity'});
    }
  }
  private placeZone(tick: number, owner: BodySnapshot, target: BodySnapshot, d: AbilityDefinition, damage: number, arena: ArenaDefinition, castIndex: number) {
    if (d.effect.kind !== 'zone') return;
    const e = d.effect;
    if(e.collapseRadius!==undefined){
      this.chains.releaseOwner(owner.id);
      this.projectiles.removeAbilities(owner.id,new Set(this.runtimes.filter(r=>r.ownerId===owner.id&&r.definition.effect.kind==='hook').map(r=>r.definition.id)));
    }
    // Snapshot the destination once. Warning rings never chase their target.
    // A data-configured orbit distributes placements instead of a brittle exact-speed intercept.
    // Golden-angle sequencing is repeatable; it never reads visual time or Math.random.
    const ownerPhase = [...owner.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const angle = (castIndex + ownerPhase) * 2.399963229728653, orbit = e.placementOrbitRadius ?? 0;
    const position = e.placement === 'caster' ? { ...owner.position } : { x: Math.max(0, Math.min(arena.width, target.position.x + target.velocity.x * e.aimLeadSeconds + Math.cos(angle) * orbit)),
      y: Math.max(0, Math.min(arena.height, target.position.y + target.velocity.y * e.aimLeadSeconds + Math.sin(angle) * orbit)) };
    const spawned = this.zones.spawn({ ownerId: owner.id, abilityId: d.id, position, radius: e.radius, damage,
      spawnedTick: tick, detonatesTick: tick + e.delayTicks, pullAcceleration: e.pullAcceleration ?? 0,
      triggerUntilTick: e.triggerWindowTicks === undefined ? undefined : tick + e.delayTicks + e.triggerWindowTicks, fieldStatus: e.fieldStatus, collapseRadius:e.collapseRadius });
    this.emit({ tick, ownerId: owner.id, abilityId: d.id, kind: spawned ? 'area' : 'miss', point: position, reason: spawned ? undefined : 'capacity' });
  }
  step(tick: number, dt: number, arena: ArenaDefinition, bodies: readonly BodySnapshot[], multipliers: ReadonlyMap<string, number>, contacts: readonly AbilityContact[] = [], locked: ReadonlySet<string> = new Set(), hostImpacts: readonly Omit<PhysicsEvent, 'id'>[] = [], evadeAttachment?: (targetId:string,ownerId:string)=>boolean): DamageRequest[] {
    for(const r of this.runtimes)if(!r.dead&&r.definition.effect.kind==='masks-shift')this.masks.register(r.ownerId);
    this.retrace.record(tick,bodies,new Set(this.runtimes.filter(r=>r.definition.effect.kind==='retrace-follow').map(r=>r.ownerId)));
    this.chains.prepare(tick,arena,bodies,locked);
    this.ink.prune(tick,new Set(bodies.map(b=>b.id)));
    for (const owner of this.decoys.contacts(tick,bodies,this.emit)) this.signal(owner,'passive-proc',tick);
    this.forms.cleanup(tick,new Set(bodies.map(b=>b.id)),false);
    this.formBlocked=new Set(this.forms.snapshot(tick).map(f=>f.ownerId));
    this.summons.applyHostImpacts(hostImpacts);
    const requests: DamageRequest[] = this.summons.step(tick, dt, arena, [...bodies,...this.automatons.targets()], this.emit,evadeAttachment);
    requests.push(...this.threads.step(tick,arena,bodies,locked,hostImpacts,this.emit,multipliers));
    requests.push(...this.chains.step(tick,bodies,contacts,this.emit));
    requests.push(...this.forms.step(tick,contacts,bodies,this.emit,locked,arena.obstacles));
    this.knockbacks.push(...this.forms.takeRebounds());
    for (const hit of this.wallSlams.resolve(tick, hostImpacts, new Set(bodies.map(b => b.id)))) {
      requests.push({ ...hit.request, amount: hit.request.amount * (multipliers.get(hit.request.source.attackerId) ?? 1) });
      const source = hit.request.source;
      if (source.kind === 'status') this.emit({ tick, ownerId: source.attackerId, abilityId: source.abilityId, targetId: hit.request.targetId, kind: 'hit', point: hit.point });
    }
    const decoyIds = new Set(this.decoys.targets().map(t=>t.id));
    const targets = [...bodies, ...this.summons.targets(), ...this.automatons.targets(), ...this.decoys.targets()];
    requests.push(...this.returningWeapons.step(tick,dt,arena,targets,locked,this.emit));
    requests.push(...this.spear.step(tick,arena,targets,locked,hostImpacts,this.emit));
    const living = new Map(targets.map(b => [b.id, b]));
    for (const r of this.runtimes) {
      if(['automaton-command','automaton-awaken','retrace-follow','retrace-return','thorn-plant','thorn-garden','wind-fan','wind-storm','cannon-shot','cannon-salvo','crystal-lance','crystal-array','dream-wave','feather-recall','soul-release','time-rewind','portal','beam','bell','fox-hunt','script-return'].includes(r.definition.effect.kind)&&r.empoweredAt!==null&&locked.has(r.ownerId)){
        r.empoweredAt=null;r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;
        this.emit({tick,ownerId:r.ownerId,abilityId:r.definition.id,kind:'cancelled',point:living.get(r.ownerId)?.position??{x:0,y:0},reason:'ability-locked'});
      }
      if (r.meter && r.definition.ultimate?.resource === 'attached-summons') r.meter.value = r.pendingDetonation?.length ?? this.summons.attachedCount(r.ownerId);
      if (r.empoweredAt !== null && tick > r.expiresAt) {
        r.pendingHook = undefined;
        r.pendingThrust = undefined;
        r.pendingInk = undefined;
        r.pendingScript = undefined;
        r.empoweredAt = null;
        r.pendingImpactTarget = null;
        this.emit({ tick, ownerId: r.ownerId, abilityId: r.definition.id, kind: 'expired', point: living.get(r.ownerId)?.position ?? { x: 0, y: 0 }, reason: 'empowerment-expired' });
      }
      if (living.has(r.ownerId)) this.signal(r.ownerId, 'time', tick);
    }
    for (const r of this.runtimes) {
      const owner = living.get(r.ownerId);
      if (!owner || !r.casting || tick < r.casting.endsAt) continue;
      if (locked.has(owner.id)) { r.casting = null; this.emit({ tick, ownerId: owner.id, abilityId: r.definition.id, kind: 'cancelled', point: owner.position, reason: 'ability-locked' }); continue; }
      const cast = r.casting;
      r.casting = null;
      const d = r.definition;
      const target = living.get(cast.targetId);
      const base = { tick, ownerId: r.ownerId, abilityId: d.id, targetId: cast.targetId, point: owner.position };
      if(d.effect.kind==='impact-form'){
        this.forms.start(tick,owner.id,d.id,d.effect,(multipliers.get(owner.id)??1)*cast.chargeMultiplier);
        if(d.selfStatus)this.selfStatuses.push({ownerId:owner.id,abilityId:d.id,definition:d.selfStatus});
        this.formBlocked.add(owner.id);
        continue;
      }
      if (d.effect.kind === 'decoy') {
        const decoy = this.decoys.spawn(tick,owner,d.id,d.effect.lifetimeTicks,d.effect.swapDelayTicks,d.effect.distance,arena,bodies);
        this.emit({...base,kind:decoy?'decoy-spawn':'miss',point:decoy?.position??owner.position,reason:decoy?undefined:'decoy-blocked'});
        continue;
      }
      if (d.effect.kind === 'summon') {
        const spawned = this.summons.spawn(tick, owner, d.id, d.effect.summon, d.effect.damage * cast.chargeMultiplier * (multipliers.get(owner.id) ?? 1), arena);
        this.emit({ ...base, kind: spawned ? 'summon' : 'miss', reason: spawned ? undefined : 'summon-active' });
        continue;
      }
      if (!target) { this.emit({ ...base, kind: 'miss', reason: 'target-defeated' }); continue; }
      const damage = d.effect.damage * cast.chargeMultiplier * (multipliers.get(owner.id) ?? 1);
      if(d.effect.kind==='portal') {
        this.portals.start(tick,owner,target,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena,bodies,this.emit);
      } else if(d.effect.kind==='automaton-command') {
        this.automatons.command(tick,owner,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena,this.emit);
      } else if(d.effect.kind==='retrace-follow') {
        this.retrace.start(tick,owner,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1));
      } else if(d.effect.kind==='thorn-plant') {
        this.thorns.plant(tick,owner,target,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena,this.emit);
      } else if(d.effect.kind==='wind-fan') {
        this.wind.startFan(tick,owner,target,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),this.emit);
      } else if(d.effect.kind==='cannon-shot') {
        this.cannons.launch(tick,owner,target,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena,this.emit);
      } else if(d.effect.kind==='crystal-lance') {
        this.crystals.launch(tick,owner,target,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena,this.emit);
      } else if(d.effect.kind==='feather-shot') {
        this.feathers.launch(tick,owner,target,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena);
      } else if(d.effect.kind==='lantern') {
        this.lantern.start(tick,owner,target,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena);
      } else if(d.effect.kind==='go-stone') {
        this.go.launch(tick,owner,target,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena);
      } else if(d.effect.kind==='sweep') {
        const dx=target.position.x-owner.position.x,dy=target.position.y-owner.position.y,l=Math.hypot(dx,dy);
        this.sweeps.start(tick,owner,l?{x:dx/l,y:dy/l}:cast.aim,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),this.emit);
      } else if(d.effect.kind==='returning-weapon') {
        const e=d.effect,aim=projectileAim(owner,target,arena,e.reach/(e.outboundTicks/60),e.radius,e.outboundTicks/60,.2);
        this.returningWeapons.launch(tick,owner,aim,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),Math.hypot(target.position.x-owner.position.x,target.position.y-owner.position.y));
        this.emit({...base,kind:'projectile'});
      } else if(d.effect.kind==='hook') {
        const aim=projectileAim(owner,target,arena,d.effect.speed,d.effect.radius,d.effect.lifetimeTicks/60,.12);
        this.launchHooks(tick,owner,d,aim,damage,r.casts);
      } else if (d.effect.kind === 'thrust') {
        const dx=target.position.x-owner.position.x,dy=target.position.y-owner.position.y,len=Math.hypot(dx,dy);
        const aim=len>1e-8?{x:dx/len,y:dy/len}:cast.aim;
        requests.push(...this.spear.startThrust(tick,owner,aim,d,cast.chargeMultiplier*(multipliers.get(owner.id)??1),arena,targets,this.emit));
      } else if (d.effect.kind === 'ink-stroke') {
        const p=cast.inkPoint??target.position;
        requests.push(...this.ink.spawn(tick,owner,p,Math.atan2(cast.aim.y,cast.aim.x)+Math.PI/2,d.id,d.effect,damage,arena,targets,this.emit));
      } else if (d.effect.kind === 'melee') {
        const inRange = inAbilityRange(owner, target, d.range);
        this.emit({ ...base, kind: inRange ? 'melee' : 'miss', end: target.position, reason: inRange ? undefined : 'out-of-range' });
        if (inRange) requests.push({ tick, source: { kind: 'melee', attackerId: owner.id, abilityId: d.id }, targetId: target.id, amount: damage });
      } else if (d.effect.kind === 'zone') {
        this.placeZone(tick, owner, target, d, damage, arena, r.casts);
      } else if (d.effect.kind === 'projectile') {
        const aim = !d.ultimate && d.effect.aiming === 'predictive' ? projectileAim(owner, target, arena, d.effect.speed, d.effect.radius, d.effect.lifetimeTicks / 60, d.effect.maxLeadSeconds) : cast.aim;
        const retreat=d.effect.retreat;
        if(retreat && tick>=(r.retreatReadyAt??0) && Math.hypot(target.position.x-owner.position.x,target.position.y-owner.position.y)<retreat.range) {
          const dx=owner.position.x-target.position.x,dy=owner.position.y-target.position.y,length=Math.hypot(dx,dy);
          this.knockbacks.push({ownerId:owner.id,targetId:owner.id,direction:length>1e-8?{x:dx/length,y:dy/length}:{x:-aim.x,y:-aim.y},strength:retreat.strength,selfRebound:true});
          r.retreatReadyAt=tick+retreat.cooldownTicks;
          this.emit({...base,kind:'dodge',reason:'retreat-shot'});
        }
        const count=d.effect.volley?.count??1, spread=(d.effect.volley?.spreadDegrees??0)*Math.PI/180;
        for(let i=0;i<count;i++) {
          const angle=count===1?0:(i/(count-1)-.5)*spread;
          const direction={x:aim.x*Math.cos(angle)-aim.y*Math.sin(angle),y:aim.x*Math.sin(angle)+aim.y*Math.cos(angle)};
          const position = d.effect.reflection ? {...owner.position} : { x: owner.position.x + direction.x * (owner.radius + d.effect.radius + 1), y: owner.position.y + direction.y * (owner.radius + d.effect.radius + 1) };
          const spawned = this.projectiles.spawn({ ownerId: owner.id, abilityId: d.id, position, previousPosition: { ...position },
            velocity: { x: direction.x * d.effect.speed, y: direction.y * d.effect.speed }, radius: d.effect.radius, damage,
            ...(count>1?{hitGroup:`${owner.id}:${d.id}:${r.casts}`} : {}),
            pierce:d.effect.pierce,reflection:d.effect.reflection, spawnedTick: tick, expiresTick: tick + d.effect.lifetimeTicks });
          this.emit({ ...base, point: position, kind: spawned ? 'projectile' : 'miss', reason: spawned ? undefined : 'capacity' });
        }
      }
    }
    // Explicit player commands get priority over automatic activation this tick.
    for (const r of this.runtimes) if(r.meter&&r.definition.ultimate?.resource==='ink-strokes') r.meter.value=r.pendingInk?0:this.ink.count(r.ownerId);
    const activated = new Set<string>();
    for (const r of [...this.runtimes].sort((a, b) => Number(!!b.meter) - Number(!!a.meter) || Number(b.queued) - Number(a.queued))) {
      const manual = r.queued; r.queued = false;
      const owner = living.get(r.ownerId);
      if (!owner || this.automatons.hasWarrior(owner.id) || (r.meter && (this.retrace.hasUltimate(owner.id)||this.thorns.hasOwner(owner.id)||this.wind.hasOwner(owner.id))) || this.cannons.hasOwner(owner.id) || this.formBlocked.has(owner.id) || locked.has(owner.id) || (!manual && !this.setup.autoCast && r.empoweredAt === null && r.definition.ultimate?.resource !== 'ink-strokes' && r.definition.ultimate?.resource !== 'attached-summons' && r.definition.ultimate?.resource !== 'status-stacks')) continue;
      const reject = (reason: string) => { if (manual) this.emit({ tick, ownerId: r.ownerId, abilityId: r.definition.id, kind: 'rejected', point: owner.position, reason }); };
      if (r.casting || this.scribe.hasOwner(r.ownerId) || this.fox.hasOwner(r.ownerId) || this.bell.hasOwner(r.ownerId) || this.beams.hasOwner(r.ownerId) || this.go.hasBoard(r.ownerId) || this.sweeps.hasOwner(r.ownerId) || this.returningWeapons.hasFlight(r.ownerId) || this.returningWeapons.hasGuard(r.ownerId) || this.chainUltimateRemaining(r.ownerId,tick)>0 || this.spear.hasOwner(r.ownerId) || this.flurries.hasOwner(r.ownerId) || activated.has(r.ownerId) || this.runtimes.some(other => other.ownerId === r.ownerId && (other.sequence || (other !== r && (other.casting || (other.empoweredAt !== null && tick < other.empoweredAt)))))) {
        if (manual && r.definition.range === 0) r.queued = true;
        else reject('busy');
        continue;
      }
      if (tick < r.readyAt) { reject('cooldown'); continue; }
      if(this.gates.hasOwner(owner.id)){reject('busy');continue;}
      if(r.definition.effect.kind==='masks-shift'||r.definition.effect.kind==='masks-awaken'){
        if(this.masks.busy(owner.id)){reject('busy');continue;}
        if(r.definition.effect.kind==='masks-awaken'){
          if(this.masks.awaken(tick,owner,this.emit)){r.meter?.clear();r.casts++;r.readyAt=tick+r.definition.cooldownTicks;activated.add(owner.id);}else reject('not-charged');
        }else{
          if(r.basicCharge&&!r.basicCharge.canActivate(tick)){reject('not-charged');continue;}
          const target=this.masks.target(owner,bodies);
          if(!target){reject('out-of-range');continue;}
          if(this.masks.start(tick,owner,target,multipliers.get(owner.id)??1))activated.add(owner.id);
        }
        continue;
      }
      if(r.definition.effect.kind==='gates-punch'||r.definition.effect.kind==='gates-combo'){
        const ultimate=!!r.meter,count=this.gates.count(owner.id);
        if(ultimate&&count<(manual?1:8)){reject('not-charged');continue;}
        if(r.basicCharge&&!r.basicCharge.canActivate(tick)){reject('not-charged');continue;}
        const target=this.gates.target(owner,bodies,ultimate);
        if(!target){reject('out-of-range');continue;}
        if(this.gates.start(tick,owner,target,r.definition,multipliers.get(owner.id)??1,this.emit)){
          r.basicCharge?.consume(tick);r.meter?.clear();r.casts++;r.readyAt=tick+r.definition.cooldownTicks;activated.add(owner.id);
        }
        continue;
      }
      if (r.basicCharge && !r.basicCharge.canActivate(tick)) { reject('not-charged'); continue; }
      if (!r.meter && r.definition.effect.kind === 'summon' && !this.summons.canSpawn(owner.id, r.definition.effect.summon)) { reject('summon-active'); continue; }
      if(r.definition.effect.kind==='lantern'&&this.lantern.hasLamp(owner.id)){reject('lantern-active');continue;}
      if(r.definition.effect.kind==='crystal-array'&&this.crystals.hasOwner(owner.id)){reject('crystal-active');continue;}
      if(r.definition.effect.kind==='dream-wave'&&this.dreams.hasOwner(owner.id)){reject('dream-active');continue;}
      if(r.definition.effect.kind==='feather-recall'&&this.feathers.hasUltimate(owner.id)){reject('feathers-active');continue;}
      if(r.definition.effect.kind==='soul-release'&&this.lantern.hasUltimate(owner.id)){reject('souls-active');continue;}
      if(r.definition.effect.kind==='time-rewind'&&this.time.hasOwner(owner.id)){reject('rewind-active');continue;}
      if(r.definition.effect.kind==='portal'&&this.portals.hasOwner(owner.id,!!r.meter)){reject('portal-active');continue;}
      if (r.definition.effect.kind === 'decoy' && this.decoys.hasOwner(owner.id)) { reject('decoy-active'); continue; }
      if (r.definition.effect.kind === 'ink-stroke' && this.ink.count(owner.id)>=3) { reject('ink-full'); continue; }
      // Only real impulses involving this owner can qualify; never retain proximity or geometry.
      const contact = contacts.find(c => c.impulseApplied && c.impactSpeed > 0 &&
        (c.bodyId === owner.id || c.otherId === owner.id) && c.bodyId !== c.otherId &&
        living.has(c.bodyId === owner.id ? c.otherId : c.bodyId));
      const contactTarget = contact ? (contact.bodyId === owner.id ? contact.otherId : contact.bodyId) : null;
      if (r.pendingImpactTarget && !living.has(r.pendingImpactTarget)) r.pendingImpactTarget = null;
      if (r.meter && r.empoweredAt === null) {
        const beamTarget=(r.definition.effect.kind==='beam'||r.definition.effect.kind==='fox-hunt'||r.definition.effect.kind==='script-return')?abilityTarget(owner,bodies,r.definition.range):undefined;
        if((r.definition.effect.kind==='beam'||r.definition.effect.kind==='fox-hunt')&&!beamTarget)continue;
        const boardTarget=r.definition.effect.kind==='go-board'?abilityTarget(owner,bodies,r.definition.range):undefined;
        if(r.definition.effect.kind==='go-board'&&!boardTarget)continue;
        const shotTarget=r.definition.effect.kind==='projectile'?abilityTarget(owner,bodies,r.definition.range):undefined;
        if(r.definition.effect.kind==='projectile'&&!shotTarget)continue;
        const hookTarget=r.definition.effect.kind==='hook'?abilityTarget(owner,bodies,r.definition.range):undefined;
        if(r.definition.effect.kind==='hook'&&!hookTarget)continue;
        const spearTarget=(r.definition.effect.kind==='thrust'||r.definition.effect.kind==='sweep')?abilityTarget(owner,bodies,r.definition.range):undefined;
        if((r.definition.effect.kind==='thrust'||r.definition.effect.kind==='sweep')&&!spearTarget)continue;
        const inkTarget = r.definition.ultimate?.resource==='ink-strokes' ? abilityTarget(owner,bodies,r.definition.range) : undefined;
        if(r.definition.ultimate?.resource==='ink-strokes'&&!inkTarget)continue;
        if (r.definition.ultimate?.activation === 'impact' && !contactTarget) { if (manual) r.queued = true; continue; }
        if (r.definition.ultimate?.resource==='status-stacks' && (!r.statusTarget||!living.has(r.statusTarget))) continue;
        if(r.definition.effect.kind==='script-return'&&this.scribe.memory(owner.id)?.mode==='melee'&&!abilityTarget(owner,bodies,3))continue;
        if (!r.meter.consume(tick)) { reject('not-charged'); continue; }
        if(r.definition.effect.kind==='script-return')r.pendingScript=this.scribe.reserve(owner.id);
        if(beamTarget)r.pendingThrust={targetId:beamTarget.id,aim:{x:1,y:0}};
        if(boardTarget)r.pendingThrust={targetId:boardTarget.id,aim:{x:1,y:0}};
        if(shotTarget&&r.definition.effect.kind==='projectile')r.pendingShot={targetId:shotTarget.id,aim:projectileAim(owner,shotTarget,arena,r.definition.effect.speed,r.definition.effect.radius,r.definition.effect.lifetimeTicks/60,r.definition.effect.maxLeadSeconds)};
        if(hookTarget&&r.definition.effect.kind==='hook')r.pendingHook=projectileAim(owner,hookTarget,arena,r.definition.effect.speed,r.definition.effect.radius,r.definition.effect.lifetimeTicks/60,.25);
        if(spearTarget) {
          const dx=spearTarget.position.x-owner.position.x,dy=spearTarget.position.y-owner.position.y,len=Math.hypot(dx,dy);
          r.pendingThrust={targetId:spearTarget.id,aim:len>1e-6?{x:dx/len,y:dy/len}:{x:1,y:0}};
        }
        if(inkTarget)r.pendingInk={strokes:this.ink.consume(owner.id),target:{x:inkTarget.position.x+inkTarget.velocity.x*.2,y:inkTarget.position.y+inkTarget.velocity.y*.2}};
        if (r.definition.ultimate?.resource === 'attached-summons') r.pendingDetonation = this.summons.consumeAttached(owner.id);
        r.empoweredAt = tick + r.definition.ultimate!.windupTicks;
        r.expiresAt = r.empoweredAt + r.definition.ultimate!.armedTicks;
        // The charge-completing collision belongs to this cast, even though its damage is delayed.
        r.pendingImpactTarget = r.definition.ultimate?.resource==='status-stacks' ? r.statusTarget! : contactTarget;
        if (r.definition.ultimate?.resource==='status-stacks') this.statusConsumptions.push({sourceId:r.ownerId,targetId:r.statusTarget!,statusId:r.definition.ultimate.statusId!});
        activated.add(owner.id);
        this.emit({ tick, ownerId: owner.id, abilityId: r.definition.id, kind: 'cast', point: owner.position,
          ...(r.pendingShot?{end:{x:owner.position.x+r.pendingShot.aim.x*600,y:owner.position.y+r.pendingShot.aim.y*600}}:r.pendingThrust?{end:{x:owner.position.x+r.pendingThrust.aim.x,y:owner.position.y+r.pendingThrust.aim.y}}:r.pendingHook?{end:{x:owner.position.x+r.pendingHook.x,y:owner.position.y+r.pendingHook.y}}:{}) });
        continue;
      }
      if (r.empoweredAt !== null && tick < r.empoweredAt) {
        r.pendingImpactTarget ??= contactTarget;
        continue;
      }
      if(r.definition.effect.kind==='portal'&&r.empoweredAt!==null){
        const target=abilityTarget(owner,bodies,r.definition.range);
        if(target)this.portals.start(tick,owner,target,r.definition,multipliers.get(owner.id)??1,arena,bodies,this.emit);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='time-rewind'&&r.empoweredAt!==null){
        this.time.start(tick,owner,r.definition,multipliers.get(owner.id)??1);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='cannon-salvo'&&r.empoweredAt!==null){
        this.cannons.start(tick,owner,r.definition,multipliers.get(owner.id)??1);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='wind-storm'&&r.empoweredAt!==null){
        this.wind.startStorm(tick,owner,r.definition,multipliers.get(owner.id)??1,arena);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='automaton-awaken'&&r.empoweredAt!==null){
        const basic=this.runtimes.find(b=>b.ownerId===owner.id&&b.definition.effect.kind==='automaton-command')?.definition;
        if(basic)this.automatons.awaken(tick,owner,r.definition,basic,multipliers.get(owner.id)??1,arena);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='retrace-return'&&r.empoweredAt!==null){
        this.retrace.start(tick,owner,r.definition,multipliers.get(owner.id)??1);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='thorn-garden'&&r.empoweredAt!==null){
        const basic=this.runtimes.find(b=>b.ownerId===owner.id&&b.definition.effect.kind==='thorn-plant')?.definition;
        if(basic)this.thorns.startGarden(tick,owner,abilityTarget(owner,bodies,r.definition.range),r.definition,basic,multipliers.get(owner.id)??1,arena,this.emit);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='crystal-array'&&r.empoweredAt!==null){
        const target=abilityTarget(owner,bodies,r.definition.range);
        if(target)this.crystals.start(tick,owner,target,r.definition,multipliers.get(owner.id)??1,arena);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='dream-wave'&&r.empoweredAt!==null){
        this.dreams.start(tick,owner,r.definition,multipliers.get(owner.id)??1,arena);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='feather-recall'&&r.empoweredAt!==null){
        this.feathers.start(tick,owner,r.definition,multipliers.get(owner.id)??1,arena);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='soul-release'&&r.empoweredAt!==null){
        this.lantern.startUltimate(tick,owner,r.definition,multipliers.get(owner.id)??1);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='script-return'&&r.empoweredAt!==null){
        const target=bodies.find(b=>b.id===r.pendingThrust?.targetId)??abilityTarget(owner,bodies,r.definition.range);
        if(target)this.scribe.start(tick,owner,target,r.definition,multipliers.get(owner.id)??1,r.pendingScript);
        r.pendingScript=undefined;r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='fox-hunt'&&r.empoweredAt!==null){
        const target=bodies.find(b=>b.id===r.pendingThrust?.targetId)??abilityTarget(owner,bodies,r.definition.range);
        if(target)this.fox.start(tick,owner,target,r.definition,multipliers.get(owner.id)??1);
        r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='bell'&&r.empoweredAt!==null){
        this.bell.start(tick,owner,r.definition,multipliers.get(owner.id)??1,arena,this.emit);
        r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='beam'&&r.empoweredAt!==null){
        const target=bodies.find(b=>b.id===r.pendingThrust?.targetId);
        if(target)this.beams.start(tick,owner,target,r.definition,multipliers.get(owner.id)??1,arena);
        r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='go-board'&&r.empoweredAt!==null){
        const target=bodies.find(b=>b.id===r.pendingThrust?.targetId)??abilityTarget(owner,bodies,r.definition.range);
        if(target)this.go.startBoard(tick,owner,target,r.definition,multipliers.get(owner.id)??1,arena);
        r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;continue;
      }
      if(r.definition.effect.kind==='guard-burst'&&r.empoweredAt!==null) {
        this.returningWeapons.startGuard(tick,owner.id,r.definition,multipliers.get(owner.id)??1);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;
        continue;
      }
      if(r.definition.effect.kind==='hook'&&r.empoweredAt!==null&&r.pendingHook) {
        this.chains.releaseOwner(owner.id);
        this.projectiles.removeAbilities(owner.id,new Set(this.runtimes.filter(other=>other.ownerId===owner.id&&other.definition.effect.kind==='hook').map(other=>other.definition.id)));
        this.launchHooks(tick,owner,r.definition,r.pendingHook,r.definition.effect.damage*(multipliers.get(owner.id)??1),r.casts);
        r.pendingHook=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;
        continue;
      }
      if(r.definition.effect.kind==='sweep'&&r.empoweredAt!==null&&r.pendingThrust){
        const e=r.definition.effect,p=r.pendingThrust,target=living.get(p.targetId),dash=e.dash!;
        if(target)p.aim=projectileAim(owner,target,arena,dash.speed,owner.radius,dash.durationTicks/60,.15);
        this.sweeps.start(tick,owner,p.aim,r.definition,multipliers.get(owner.id)??1,this.emit);
        this.motions.push({ownerId:owner.id,targetId:p.targetId,abilityId:r.definition.id,direction:p.aim,speed:dash.speed,durationTicks:dash.durationTicks,endOnCross:false});
        r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;
        continue;
      }
      if (r.definition.effect.kind==='thrust' && r.empoweredAt!==null && r.pendingThrust) {
        const e=r.definition.effect,pending=r.pendingThrust,l=e.lunge!;
        const target=living.get(pending.targetId);
        if(target)pending.aim=projectileAim(owner,target,arena,l.speed,e.radius,l.durationTicks/60,.18);
        this.spear.start(tick,owner.id,r.definition,pending.aim,multipliers.get(owner.id)??1);
        this.motions.push({ownerId:owner.id,targetId:pending.targetId,abilityId:r.definition.id,direction:pending.aim,speed:l.speed,durationTicks:l.durationTicks,endOnCross:false});
        this.emit({tick,ownerId:owner.id,abilityId:r.definition.id,kind:'thrust',point:owner.position,end:{x:owner.position.x+pending.aim.x*80,y:owner.position.y+pending.aim.y*80},reason:'spear-lunge'});
        r.pendingThrust=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;
        continue;
      }
      if(r.definition.effect.kind==='projectile' && r.empoweredAt!==null && r.pendingShot) {
        r.casting={...r.pendingShot,endsAt:tick+1,chargeMultiplier:1};
        r.pendingShot=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;
        continue;
      }
      if (r.definition.effect.kind==='projectile-sequence' && r.empoweredAt!==null) {
        const target=abilityTarget(owner,bodies,r.definition.range);
        if(!target)continue;
        const direction=projectileAim(owner,target,arena,r.definition.effect.speed,r.definition.effect.radius,r.definition.effect.lifetimeTicks/60,.15);
        r.sequence={index:0,nextTick:tick,angle:Math.atan2(direction.y,direction.x),damageMultiplier:multipliers.get(owner.id)??1};
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;
        continue;
      }
      if (r.definition.effect.kind==='ink-dragons' && r.empoweredAt!==null) {
        const e=r.definition.effect,pending=r.pendingInk;
        for(const s of pending?.strokes??[]) {
          const dx=pending!.target.x-s.position.x,dy=pending!.target.y-s.position.y,len=Math.hypot(dx,dy);
          const direction=len>1e-8?{x:dx/len,y:dy/len}:{x:Math.cos(s.angle),y:Math.sin(s.angle)};
          const spawned=this.projectiles.spawn({ownerId:owner.id,abilityId:r.definition.id,position:s.position,previousPosition:s.position,
            velocity:{x:direction.x*e.speed,y:direction.y*e.speed},radius:e.radius,damage:e.damage*(multipliers.get(owner.id)??1),spawnedTick:tick,expiresTick:tick+e.lifetimeTicks});
          this.emit({tick,ownerId:owner.id,abilityId:r.definition.id,kind:spawned?'projectile':'miss',point:s.position,reason:spawned?undefined:'capacity'});
        }
        r.pendingInk=undefined;r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;
        continue;
      }
      if (r.definition.effect.kind === 'status-burst' && r.empoweredAt !== null) {
        const target=r.pendingImpactTarget ? living.get(r.pendingImpactTarget) : undefined;
        if (target) {
          requests.push({tick,targetId:target.id,amount:r.definition.effect.damage*(multipliers.get(owner.id)??1),source:{kind:'melee',attackerId:owner.id,abilityId:r.definition.id}});
          this.emit({tick,ownerId:owner.id,abilityId:r.definition.id,targetId:target.id,kind:'hit',point:target.position});
        } else this.emit({tick,ownerId:owner.id,abilityId:r.definition.id,kind:'miss',point:owner.position,reason:'target-defeated'});
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);r.empoweredAt=null;r.pendingImpactTarget=null;
        continue;
      }
      if (r.definition.effect.kind === 'impact-form' && r.empoweredAt !== null) {
        this.forms.start(tick,owner.id,r.definition.id,r.definition.effect,multipliers.get(owner.id)??1);
        if(r.definition.selfStatus)this.selfStatuses.push({ownerId:owner.id,abilityId:r.definition.id,definition:r.definition.selfStatus});
        this.formBlocked.add(owner.id);
        for (const basic of this.runtimes.filter(b=>b.ownerId===owner.id && b.definition.basicCharge?.mode==='distance')) { basic.basicCharge?.consume(tick); basic.boostUntil=0; basic.defenseUntil=0; }
        r.readyAt=tick+r.definition.cooldownTicks; r.casts++; activated.add(owner.id); r.empoweredAt=null; r.pendingImpactTarget=null;
        continue;
      }
      if (r.definition.effect.kind === 'summon' && r.empoweredAt !== null) {
        const effect = r.definition.effect;
        if (effect.detonation) {
          const attached = r.pendingDetonation ?? [];
          const targets = new Map<string, typeof attached>();
          for (const spirit of attached) targets.set(spirit.targetId, [...(targets.get(spirit.targetId) ?? []), spirit]);
          for (const [targetId, spirits] of targets) {
            const target = living.get(targetId);
            if (!target) continue;
            requests.push({ tick, targetId, amount: effect.damage * spirits.length / r.definition.ultimate!.maxCharge * (multipliers.get(owner.id) ?? 1),
              source: { kind: 'summon', attackerId: owner.id, abilityId: r.definition.id, summonId: spirits[0]!.summonId } });
            this.emit({ tick, ownerId: owner.id, abilityId: r.definition.id, kind: 'summon-pulse', targetId, point: target.position });
            this.emit({ tick, ownerId: owner.id, abilityId: r.definition.id, kind: 'hit', targetId, point: target.position });
          }
          r.pendingDetonation = undefined; r.meter?.clear(); r.readyAt = tick + r.definition.cooldownTicks;
          r.casts++; activated.add(owner.id); r.empoweredAt = null; r.pendingImpactTarget = null;
          continue;
        }
        const basic = this.runtimes.find(other => other.ownerId === owner.id && !other.meter && other.definition.effect.kind === 'summon');
        const spawned = this.summons.spawn(tick, owner, r.definition.id, effect.summon, effect.damage * (multipliers.get(owner.id) ?? 1), arena, effect.empowerment, basic?.definition.id);
        r.readyAt = tick + r.definition.cooldownTicks; r.casts++; activated.add(owner.id);
        r.empoweredAt = null; r.pendingImpactTarget = null;
        this.emit({ tick, ownerId: owner.id, abilityId: r.definition.id, kind: spawned ? 'summon' : 'miss', point: owner.position, reason: spawned ? undefined : 'capacity' });
        continue;
      }
      if (r.definition.effect.kind === 'zone' && r.empoweredAt !== null) {
        const target = abilityTarget(owner, targets, r.definition.range);
        if (!target) continue;
        this.placeZone(tick, owner, target, r.definition, r.definition.effect.damage * (multipliers.get(owner.id) ?? 1), arena, r.casts);
        r.readyAt = tick + r.definition.cooldownTicks; r.casts++; activated.add(owner.id);
        r.empoweredAt = null; r.pendingImpactTarget = null;
        continue;
      }
      if (r.definition.effect.kind === 'area' && r.empoweredAt !== null) {
        const effect = r.definition.effect;
        const spawned = this.areas.spawn({ ownerId: owner.id, abilityId: r.definition.id, position: owner.position,
          maxRadius: effect.radius, damage: effect.damage * (multipliers.get(owner.id) ?? 1), spawnedTick: tick, expiresTick: tick + effect.durationTicks });
        r.readyAt = tick + r.definition.cooldownTicks; r.casts++; activated.add(owner.id);
        r.empoweredAt = null; r.pendingImpactTarget = null;
        this.emit({ tick, ownerId: owner.id, abilityId: r.definition.id, kind: spawned ? 'area' : 'miss', point: owner.position, reason: spawned ? undefined : 'capacity' });
        continue;
      }
      if (r.definition.range === 0) {
        const storedTarget = r.meter && r.pendingImpactTarget ? living.get(r.pendingImpactTarget) : undefined;
        const targetId = storedTarget?.id ?? contactTarget;
        if (!targetId) { if (manual) r.queued = true; continue; }
        // Draw a delayed, confirmed impact at the living target, not at an obsolete collision point.
        const point = storedTarget ? storedTarget.position : contact!.point;
        r.readyAt = tick + r.definition.cooldownTicks; r.casts++; activated.add(owner.id);
        r.empoweredAt = null;
        r.pendingImpactTarget = null;
        if (r.definition.effect.kind === 'flurry') {
          const target = living.get(targetId)!;
          this.flurries.spawn(tick, owner.id, r.definition.id, target, r.definition.effect, multipliers.get(owner.id) ?? 1);
          continue;
        }
        this.emit({ tick, ownerId: owner.id, abilityId: r.definition.id, targetId, kind: 'melee', point, end: point });
        if (r.definition.basicCharge?.mode==='distance') r.distanceCast={tick,full:r.basicCharge!.stacks(tick)===r.definition.basicCharge.maxStacks};
        requests.push({ tick, source: { kind: 'melee', attackerId: owner.id, abilityId: r.definition.id }, targetId,
          amount: r.definition.effect.damage * (r.basicCharge?.consume(tick) ?? 1) * (multipliers.get(owner.id) ?? 1) });
        if (r.definition.effect.kind === 'dash') this.motions.push({ ownerId: owner.id, targetId, abilityId: r.definition.id, speed: r.definition.effect.speed, durationTicks: r.definition.effect.durationTicks });
        if (!r.meter && r.definition.effect.kind !== 'go-stone') this.signal(owner.id, 'basic-cast', tick);
        continue;
      }
      const target = abilityTarget(owner, targets, r.definition.range);
      if (!target) { reject('out-of-range'); continue; }
      if(r.definition.effect.kind==='bell'){
        this.bell.start(tick,owner,r.definition,multipliers.get(owner.id)??1,arena,this.emit);r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);
        this.emit({tick,ownerId:owner.id,abilityId:r.definition.id,kind:'cast',targetId:target.id,point:{...owner.position}});continue;
      }
      if(r.definition.effect.kind==='beam'){
        this.beams.start(tick,owner,target,r.definition,(r.basicCharge?.consume(tick)??1)*(multipliers.get(owner.id)??1),arena);
        r.readyAt=tick+r.definition.cooldownTicks;r.casts++;activated.add(owner.id);
        this.emit({tick,ownerId:owner.id,abilityId:r.definition.id,targetId:target.id,kind:'cast',point:{...owner.position},end:{...target.position}});continue;
      }
      const dx = target.position.x - owner.position.x, dy = target.position.y - owner.position.y;
      const length = Math.hypot(dx, dy);
      r.casting = { targetId: target.id, endsAt: tick + r.definition.castTicks, aim: length > 1e-8 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 }, chargeMultiplier: r.basicCharge?.consume(tick) ?? 1 };
      if(r.definition.effect.kind==='ink-stroke')r.casting.inkPoint={x:target.position.x+target.velocity.x*.12,y:target.position.y+target.velocity.y*.12};
      r.readyAt = tick + r.definition.cooldownTicks; r.casts++;
      activated.add(owner.id);
      if (!r.meter && r.definition.effect.kind !== 'go-stone') this.signal(owner.id, 'basic-cast', tick);
      this.emit({ tick, ownerId: r.ownerId, abilityId: r.definition.id, targetId: target.id, kind: 'cast', point: owner.position, end: target.position });
    }
    requests.push(...this.automatons.step(tick,dt,arena,[...bodies,...this.summons.targets(),...this.automatons.targets(),...this.decoys.targets()],locked,this.emit,p=>this.projectiles.spawn(p)));
    const allTargets = [...bodies, ...this.summons.targets(), ...this.automatons.targets(), ...this.decoys.targets()];
    requests.push(...this.masks.step(tick,arena,allTargets,locked,hostImpacts,this.emit,p=>this.projectiles.spawn(p),id=>{
      const r=this.runtimes.find(r=>r.ownerId===id&&r.definition.effect.kind==='masks-shift');
      if(r){r.basicCharge?.consume(tick);r.casts++;r.readyAt=tick+r.definition.cooldownTicks;}
    }));
    for(const r of this.runtimes) {
      const s=r.sequence,e=r.definition.effect,owner=bodies.find(b=>b.id===r.ownerId);
      if(!s || e.kind!=='projectile-sequence' || !owner)continue;
      if(locked.has(owner.id)){s.nextTick=Math.max(s.nextTick,tick+1);continue;}
      if(tick<s.nextTick)continue;
      const last=s.index===e.angles.length-1,angle=s.angle+e.angles[s.index]!*Math.PI/180;
      const point={...owner.position};
      const spawned=this.projectiles.spawn({ownerId:owner.id,abilityId:r.definition.id,position:point,previousPosition:point,
        velocity:{x:Math.cos(angle)*e.speed,y:Math.sin(angle)*e.speed},radius:last?e.finisherRadius:e.radius,
        damage:e.damage*s.damageMultiplier*(last?e.finisherMultiplier:1),reflection:last?(e.finisherReflection??e.reflection):e.reflection,visualScale:last?1.4:1,
        spawnedTick:tick,expiresTick:tick+(last?(e.finisherLifetimeTicks??e.lifetimeTicks):e.lifetimeTicks)});
      this.emit({tick,ownerId:owner.id,abilityId:r.definition.id,kind:spawned?'projectile':'miss',point,reason:spawned?(last?'final-note':`note-${s.index+1}`):'capacity'});
      s.index++;s.nextTick=tick+e.intervalTicks;
      if(s.index>=e.angles.length){r.sequence=undefined;r.readyAt=tick+r.definition.cooldownTicks;}
    }
    const portalStep=this.portals.step(tick,bodies);requests.push(...portalStep.requests);this.motions.push(...portalStep.motions);
    for(const shot of this.lantern.step(tick,arena,allTargets,locked,this.emit))this.projectiles.spawn(shot);
    requests.push(...this.time.step(tick,bodies,locked,this.emit));
    for(const shot of portalStep.shots)this.projectiles.spawn(shot);
    this.decoys.targets().forEach(t=>decoyIds.add(t.id));
    requests.push(...this.wind.step(tick,arena,allTargets,locked,this.emit));
    requests.push(...this.retrace.step(tick,allTargets,locked,this.emit).filter(r=>!this.interceptDecoy(tick,r)));
    requests.push(...this.gates.step(tick,arena,bodies,locked,this.emit));
    requests.push(...this.thorns.step(tick,allTargets,locked,hostImpacts,this.emit));
    const windFields=this.windFields(tick,bodies,locked);
    for(const system of [this.projectiles,this.cannons,this.crystals,this.dreams,this.feathers,this.scribe])system.setWindFields(windFields);
    requests.push(...this.projectiles.step(tick, dt, arena, allTargets, this.emit, r => this.interceptDecoy(tick,r),(p,start,end)=>this.portals.projectileTransit(tick,p,start,end,arena,allTargets,this.emit),(p,start,end)=>this.lantern.capture(tick,p,start,end,locked,this.emit)));
    requests.push(...this.cannons.step(tick,dt,arena,allTargets,locked,this.emit,r=>this.interceptDecoy(tick,r),(p,a,b)=>this.portals.projectileTransit(tick,p,a,b,arena,allTargets,this.emit),(p,a,b)=>this.lantern.capture(tick,p,a,b,locked,this.emit)));
    this.knockbacks.push(...this.cannons.takeRecoil());
    requests.push(...this.crystals.step(tick,dt,arena,allTargets,locked,this.emit,r=>this.interceptDecoy(tick,r),(p,a,b)=>this.portals.projectileTransit(tick,p,a,b,arena,allTargets,this.emit),(p,a,b)=>this.lantern.capture(tick,p,a,b,locked,this.emit)));
    requests.push(...this.dreams.step(tick,dt,arena,allTargets,locked,this.emit,r=>this.interceptDecoy(tick,r),(p,a,b)=>this.portals.projectileTransit(tick,p,a,b,arena,allTargets,this.emit),(p,a,b)=>this.lantern.capture(tick,p,a,b,locked,this.emit)));
    requests.push(...this.feathers.step(tick,dt,arena,allTargets,locked,this.emit,r=>this.interceptDecoy(tick,r),(p,a,b)=>this.portals.projectileTransit(tick,p,a,b,arena,allTargets,this.emit),(p,a,b)=>this.lantern.capture(tick,p,a,b,locked,this.emit)));
    requests.push(...this.areas.step(tick, allTargets, this.emit));
    requests.push(...this.go.step(tick,dt,arena,allTargets,locked,e=>{this.emit(e);if(e.reason==='go-land')this.signal(e.ownerId,'basic-cast',tick);}));
    requests.push(...this.scribe.step(tick,dt,arena,allTargets,locked,this.emit,(p,start,end)=>this.lantern.capture(tick,p,start,end,locked,this.emit)));
    const foxStep=this.fox.step(tick,arena,targets,locked,this.emit);requests.push(...foxStep.requests);this.motions.push(...foxStep.motions);
    requests.push(...this.bell.step(tick,arena,allTargets,locked,this.emit));
    requests.push(...this.beams.step(tick,arena,allTargets,locked,this.emit));
    requests.push(...this.sweeps.step(tick,arena,allTargets,locked,hostImpacts,this.emit));
    requests.push(...this.zones.step(tick, allTargets, this.emit));
    requests.push(...this.flurries.step(tick, [...bodies, ...this.decoys.targets()], this.emit));
    return requests.filter(r => { if (!decoyIds.has(r.targetId)) return true; if (r.amount > 0) this.interceptDecoy(tick,r); return false; });
  }
  afterCombat(tick: number, living: ReadonlySet<string>, finished: boolean, auxiliaryStates: readonly CombatantState[] = []) {
    this.wind.cleanup(living,finished);
    this.retrace.cleanup(living,finished);
    this.gates.cleanup(living,finished);
    this.masks.cleanup(living,finished);
    this.thorns.cleanup(living,finished);
    this.cannons.cleanup(living,finished);
    this.crystals.cleanup(living,finished);
    this.dreams.cleanup(living,finished);
    this.feathers.cleanup(living,finished);
    this.lantern.cleanup(living,finished);
    this.time.cleanup(living,finished);
    this.portals.cleanup(living,finished);
    this.threads.cleanup(living,finished);
    this.scribe.cleanup(living,finished);
    this.fox.cleanup(living,finished);
    this.bell.cleanup(living,finished);
    this.beams.cleanup(living,finished);
    this.go.cleanup(living,finished);
    this.sweeps.cleanup(living,finished);
    this.returningWeapons.cleanup(living,finished);
    this.ink.cleanup(living,finished);
    this.decoys.cleanup(living,finished);
    this.forms.cleanup(tick,living,finished);
    this.wallSlams.cleanup(tick, living, finished);
    this.knockbacks = this.knockbacks.filter(r => !finished && living.has(r.ownerId) && living.has(r.targetId));
    this.flurries.cleanup(living, finished);
    this.motions = this.motions.filter(m => !finished && living.has(m.ownerId) && living.has(m.targetId));
    this.summons.afterCombat(auxiliaryStates, living, finished);
    this.automatons.afterCombat(auxiliaryStates,living,finished);
    this.spear.cleanup(living,finished);
    this.chains.cleanup(living,finished);
    for (const r of this.runtimes) {
      r.dead = !living.has(r.ownerId);
      if(r.meter&&r.definition.ultimate?.resource==='ink-strokes')r.meter.value=r.pendingInk?0:this.ink.count(r.ownerId);
      if (r.meter && r.definition.ultimate?.resource === 'attached-summons') r.meter.value = r.pendingDetonation?.length ?? this.summons.attachedCount(r.ownerId);
      if (r.pendingImpactTarget && !living.has(r.pendingImpactTarget)) r.pendingImpactTarget = null;
      if (r.dead || finished) {
        if (r.casting || r.empoweredAt !== null) this.emit({ tick, ownerId: r.ownerId, abilityId: r.definition.id, kind: 'cancelled', point: { x: 0, y: 0 }, reason: r.dead ? 'owner-defeated' : 'match-finished' });
        r.casting = null; r.queued = false;
        r.empoweredAt = null;
        r.pendingImpactTarget = null;
        r.pendingDetonation = undefined;
        r.pendingInk = undefined;
        r.pendingThrust = undefined;
        r.pendingHook = undefined;
        r.sequence = undefined;
        r.distanceCast = undefined; r.boostUntil=0; r.defenseUntil=0;
        r.meter?.clear();
        r.basicCharge?.clear();
      }
    }
    this.projectiles.removeOwners(living);
    this.areas.removeOwners(living);
    this.zones.removeOwners(living);
    if (finished) this.zones.clear();
    if (finished) this.areas.clear();
    if (finished) this.projectiles.clear();
  }
  snapshot(tick: number): AbilitySnapshot {
    return { ...this.masks.snapshot(), gates:this.gates.snapshot(), automatons:this.automatons.snapshot(), ...this.retrace.snapshot(), ...this.thorns.snapshot(), windStorms:this.wind.snapshot(), ...this.crystals.snapshot(), ...this.dreams.snapshot(), ...this.feathers.snapshot(), ...this.lantern.snapshot(), ...this.time.snapshot(), portals:this.portals.snapshot(), ...this.threads.snapshot(),...this.scribe.snapshot(),...this.fox.snapshot(),...this.bell.snapshot(), beams:this.beams.snapshot(), ...this.go.snapshot(), returningWeapons:this.returningWeapons.snapshot(), guards:this.returningWeapons.guardSnapshot(), chains:this.chains.snapshot(), inkStrokes: [...this.ink.snapshot(),...this.runtimes.flatMap(r=>(r.pendingInk?.strokes??[]).map(s=>({...structuredClone(s),expiresTick:(r.empoweredAt??tick)+1})))], decoys: this.decoys.snapshot(), definitions: structuredClone(this.setup.definitions), autoCast: this.setup.autoCast, flurries: this.flurries.snapshot(), summons: this.summons.snapshot(), projectiles: [...this.projectiles.snapshot(),...this.scribe.projectileSnapshot(),...this.feathers.projectileSnapshot(),...this.dreams.projectileSnapshot(),...this.crystals.projectileSnapshot(),...this.cannons.projectileSnapshot()], areas: this.areas.snapshot(), zones: this.zones.snapshot(), events: structuredClone(this.events),
      runtimes: this.runtimes.map(r => ({ ownerId: r.ownerId, abilityId: r.definition.id, casts: r.casts, queued: r.queued,
        ...(r.definition.effect.kind==='bell'&&!r.meter?{basicStacks:this.bell.count(r.ownerId),basicMaxStacks:3}:{}),
        ...(r.definition.effect.kind==='bell'&&r.meter&&this.bell.hasOwner(r.ownerId)?{activeTicksRemaining:this.bell.remaining(r.ownerId,tick)}:{}),
        ...(r.definition.effect.kind==='guard-burst'&&this.returningWeapons.hasGuard(r.ownerId)?{activeTicksRemaining:this.returningWeapons.guardRemaining(r.ownerId,tick)}:{}),
        ...(r.meter&&(r.definition.effect.kind==='hook'||(r.definition.effect.kind==='zone'&&r.definition.effect.collapseRadius!==undefined))&&this.chainUltimateRemaining(r.ownerId,tick)>0?{activeTicksRemaining:this.chainUltimateRemaining(r.ownerId,tick)}:{}),
        ...(r.meter && r.definition.effect.kind==='thrust' && this.spear.hasOwner(r.ownerId)?{activeTicksRemaining:this.spear.remaining(r.ownerId,tick)}:{}),
        ...(r.sequence && r.definition.effect.kind==='projectile-sequence' ? {activeTicksRemaining:Math.max(1,r.sequence.nextTick-tick+(r.definition.effect.angles.length-r.sequence.index-1)*r.definition.effect.intervalTicks)} : {}),
        ...(r.definition.effect.kind==='impact-form' && this.forms.snapshot(tick).some(f=>f.ownerId===r.ownerId&&f.abilityId===r.definition.id) ? {activeHitsRemaining:r.definition.effect.endCondition === 'duration' ? undefined : this.forms.snapshot(tick).find(f=>f.ownerId===r.ownerId)!.remaining,activeTicksRemaining:this.forms.snapshot(tick).find(f=>f.ownerId===r.ownerId)!.activeTicksRemaining} : {}),
        ...(r.definition.effect.kind==='fox-hunt'&&this.fox.hasOwner(r.ownerId)?{activeTicksRemaining:this.fox.remaining(r.ownerId,tick)}:{}),
        ...(r.definition.effect.kind==='script-return'?{recordedAbilityId:(r.pendingScript??this.scribe.memory(r.ownerId))?.abilityId,recordedMode:(r.pendingScript??this.scribe.memory(r.ownerId))?.mode,...(this.scribe.hasOwner(r.ownerId)?{activeTicksRemaining:this.scribe.remaining(r.ownerId,tick)}:{})}:{}),
        ...(r.definition.ultimate&&r.definition.effect.kind==='projectile'&&r.definition.effect.fateThread&&this.threads.hasOwner(r.ownerId)?{activeTicksRemaining:this.threads.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&r.definition.effect.kind==='feather-recall'&&this.feathers.hasUltimate(r.ownerId)?{activeTicksRemaining:this.feathers.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&r.definition.effect.kind==='soul-release'&&this.lantern.hasUltimate(r.ownerId)?{activeTicksRemaining:this.lantern.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&r.definition.effect.kind==='time-rewind'&&this.time.hasOwner(r.ownerId)?{activeTicksRemaining:this.time.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&r.definition.effect.kind==='portal'&&this.portals.hasOwner(r.ownerId,true)?{activeTicksRemaining:this.portals.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&this.dreams.hasOwner(r.ownerId)?{activeTicksRemaining:this.dreams.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&this.crystals.hasOwner(r.ownerId)?{activeTicksRemaining:this.crystals.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&this.automatons.hasWarrior(r.ownerId)?{activeTicksRemaining:this.automatons.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&this.retrace.hasUltimate(r.ownerId)?{activeTicksRemaining:this.retrace.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&this.thorns.hasOwner(r.ownerId)?{activeTicksRemaining:this.thorns.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&this.wind.hasOwner(r.ownerId)?{activeTicksRemaining:this.wind.remaining(r.ownerId,tick)}:{}),
        ...(r.meter&&this.cannons.hasOwner(r.ownerId)?{activeTicksRemaining:this.cannons.remaining(r.ownerId,tick)}:{}),
        status: r.dead ? 'defeated' : r.definition.effect.kind==='masks-awaken'?(this.masks.awakened(r.ownerId)?'active':this.masks.busy(r.ownerId)?'active':tick<r.readyAt?'cooldown':this.masks.charge(r.ownerId)>=6?'ready':'charging') : r.definition.effect.kind==='masks-shift'&&this.masks.busy(r.ownerId)?'active' : this.gates.hasOwner(r.ownerId)?'active' : r.definition.effect.kind==='gates-combo'&&tick>=r.readyAt?(this.gates.count(r.ownerId)>0?'ready':'charging') : this.automatons.hasWarrior(r.ownerId)?'active' : r.meter&&this.retrace.hasUltimate(r.ownerId)?'active' : r.meter&&this.thorns.hasOwner(r.ownerId)?'active' : r.meter&&this.wind.hasOwner(r.ownerId)?'active' : r.meter&&this.cannons.hasOwner(r.ownerId)?'active' : r.meter&&this.crystals.hasOwner(r.ownerId)?'active' : r.meter&&this.dreams.hasOwner(r.ownerId)?'active' : r.meter&&this.feathers.hasUltimate(r.ownerId)?'active' : r.meter&&this.lantern.hasUltimate(r.ownerId)||!r.meter&&r.definition.effect.kind==='lantern'&&this.lantern.hasLamp(r.ownerId)?'active' : r.meter&&this.time.hasOwner(r.ownerId)?'active' : r.definition.effect.kind==='portal'&&this.portals.hasOwner(r.ownerId,!!r.meter)?'active' : r.definition.ultimate&&r.definition.effect.kind==='projectile'&&r.definition.effect.fateThread&&this.threads.hasOwner(r.ownerId) ? 'active' : this.scribe.hasOwner(r.ownerId) ? 'active' : this.fox.hasOwner(r.ownerId) ? 'active' : this.bell.hasOwner(r.ownerId) ? 'active' : this.beams.state(r.ownerId,r.definition.id)?.phase==='charge' ? 'casting' : this.beams.state(r.ownerId,r.definition.id)?.phase==='fire' ? 'active' : this.go.hasBoard(r.ownerId) || this.sweeps.hasOwner(r.ownerId) || this.returningWeapons.hasGuard(r.ownerId) || (!r.meter && this.returningWeapons.hasFlight(r.ownerId)) || r.sequence || this.chainUltimateRemaining(r.ownerId,tick)>0 || this.spear.hasOwner(r.ownerId) || this.forms.hasOwner(r.ownerId) ? 'active' : r.casting || (r.empoweredAt !== null && tick < r.empoweredAt) ? 'casting' : r.empoweredAt !== null ? 'empowered' : this.flurries.hasOwner(r.ownerId) || (!r.meter && r.definition.effect.kind === 'summon' && !this.summons.canSpawn(r.ownerId, r.definition.effect.summon)) ? 'active' : tick < r.readyAt ? 'cooldown' : (r.meter && !r.meter.full) || (r.basicCharge && !r.basicCharge.canActivate(tick)) ? 'charging' : 'ready',
        ...(r.meter ? { charge: r.definition.effect.kind==='masks-awaken'?this.masks.charge(r.ownerId):r.definition.effect.kind==='gates-combo'?this.gates.count(r.ownerId):r.meter.value, maxCharge: r.definition.ultimate!.maxCharge, armedRemaining: r.empoweredAt !== null ? Math.max(0, r.expiresAt - tick) : 0 } : {}),
        ...(r.basicCharge ? { basicStacks: r.basicCharge.stacks(tick), basicMaxStacks: r.definition.basicCharge!.maxStacks,
          basicRechargeProgress: r.basicCharge.rechargeProgress(tick) } : {}),
        cooldownRemaining: Math.max(0, r.readyAt - tick), castRemaining: Math.max(0, (this.beams.state(r.ownerId,r.definition.id)?.releaseTick ?? r.casting?.endsAt ?? r.empoweredAt ?? tick) - tick) })) };
  }
}
