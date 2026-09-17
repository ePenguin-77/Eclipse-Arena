import { PHYSICS } from '../config/physics';
import type { ArenaDefinition, BodySnapshot, WorldSnapshot, PhysicsEvent } from '../contracts/types';
import type { CollisionImpact, CombatSetup, RecoveryProfile } from '../contracts/combat';
import { CombatWorld } from '../combat/combat-world';
import { AbilityWorld } from '../abilities/ability-world';
import type { AbilityContact, AbilitySetup } from '../contracts/abilities';
import type { BodySpawn } from '../physics/body';
import { PhysicsWorld } from '../physics/physics-world';
import { EventJournal } from './event-journal';
import { GameClock } from './game-clock';
import { CharacterRuntime } from '../characters/character-runtime';
import type { CharacterInstance } from '../contracts/characters';
import { StatusWorld } from '../combat/status-world';
import { PullWorld } from '../physics/pull-world';
import { mitigateContactDamage } from '../abilities/contact-defense';

export class SimulationWorld {
  private clock = new GameClock();
  private journal = new EventJournal();
  private physics: PhysicsWorld;
  private combat: CombatWorld | null;
  private abilities: AbilityWorld | null;
  private retired = new Map<string, BodySnapshot>();
  private bodyOrder: string[];
  private characters: CharacterRuntime[];
  private statuses = new StatusWorld();
  private pulls = new PullWorld();
  constructor(private readonly arena: Readonly<ArenaDefinition>, spawns: readonly BodySpawn[], private readonly seed: number, combatSetup?: CombatSetup, abilitySetup?: AbilitySetup, characterInstances: readonly CharacterInstance[] = []) {
    this.arena = structuredClone(arena);
    this.physics = new PhysicsWorld(arena, spawns);
    if (combatSetup && (combatSetup.combatants.length !== spawns.length || combatSetup.combatants.some(s => !spawns.some(b => b.id === s.id)))) throw new Error('Combat/physics entity mismatch');
    this.combat = combatSetup ? new CombatWorld(combatSetup) : null;
    if (abilitySetup && (!combatSetup || abilitySetup.loadouts.some(l => !spawns.some(b => b.id === l.ownerId)))) throw new Error('Ability setup requires matching combat entities');
    this.abilities = abilitySetup ? new AbilityWorld(abilitySetup) : null;
    this.bodyOrder = spawns.map(s => s.id);
    if (new Set(characterInstances.map(c => c.entityId)).size !== characterInstances.length || characterInstances.some(c => !this.bodyOrder.includes(c.entityId))) throw new Error('Character/physics entity mismatch');
    this.characters = characterInstances.map(c => new CharacterRuntime(c));
  }
  get finished() { return this.combat?.finished ?? false; }
  queueAbility(ownerId: string, abilityId: string) { if (!this.finished) this.abilities?.queue(ownerId, abilityId); }
  step() {
    if (this.finished) return;
    this.clock.advance();
    const impacts: CollisionImpact[] = [];
    const hostImpacts: Omit<PhysicsEvent, 'id'>[] = [];
    const abilityContacts: AbilityContact[] = [];
    const livingBefore = new Set(this.physics.snapshot().map(b => b.id));
    for (const a of this.abilities?.fieldApplications(this.clock.tick, this.physics.snapshot()) ?? [])
      this.statuses.apply(this.clock.tick, a.targetId, a.sourceId, a.abilityId, a.definition);
    const statusRequests = this.statuses.step(this.clock.tick, livingBefore);
    const modifiers = new Map([...livingBefore].map(id => [id, this.statuses.modifiers(id)]));
    this.physics.setMotionLocks(new Set([...modifiers].filter(([id, m]) => m.immobilized || this.abilities?.motionLocks().has(id)).map(([id]) => id)));
    const timeCombat=this.combat?.snapshot();
    this.abilities?.prepareTime(this.clock.tick,this.arena,this.physics.snapshot(),timeCombat?.combatants??[],timeCombat?.rules.damageScale??1,
      new Set([...modifiers].filter(([,m])=>m.abilityLocked).map(([id])=>id)),(id,point)=>this.physics.tryTeleport(id,point),
      (id,amount,ceiling)=>this.combat?.rewindHealth(this.clock.tick,id,amount*this.statuses.healingMultiplier(id),ceiling)??0);
    this.abilities?.preparePortals(this.clock.tick,this.arena,this.physics.snapshot(),
      new Set([...modifiers].filter(([,m])=>m.abilityLocked).map(([id])=>id)),(id,point)=>this.physics.tryTeleport(id,point));
    this.abilities?.prepareDecoys(this.clock.tick, this.physics.snapshot(),
      new Set([...modifiers].filter(([, m]) => m.abilityLocked).map(([id]) => id)), (id, point) => this.physics.tryTeleport(id, point));
    this.physics.setSpeedModifiers(new Map([...modifiers].map(([id, m]) => [id, m.speed * (this.abilities?.movementMultiplier(id,this.clock.tick)??1)])));
    this.physics.applyForces([...this.pulls.sample(this.clock.tick, this.physics.snapshot()),
      ...(this.abilities?.physicsForces(this.clock.tick,this.arena,this.physics.snapshot(),new Set([...modifiers].filter(([,m])=>m.abilityLocked).map(([id])=>id))) ?? [])], PHYSICS.fixedDt);
    const abilityLocked=new Set([...modifiers].filter(([,m])=>m.abilityLocked).map(([id])=>id));
    this.physics.applyVortices(this.abilities?.windFields(this.clock.tick,this.physics.snapshot(),abilityLocked)??[],PHYSICS.fixedDt);
    this.physics.cancelDashes(abilityLocked);
    this.physics.startDashes((this.abilities?.takeMotions() ?? []).filter(m=>!abilityLocked.has(m.ownerId)), this.clock.tick);
    this.physics.step(PHYSICS.fixedDt, this.clock.tick, event => {
      this.journal.record(event);
      if (event.type !== 'contact') hostImpacts.push(event);
      if (event.type === 'wall' && event.impulseApplied && event.impactSpeed > 0) this.abilities?.signal(event.bodyId, 'wall-impact', this.clock.tick);
    }, this.combat ? event => {
      hostImpacts.push(event);
      if (event.otherId) {
        impacts.push({ bodyId: event.bodyId, otherId: event.otherId, impactSpeed: event.impactSpeed, impulseApplied: event.impulseApplied });
        abilityContacts.push({ bodyId: event.bodyId, otherId: event.otherId, point: event.point, impactSpeed: event.impactSpeed, impulseApplied: event.impulseApplied });
        if (event.impulseApplied && event.impactSpeed > 0) for (const id of [event.bodyId, event.otherId]) this.abilities?.signal(id, 'character-impact', this.clock.tick);
      }
    } : undefined);
    this.abilities?.recordMovement(this.clock.tick,this.physics.movementDistances(),new Set([...modifiers].filter(([,m])=>m.abilityLocked).map(([id])=>id)));
    // Snapshot before casting spends stacks: the charging contact itself receives protection.
    const defenses = new Map([...livingBefore].map(id => [id, modifiers.get(id)?.abilityLocked ? undefined : this.abilities?.contactDefense(id,this.clock.tick)]));
    this.abilities?.syncStatuses(this.statuses.snapshot(),this.clock.tick);
    const abilityRequests = this.abilities?.step(this.clock.tick, PHYSICS.fixedDt, this.arena, this.physics.snapshot(),
      new Map(this.combat!.snapshot().combatants.map(c => [c.id, c.damageMultiplier])), abilityContacts,
      new Set([...modifiers].filter(([, m]) => m.abilityLocked).map(([id]) => id)), hostImpacts,(targetId,ownerId)=>this.statuses.evadeAttachment(this.clock.tick,targetId,ownerId)) ?? [];
    for (const c of this.abilities?.takeStatusConsumptions()??[]) this.statuses.consume(c.sourceId,c.targetId,c.statusId);
    for (const cost of this.abilities?.takeCastCosts()??[]) this.combat?.payCastCost(this.clock.tick,cost.ownerId,cost.amount);
    for(const s of this.abilities?.takeSelfStatuses()??[])this.statuses.apply(this.clock.tick,s.ownerId,s.ownerId,s.abilityId,s.definition);
    this.combat?.syncAuxiliaries(this.abilities?.summonCombatants() ?? []);
    const dashResults = this.physics.takeDashResults();
    const recoveryProfiles = new Map<string, RecoveryProfile>();
    for (const runtime of this.characters) {
      const c = runtime.snapshot(), passive = c.kit.passive;
      if (passive?.trigger === 'direct-damage') recoveryProfiles.set(c.entityId, {
        lifesteal: passive.lifesteal, bonusRatio: this.abilities?.lifestealBonus(c.entityId, this.clock.tick) ?? 0,
        healingMultiplier: this.statuses.healingMultiplier(c.entityId),
        costs: this.abilities?.healthCosts(c.entityId) ?? new Map(),
      });
    }
    const guardBodies=this.physics.snapshot();
    const hpRatios=new Map(this.combat?.snapshot().combatants.map(c=>[c.id,c.hp/c.maxHP]));
    const guardLocked=new Set([...modifiers].filter(([,m])=>m.abilityLocked).map(([id])=>id));
    const defeated = new Set(this.combat?.resolveTick(this.clock.tick, impacts, [...abilityRequests, ...statusRequests], modifiers, r => {
      const hit = this.statuses.mitigate(r,hpRatios.get(r.targetId)??1);
      const contact=mitigateContactDamage(hit,defenses.get(hit.targetId));
      return this.abilities?.mitigateGuard(this.clock.tick,contact,guardLocked,guardBodies)??contact;
    }, recoveryProfiles) ?? []);
    if (defeated.size) {
      for (const body of this.physics.snapshot()) if (defeated.has(body.id)) {
        this.retired.set(body.id, { ...body, velocity: { x: 0, y: 0 }, speed: 0 });
      }
      this.physics.removeBodies(defeated);
    }
    const living = new Set(this.physics.snapshot().map(b => b.id));
    const characters = this.characters.map(c => c.snapshot());
    const results = this.combat?.lastResults ?? [];
    if (!this.finished) {
      this.statuses.wakeOnDamage(this.clock.tick, results, this.combat?.snapshot().recoveryEvents);
      this.statuses.applyCollisionPassives(this.clock.tick, results, new Map(characters.map(c => [c.entityId, c.kit.passive])), living);
      for (const a of this.abilities?.hitStatusApplications(results, living) ?? [])
        this.statuses.apply(this.clock.tick, a.targetId, a.sourceId, a.abilityId, a.definition);
      this.abilities?.recordDamageTaken(this.clock.tick, results, living);
      this.statuses.applyDashResults(this.clock.tick, dashResults, new Map(characters.map(c => [c.entityId, c.kit.passive])), living);
      for (const result of results) {
        const source = result.request.source;
        const character = characters.find(c => c.entityId === source.attackerId);
        if (source.kind === 'summon' && result.appliedDamage > 0 && living.has(source.attackerId) &&
          character?.kit.passive?.trigger === 'summon-hit' && source.abilityId === character.kit.basic)
          this.abilities?.signal(source.attackerId, 'passive-proc', this.clock.tick);
      }
      const procs = this.statuses.applyPassives(this.clock.tick, results, new Map(characters.map(c => [c.entityId, c.kit.passive])),
        new Map(characters.map(c => [c.entityId, c.kit.basic])), living);
      for (const proc of procs) {
        this.pulls.add(this.clock.tick, proc);
        this.abilities?.signal(proc.sourceId, 'passive-proc', this.clock.tick);
      }
      this.abilities?.recordHits(this.clock.tick, results, living, this.physics.snapshot());
      this.abilities?.recordDodges(this.clock.tick,this.statuses.takeDodges(),this.physics.snapshot(),this.arena);
      this.physics.applyKnockbacks(this.abilities?.takeKnockbacks() ?? [], new Map(characters.map(c => [c.entityId,
        (c.kit.passive?.trigger === 'physics' ? c.kit.passive.knockbackMultiplier : 1) * (defenses.get(c.entityId)?.knockbackMultiplier??1)])));
    }
    this.statuses.cleanup(this.clock.tick, living, this.finished);
    this.physics.setMotionLocks(new Set([...living].filter(id => this.statuses.modifiers(id).immobilized || this.abilities?.motionLocks().has(id))));
    this.abilities?.syncStatuses(this.statuses.snapshot(),this.clock.tick);
    this.abilities?.afterCombat(this.clock.tick, living, this.finished, this.combat?.auxiliaryStates());
    this.combat?.syncAuxiliaries(this.abilities?.summonCombatants() ?? []);
    if (this.finished) this.pulls.clear();
  }
  snapshot(): WorldSnapshot {
    const bodies = new Map([...this.retired, ...this.physics.snapshot().map(b => [b.id, b] as const)]);
    const combat = this.combat?.snapshot() ?? null;
    if (combat) combat.statuses = this.statuses.snapshot();
    return {
      characters: this.characters.map(c => c.snapshot(combat?.combatants.find(s => s.id === c.entityId))),
      abilities: this.abilities?.snapshot(this.clock.tick) ?? null,
      combat,
      tick: this.clock.tick, time: this.clock.time, seed: this.seed, arena: structuredClone(this.arena),
      bodies: this.bodyOrder.map(id => structuredClone(bodies.get(id)!)), events: this.journal.snapshot(), wallCount: this.journal.wallCount,
      contactCount: this.journal.contactCount, obstacleCount: this.journal.obstacleCount, substeps: this.physics.substeps, maxOverlap: this.physics.maxOverlap,
    };
  }
}
