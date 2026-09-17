import type { DamageRequest, DamageResult, RecoveryEvent } from '../contracts/combat';
import type { PassiveDefinition, PassiveProc, StatusDefinition, StatusState, SkillDodge } from '../contracts/status';
import { validatePull } from '../contracts/forces';
import type { DashResult } from '../contracts/motion';

export function validateStatus(d: StatusDefinition) {
  if(d.effect.kind==='drowsy'||d.effect.kind==='sleep') {const e=d.effect;if(!Number.isInteger(e.immunityTicks)||e.immunityTicks<60||e.immunityTicks>600||!e.ultimateId.trim()||!Number.isFinite(e.bonusMultiplier)||e.bonusMultiplier<1||e.bonusMultiplier>2||d.durationTicks>600||(e.kind==='sleep'&&d.stacking!=='refresh')||(e.kind==='drowsy'&&(d.maxStacks!==3||d.stacking!=='stack')))throw Error('Invalid dream status');}
  if(d.effect.kind==='charm'&&(!d.sourceScoped||d.stacking!=='refresh'||d.durationTicks>180||!Number.isInteger(d.effect.steerTicks)||d.effect.steerTicks<1||d.effect.steerTicks>48||d.effect.steerTicks>d.durationTicks||!Number.isFinite(d.effect.acceleration)||d.effect.acceleration<=0||d.effect.acceleration>1200))throw Error('Invalid charm');
  if(d.effect.kind==='go-mark'&&(!d.sourceScoped||d.stacking!=='stack'||d.maxStacks!==3||!d.effect.basicId.trim()||!d.effect.ultimateId.trim()||!Number.isFinite(d.effect.bonusPerStack)||d.effect.bonusPerStack<=0||d.effect.bonusPerStack>10))throw Error('Invalid Go mark');
  if(d.effect.kind==='crescent-mark'&&(!d.sourceScoped||d.stacking!=='stack'||d.maxStacks!==3||!d.effect.basicId.trim()||!d.effect.ultimateId.trim()||!Number.isFinite(d.effect.bonusPerStack)||d.effect.bonusPerStack<=0||d.effect.bonusPerStack>10||!Number.isFinite(d.effect.threshold)||d.effect.threshold<=0||d.effect.threshold>.5||!Number.isFinite(d.effect.lowHealthMultiplier)||d.effect.lowHealthMultiplier<1||d.effect.lowHealthMultiplier>1.5))throw Error('Invalid crescent mark');
  if (d.effect.kind === 'speed-modifier' && d.effect.group !== undefined && !d.effect.group.trim()) throw new Error('Invalid speed group');
  if (!d.id?.trim() || !d.name?.trim() || !Number.isInteger(d.durationTicks) || d.durationTicks < 1 || !['refresh', 'stack'].includes(d.stacking) ||
    !['drowsy', 'sleep', 'sleep-resist', 'charm', 'go-mark', 'crescent-mark', 'star-mark', 'skill-evasion', 'periodic-damage', 'damage-modifier', 'source-ability-vulnerability', 'ability-lock', 'freeze', 'speed-modifier', 'mark', 'collision-guard', 'direct-guard'].includes(d.effect.kind)) throw new Error('Invalid status');
  if(d.effect.kind==='star-mark' && (!d.sourceScoped || d.stacking!=='stack' || d.maxStacks!==3 || !d.effect.basicId.trim() || !d.effect.ultimateId.trim() || !Number.isFinite(d.effect.bonusPerStack) || d.effect.bonusPerStack<=0 || d.effect.bonusPerStack>20)) throw new Error('Invalid star mark');
  if(d.effect.kind==='skill-evasion'&&(typeof d.effect.once!=='boolean'||d.stacking!=='refresh'||d.durationTicks>240))throw new Error('Invalid evasion');
  if (d.effect.kind === 'source-ability-vulnerability' && (!d.sourceScoped || d.stacking !== 'refresh' || !Number.isFinite(d.effect.multiplier) || d.effect.multiplier <= 1 || d.effect.multiplier > 2)) throw new Error('Invalid source vulnerability');
  if (d.effect.kind === 'freeze' && (!Number.isInteger(d.effect.immunityTicks) || d.effect.immunityTicks < 1 || d.durationTicks > 60)) throw new Error('Invalid freeze');
  if ((d.effect.kind === 'collision-guard' || d.effect.kind === 'direct-guard') && (!Number.isFinite(d.effect.multiplier) || d.effect.multiplier <= 0 || d.effect.multiplier >= 1)) throw new Error('Invalid collision guard');
  if (d.sourceScoped!==undefined && typeof d.sourceScoped!=='boolean') throw new Error('Invalid status source scope');
  if (d.effect.kind==='periodic-damage' && d.effect.healingMultiplier!==undefined && (!Number.isFinite(d.effect.healingMultiplier)||d.effect.healingMultiplier<0||d.effect.healingMultiplier>1)) throw new Error('Invalid healing modifier');
  if (d.stacking === 'stack' && (!Number.isInteger(d.maxStacks) || d.maxStacks! < 2 || d.maxStacks! > 10 || !['drowsy', 'go-mark', 'crescent-mark', 'star-mark', 'speed-modifier', 'mark', 'periodic-damage'].includes(d.effect.kind))) throw new Error('Invalid stacking status');
  if (d.effect.kind === 'mark') { if (d.stacking !== 'stack') throw new Error('Marks require stacks'); validatePull(d.effect.pull); }
  if (d.effect.kind === 'speed-modifier' && (!Number.isFinite(d.effect.reductionPerStack) || d.effect.reductionPerStack <= 0 || d.effect.reductionPerStack * (d.maxStacks ?? 1) > 0.8)) throw new Error('Invalid speed modifier');
  if (d.effect.kind === 'periodic-damage' && (!Number.isFinite(d.effect.amount) || d.effect.amount <= 0 ||
    !Number.isInteger(d.effect.intervalTicks) || d.effect.intervalTicks < 1 || d.effect.intervalTicks > d.durationTicks)) throw new Error('Invalid periodic status');
  if (d.effect.kind === 'damage-modifier' && [d.effect.outgoing, d.effect.incoming].some(n => !Number.isFinite(n) || n <= 0 || n > 10)) throw new Error('Invalid status modifier');
}
export function validatePassive(d: PassiveDefinition) {
  if (!d.id?.trim() || !d.name?.trim() || !d.description?.trim() || !['guard-block', 'stance-cast', 'hook-contact', 'weapon-tip', 'projectile-wall', 'basic-hit', 'ability-hit', 'field-contact', 'summon-hit', 'decoy-hit', 'summon-attachment', 'dash-cross', 'physics', 'distance', 'direct-damage', 'collision-received'].includes(d.trigger)) throw new Error('Invalid passive');
  if (d.trigger === 'field-contact') validateStatus(d.status);
  if (d.trigger === 'collision-received') { validateStatus(d.status); if (!Number.isInteger(d.cooldownTicks) || d.cooldownTicks < 1) throw new Error('Invalid reactive passive cooldown'); }
  if (d.trigger === 'direct-damage' && (Object.values(d.lifesteal).some(n => !Number.isFinite(n) || n < 0 || n > 1) || d.lifesteal.baseRatio > d.lifesteal.maxRatio)) throw new Error('Invalid lifesteal');
  if (d.trigger === 'physics' && (!Number.isFinite(d.knockbackMultiplier) || d.knockbackMultiplier <= 0 || d.knockbackMultiplier > 1)) throw new Error('Invalid knockback resistance');
  if (d.trigger === 'basic-hit' || d.trigger === 'ability-hit' || d.trigger === 'dash-cross') validateStatus(d.status);
}
export class StatusWorld {
  private dodges: SkillDodge[]=[];
  takeDodges(){const events=this.dodges;this.dodges=[];return events;}
  evadeAttachment(tick:number,targetId:string,attackerId:string){return this.evade(tick,targetId,attackerId);}
  private evade(tick:number,targetId:string,attackerId:string){
    if(targetId===attackerId)return false;
    const active=[...this.states.entries()].filter(([,s])=>s.targetId===targetId&&tick>=s.appliedTick&&tick<s.expiresTick&&s.definition.effect.kind==='skill-evasion')
      .sort(([,a],[,b])=>Number((a.definition.effect as {once:boolean}).once)-Number((b.definition.effect as {once:boolean}).once));
    const entry=active[0];if(!entry)return false;
    const [key,s]=entry;if(s.definition.effect.kind==='skill-evasion'&&s.definition.effect.once)this.states.delete(key);
    this.dodges.push({ownerId:targetId,attackerId,abilityId:s.abilityId,tick});return true;
  }
  private wake(tick:number,key:string,s:StatusState){
    this.states.delete(key);const e=s.definition.effect;if(e.kind!=='sleep')return;
    this.apply(tick,s.targetId,s.targetId,s.abilityId,{id:'dream-resist',name:'ตื่นรู้',durationTicks:e.immunityTicks,stacking:'refresh',effect:{kind:'sleep-resist'},vfxColor:'#eddaac'});
  }
  wakeOnDamage(tick:number,results:readonly DamageResult[],recovery:readonly RecoveryEvent[]=[]){
    const damaged=new Set(results.filter(r=>r.appliedDamage>0).map(r=>r.request.targetId));
    for(const e of recovery)if(e.tick===tick&&e.kind==='health-cost'&&e.hpAfter<e.hpBefore)damaged.add(e.ownerId);
    for(const [key,s] of this.states)if(damaged.has(s.targetId)&&s.definition.effect.kind==='sleep')this.wake(tick,key,s);
  }
  private freezeReadyAt = new Map<string, number>();
  private reactiveReadyAt = new Map<string, number>();
  private states = new Map<string, StatusState>();
  applyCollisionPassives(tick: number, results: readonly DamageResult[], passives: ReadonlyMap<string, PassiveDefinition | null>, living: ReadonlySet<string>) {
    for (const r of results) {
      const owner = r.request.targetId, attacker = r.request.source.attackerId, p = passives.get(owner);
      if (p?.trigger !== 'collision-received' || r.request.source.kind !== 'collision' || r.appliedDamage <= 0 ||
        !living.has(owner) || !living.has(attacker) || owner === attacker || tick < (this.reactiveReadyAt.get(owner) ?? 0)) continue;
      this.reactiveReadyAt.set(owner, tick + p.cooldownTicks);
      this.apply(tick, attacker, owner, p.id, p.status);
    }
  }
  consume(sourceId:string,targetId:string,statusId:string) {
    for (const [key,s] of this.states) if(s.sourceId===sourceId&&s.targetId===targetId&&s.definition.id===statusId) this.states.delete(key);
  }
  /** Shared multiplier for healing; multiple poison layers do not compound; poison reduction does not compound by layer. */
  healingMultiplier(targetId:string) {
    return Math.min(1,...[...this.states.values()].filter(s=>s.targetId===targetId&&s.definition.effect.kind==='periodic-damage')
      .map(s=>s.definition.effect.kind==='periodic-damage'?(s.definition.effect.healingMultiplier??1):1));
  }
  applyDashResults(tick: number, results: readonly DashResult[], passives: ReadonlyMap<string, PassiveDefinition | null>, living: ReadonlySet<string>) {
    for (const result of results) {
      const passive = passives.get(result.ownerId);
      if (result.crossed && living.has(result.ownerId) && passive?.trigger === 'dash-cross')
        this.apply(tick, result.ownerId, result.ownerId, result.abilityId, passive.status);
    }
  }
  mitigate(request: DamageRequest, targetHPRatio=1): DamageRequest {
    if(Number.isFinite(request.amount)&&request.amount>0&&(request.source.kind==='projectile'||request.source.kind==='melee'||request.source.kind==='area'||request.source.kind==='summon'||(request.source.kind==='status'&&request.source.statusId==='wall-slam'))&&this.evade(request.tick,request.targetId,request.source.attackerId))return {...request,amount:0,dodged:true};
    if ((request.source.kind === 'status' && request.source.statusId !== 'wall-slam') || !Number.isFinite(request.amount) || request.amount <= 0 || request.targetId === request.source.attackerId) return request;
    if (['projectile','area','melee'].includes(request.source.kind)) {
      for(const s of this.states.values()) {
        const e=s.definition.effect;
        if(e.kind==='sleep'&&s.targetId===request.targetId&&s.sourceId===request.source.attackerId&&request.tick<s.expiresTick&&request.tick>=s.appliedTick&&request.source.kind!=='collision'&&request.source.abilityId===e.ultimateId)request={...request,amount:request.amount*e.bonusMultiplier};
        if(e.kind==='go-mark'&&s.targetId===request.targetId&&s.sourceId===request.source.attackerId&&request.tick<s.expiresTick&&request.tick>=s.appliedTick&&request.source.kind==='area'&&request.source.abilityId===e.ultimateId&&request.source.areaId?.startsWith('go-final'))request={...request,amount:request.amount+s.stacks*e.bonusPerStack};
        if(e.kind==='crescent-mark'&&s.targetId===request.targetId&&s.sourceId===request.source.attackerId&&request.tick<s.expiresTick&&request.tick>=s.appliedTick&&request.source.kind==='melee'&&request.source.abilityId===e.ultimateId)
          request={...request,amount:(request.amount+e.bonusPerStack*s.stacks)*(targetHPRatio<=e.threshold?e.lowHealthMultiplier:1)};
        if(e.kind==='star-mark' && s.targetId===request.targetId && s.sourceId===request.source.attackerId && request.tick<s.expiresTick && request.tick>=s.appliedTick && request.source.kind==='projectile' &&
          (request.source.abilityId===e.ultimateId || (request.source.abilityId===e.basicId && s.stacks===3))) request={...request,amount:request.amount+e.bonusPerStack*s.stacks};
      }
      const multiplier = Math.max(1,...[...this.states.values()].filter(s=>s.targetId===request.targetId&&s.sourceId===request.source.attackerId&&request.tick>=s.appliedTick&&request.tick<s.expiresTick)
        .map(s=>s.definition.effect.kind==='source-ability-vulnerability'?s.definition.effect.multiplier:1));
      request={...request,amount:request.amount*multiplier};
    }
    for (const [key, state] of this.states) {
      const effect = state.definition.effect;
      if (state.targetId !== request.targetId || request.tick >= state.expiresTick || request.tick < state.appliedTick ||
        (effect.kind !== 'direct-guard' && !(effect.kind === 'collision-guard' && request.source.kind === 'collision'))) continue;
      this.states.delete(key);
      return { ...request, amount: request.amount * effect.multiplier };
    }
    return request;
  }
  apply(tick: number, targetId: string, sourceId: string, abilityId: string, definition: StatusDefinition) {
    validateStatus(definition);
    if(definition.effect.kind==='sleep'||definition.effect.kind==='drowsy'){
      if([...this.states.values()].some(s=>s.targetId===targetId&&tick<s.expiresTick&&(s.definition.effect.kind==='sleep-resist'||s.definition.effect.kind==='sleep')))return null;
    }
    if(targetId!==sourceId&&this.evade(tick,targetId,sourceId))return null;
    if (definition.effect.kind === 'freeze') {
      // Shared across all casters and freeze skills: no refreshing or chain locking.
      if (tick < (this.freezeReadyAt.get(targetId) ?? 0)) return null;
      this.freezeReadyAt.set(targetId, tick + definition.durationTicks + definition.effect.immunityTicks);
    }
    // Marks belong to the caster; duplicate characters cannot consume one another's stacks.
    const key = JSON.stringify([targetId, definition.id, ...(definition.effect.kind === 'mark' || definition.sourceScoped ? [sourceId] : [])]);
    const existing = this.states.get(key);
    const old = existing && tick < existing.expiresTick ? existing : undefined;
    // Refresh is bounded: one burn per target even with duplicate characters.
    this.states.set(key, { targetId, sourceId, abilityId, definition: structuredClone(definition),
      // A finite sentinel keeps snapshots serializable; sleep never expires on a timer.
      appliedTick: old?.appliedTick ?? tick, expiresTick: definition.effect.kind==='sleep'?Number.MAX_SAFE_INTEGER:tick + definition.durationTicks,
      stacks: definition.stacking === 'stack' ? Math.min(definition.maxStacks!, (old?.stacks ?? 0) + 1) : 1,
      nextTick: old?.nextTick ?? tick + (definition.effect.kind === 'periodic-damage' ? definition.effect.intervalTicks : definition.durationTicks) });
    const state = this.states.get(key)!;
    if(definition.effect.kind==='drowsy'&&state.stacks===3){
      this.states.delete(key);const e=definition.effect;
      this.apply(tick,targetId,sourceId,abilityId,{id:'dream-sleep',name:'หลับฝัน',durationTicks:1,stacking:'refresh',effect:{kind:'sleep',immunityTicks:e.immunityTicks,ultimateId:e.ultimateId,bonusMultiplier:e.bonusMultiplier},vfxColor:'#d5b9ff'});
    }
    if (definition.effect.kind === 'mark' && state.stacks === definition.maxStacks) {
      this.states.delete(key);
      return { sourceId, targetId, pull: structuredClone(definition.effect.pull) } satisfies PassiveProc;
    }
    return null;
  }
  step(tick: number, living: ReadonlySet<string>): DamageRequest[] {
    const requests: DamageRequest[] = [];
    for (const [key, s] of this.states) {
      if (!living.has(s.targetId) || (s.definition.effect.kind!=='sleep'&&(!living.has(s.sourceId) || tick > s.expiresTick)) || (s.definition.effect.kind === 'freeze' && tick >= s.expiresTick)) { this.states.delete(key); continue; }
      if (s.definition.effect.kind === 'periodic-damage' && tick >= s.nextTick) {
        requests.push({ tick, targetId: s.targetId, amount: s.definition.effect.amount * s.stacks,
          source: { kind: 'status', attackerId: s.sourceId, abilityId: s.abilityId, statusId: s.definition.id } });
        s.nextTick += s.definition.effect.intervalTicks;
      }
    }
    return requests;
  }
  applyPassives(tick: number, results: readonly DamageResult[], passives: ReadonlyMap<string, PassiveDefinition | null>,
    basics: ReadonlyMap<string, string>, living: ReadonlySet<string>) {
    const procs: PassiveProc[] = [];
    for (const result of results) {
      const source = result.request.source, passive = passives.get(source.attackerId);
      if (passive?.trigger === 'guard-block' || passive?.trigger === 'stance-cast' || passive?.trigger === 'hook-contact' || passive?.trigger === 'weapon-tip' || passive?.trigger === 'field-contact' || passive?.trigger === 'projectile-wall') continue;
      if (!passive || passive.trigger === 'collision-received' || passive.trigger === 'direct-damage' || passive.trigger === 'distance' || passive.trigger === 'physics' || passive.trigger === 'dash-cross' || passive.trigger === 'decoy-hit' || passive.trigger === 'summon-hit' || passive.trigger === 'summon-attachment' || result.appliedDamage <= 0 || !living.has(result.request.targetId) || !living.has(source.attackerId) ||
        source.kind === 'collision' || source.kind === 'status' ||
        (passive.trigger === 'basic-hit' && basics.get(source.attackerId) !== source.abilityId)) continue;
      if (!passive.status) continue;
      if(passive.status.effect.kind==='go-mark'){
        const e=passive.status.effect;
        if(source.kind==='area'&&source.abilityId===e.ultimateId&&source.areaId?.startsWith('go-final'))this.consume(source.attackerId,result.request.targetId,passive.status.id);
        else if(source.kind==='area'&&source.abilityId===e.basicId)this.apply(tick,result.request.targetId,source.attackerId,source.abilityId,passive.status);
        continue;
      }
      if(passive.status.effect.kind==='crescent-mark'){
        const e=passive.status.effect;
        if(source.abilityId===e.ultimateId)this.consume(source.attackerId,result.request.targetId,passive.status.id);
        else if(source.abilityId===e.basicId)this.apply(tick,result.request.targetId,source.attackerId,source.abilityId,passive.status);
        continue;
      }
      if(passive.status.effect.kind==='star-mark') {
        const e=passive.status.effect;
        if(source.abilityId!==e.basicId && source.abilityId!==e.ultimateId)continue;
        const existing=[...this.states.values()].find(s=>s.sourceId===source.attackerId && s.targetId===result.request.targetId && s.definition.id===passive.status.id && tick<s.expiresTick);
        if(source.abilityId===e.ultimateId || existing?.stacks===3) {
          this.consume(source.attackerId,result.request.targetId,passive.status.id);
          if(existing?.stacks===3)this.apply(tick,result.request.targetId,source.attackerId,source.abilityId,{id:passive.status.id+'-exposed',name:'เผยจุดอ่อน',durationTicks:150,stacking:'refresh',sourceScoped:true,effect:{kind:'source-ability-vulnerability',multiplier:1.2},vfxColor:'#f3d68b'});
        } else this.apply(tick,result.request.targetId,source.attackerId,source.abilityId,passive.status);
        continue;
      }
      const proc = this.apply(tick, result.request.targetId, source.attackerId, source.abilityId, passive.status);
      if (proc) procs.push(proc);
    }
    return procs;
  }
  modifiers(id: string) {
    let outgoing = 1, incoming = 1, abilityLocked = false, immobilized = false, speed = 1;
    const groupedSlow = new Map<string, number>();
    for (const s of this.states.values()) if (s.targetId === id) {
      const e = s.definition.effect;
      if (e.kind === 'damage-modifier') { outgoing *= e.outgoing; incoming *= e.incoming; }
      if (e.kind === 'freeze'||e.kind==='sleep') { abilityLocked = true; immobilized = true; }
      if (e.kind === 'ability-lock') abilityLocked = true;
      if (e.kind === 'speed-modifier') {
        if (e.group) groupedSlow.set(e.group, Math.max(groupedSlow.get(e.group) ?? 0, e.reductionPerStack * s.stacks));
        else speed *= 1 - e.reductionPerStack * s.stacks;
      }
    }
    for (const reduction of groupedSlow.values()) speed *= 1 - reduction;
    return { outgoing: Math.min(10, outgoing), incoming: Math.min(10, incoming), abilityLocked, immobilized, speed: Math.max(0.2, speed) };
  }
  cleanup(tick: number, living: ReadonlySet<string>, finished: boolean) {
    this.dodges=this.dodges.filter(e=>!finished&&living.has(e.ownerId)&&living.has(e.attackerId));
    for (const [id, ready] of this.freezeReadyAt) if (finished || !living.has(id) || tick >= ready) this.freezeReadyAt.delete(id);
    for (const [id, ready] of this.reactiveReadyAt) if (finished || !living.has(id) || tick >= ready) this.reactiveReadyAt.delete(id);
    for (const [key, s] of this.states) if (finished || !living.has(s.targetId) || (s.definition.effect.kind!=='sleep'&&(tick >= s.expiresTick || !living.has(s.sourceId)))) this.states.delete(key);
  }
  snapshot() { return structuredClone([...this.states.values()]); }
}
