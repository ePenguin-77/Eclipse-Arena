import type { WorldSnapshot } from '../../contracts/types';
import type { VfxCue, VfxDefinition } from '../../contracts/vfx';
import { clipDuration } from './clip';
import { ABILITY_RANGE_GAP } from '../../config/ability-ranges';
import { zoneRadius } from '../../abilities/zone-radius';

export const MAX_VFX_CUES = 48;
export const MAX_VFX_PROJECTILES = 64;

/** Pure event-to-visual adapter. No RNG, damage, callbacks or retained event queue. */
export function sampleVfx(world: WorldSnapshot, data: VfxDefinition, alpha = 1): VfxCue[] {
  const fraction = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  const timeMs = Math.max(0, world.tick - 1 + fraction) * 1000 / 60;
  const cues: VfxCue[] = [];
  const duration = (id: string) => clipDuration(data.clips.find(c => c.id === id)!);
  const bodyPoint = (body: Pick<WorldSnapshot['bodies'][number],'position'|'previousPosition'>) => ({
    x: body.previousPosition.x + (body.position.x - body.previousPosition.x) * fraction,
    y: body.previousPosition.y + (body.position.y - body.previousPosition.y) * fraction,
  });
  // Reserve a stable, continuous aura for each living passive owner, independent of casting.
  for (const character of world.characters) {
    const aura = character.kit.passive?.aura;
    const owner = world.bodies.find(b => b.id === character.entityId);
    if (!aura || !owner || character.status === 'defeated' || !data.clips.some(c => c.id === aura.clipId) || cues.length >= MAX_VFX_CUES) continue;
    const distanceAbility=world.abilities?.definitions.find(d=>d.id===character.kit.basic && d.basicCharge?.mode==='distance');
    const stacks=world.abilities?.runtimes.find(r=>r.ownerId===owner.id && r.abilityId===character.kit.basic)?.basicStacks??0;
    const formRuntime=world.abilities?.runtimes.find(r=>r.ownerId===owner.id && r.activeTicksRemaining!==undefined);
    const auraStrength=distanceAbility ? formRuntime ? 1.18 : 1+stacks*.06 : 1;
    const passiveCue: VfxCue = { key: `passive-${character.entityId}`, kind: 'aura', point: bodyPoint(owner), angle: 0,
      ageMs: timeMs, durationMs: Infinity, size: owner.radius * 2 * aura.sizeScale,
      color: character.visual.auraColor ?? character.visual.color, clipId: aura.clipId, opacity: (aura.opacity??1)*auraStrength, ballRadius:owner.radius };
    if(aura.clipId==='retrace-aura')passiveCue.angle=Math.atan2(owner.velocity.y,owner.velocity.x);
    if(aura.clipId==='gates-aura'){
      const state=world.abilities?.gates?.find(g=>g.ownerId===owner.id),power=Math.max(state?.count??0,state?.activeGates??0);
      passiveCue.opacity=.42+power*.105;
      passiveCue.size*=1+power*.018;
    }
    if(world.abilities?.returningWeapons?.some(p=>p.ownerId===owner.id))passiveCue.opacity=(passiveCue.opacity??1)*.35;
    const formBinding=formRuntime && data.abilities.find(a=>a.abilityId===formRuntime.abilityId);
    const activeAura=formBinding?.activeAura;
    const instrument = formRuntime && world.abilities?.definitions.find(d=>d.id===formRuntime.abilityId)?.effect.kind==='projectile-sequence';
    if (activeAura && cues.length<MAX_VFX_CUES-1) cues.push({key:`form-aura-${owner.id}`,kind:'aura',point:{x:bodyPoint(owner).x,y:bodyPoint(owner).y-(instrument?owner.radius*1.6:0)},angle:0,
      ageMs:timeMs,durationMs:Infinity,size:activeAura.size,color:formBinding.color,clipId:activeAura.clipId,opacity:1.25,ballRadius:owner.radius});
    // Keep the normal inner aura visible over the outer transformation artwork.
    cues.push(passiveCue);
    const motion=data.abilities.find(a=>a.abilityId===(formRuntime?.abilityId??character.kit.basic))?.motion;
    if (motion && (formRuntime || stacks>0 || owner.speed>450) && cues.length<MAX_VFX_CUES) cues.push({key:`motion-${owner.id}`,kind:'aura',point:bodyPoint(owner),angle:Math.atan2(owner.velocity.y,owner.velocity.x),
      ageMs:timeMs,durationMs:Infinity,size:motion.size,color:character.visual.auraColor??character.visual.color,clipId:motion.clipId,opacity:formRuntime?1.2:.35+stacks*.15});
  }
  // Newest transient events get priority within the remaining cosmetic budget.
  for(const trap of world.abilities?.thornTraps??[]){
    const age=(timeMs-trap.plantedTick*1000/60),travel=Math.min(1,Math.max(0,age/300));
    const normal=trap.side==='left'?{x:1,y:0}:trap.side==='right'?{x:-1,y:0}:trap.side==='top'?{x:0,y:1}:{x:0,y:-1};
    const point={x:trap.position.x+normal.x*18,y:trap.position.y+normal.y*18};
    const ready=world.tick>=trap.armedTick;
    if(cues.length<MAX_VFX_CUES)cues.push({key:trap.id+'-edge',kind:'zone',point:{x:trap.position.x+normal.x*8,y:trap.position.y+normal.y*8},angle:normal.x?Math.PI/2:0,
      ageMs:Math.max(0,age),durationMs:Infinity,size:trap.halfWidth*2/.8,color:'#ed7e91',clipId:'thorn-hedge',opacity:ready?(trap.empowered?1.35:.8):.25});
    if(cues.length<MAX_VFX_CUES)cues.push({key:trap.id,kind:'zone',point:travel<1?{x:trap.origin.x+(point.x-trap.origin.x)*travel,y:trap.origin.y+(point.y-trap.origin.y)*travel}:point,angle:0,
      ageMs:ready?age:0,durationMs:Infinity,size:trap.empowered?66:54,color:'#ed7e91',clipId:'thorn-bud',opacity:ready?1.5:.6});
  }
  for(const storm of world.abilities?.windStorms??[]){
    if(cues.length>=MAX_VFX_CUES)break;
    cues.push({key:storm.id,kind:'zone',point:{...storm.position},angle:0,ageMs:Math.max(0,timeMs-storm.startedTick*1000/60),durationMs:Infinity,size:storm.radius/.46,annulus:{innerRadius:storm.eyeRadius,outerRadius:storm.radius},color:'#b9e4d7',clipId:'wind-storm',opacity:Math.min(.9,(storm.endsTick-world.tick)/24)});
  }
  for(const ember of world.abilities?.foxEmbers??[]){
    if(cues.length>=MAX_VFX_CUES)break;
    cues.push({key:ember.id,kind:'zone',point:ember.position,angle:0,ageMs:(world.tick-ember.startedTick)*1000/60,durationMs:(ember.detonatesTick-ember.startedTick)*1000/60,size:ember.radius*1.3,color:'#ffbfbe',clipId:'fox-impact',opacity:.4});
  }
  for(const hunt of world.abilities?.foxHunts??[]){
    const owner=world.bodies.find(b=>b.id===hunt.ownerId);if(!owner||world.tick>hunt.dashUntil)continue;
    const p=bodyPoint(owner);
    for(let i=1;i<=3&&cues.length<MAX_VFX_CUES;i++)cues.push({key:`fox-trail-${owner.id}-${i}`,kind:'area',point:{x:p.x-hunt.direction.x*i*17,y:p.y-hunt.direction.y*i*17},angle:Math.atan2(hunt.direction.y,hunt.direction.x),ageMs:0,durationMs:Infinity,size:65-i*9,color:'#ffc5bb',clipId:'fox-flame',opacity:.34-i*.065});
  }
  for(const p of world.abilities?.returningWeapons??[]) {
    const binding=data.abilities.find(a=>a.abilityId===p.abilityId);
    if(!binding?.projectile||cues.length>=MAX_VFX_CUES)continue;
    cues.push({key:p.id,kind:'projectile',point:bodyPoint(p),angle:0,
      ageMs:Math.max(0,timeMs-p.spawnedTick*1000/60),durationMs:Infinity,size:binding.projectile.size,
      color:binding.color,clipId:binding.projectile.clipId,opacity:1.15});
  }
  for(const g of world.abilities?.guards??[]) {
    const owner=world.bodies.find(b=>b.id===g.ownerId),binding=data.abilities.find(a=>a.abilityId===g.abilityId);
    if(!owner||!binding||cues.length>=MAX_VFX_CUES)continue;
    const age=Math.max(0,timeMs-g.startedTick*1000/60);
    cues.push({key:`guard-${g.ownerId}`,kind:'aura',point:bodyPoint(owner),angle:0,ageMs:age,durationMs:Infinity,
      size:180*(.85+.15*Math.min(1,age/180)),color:binding.color,clipId:'umbrella-guard',opacity:.7,ballRadius:owner.radius});
  }
  const chainCue=(id:string,ownerId:string,abilityId:string,end:{x:number;y:number},endRadius:number,taut:boolean)=>{
    const owner=world.bodies.find(b=>b.id===ownerId),binding=data.abilities.find(a=>a.abilityId===abilityId);
    if(!owner||!binding?.tetherClipId||cues.length>=MAX_VFX_CUES)return;
    const start=bodyPoint(owner),dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy);
    if(length<=owner.radius+endRadius)return;
    cues.push({key:`tether-${id}`,kind:'aura',point:{x:start.x+dx/length*owner.radius,y:start.y+dy/length*owner.radius},
      tether:{end:{x:end.x-dx/length*endRadius,y:end.y-dy/length*endRadius},taut},angle:0,ageMs:timeMs,durationMs:Infinity,
      size:length,color:binding.color,clipId:binding.tetherClipId,opacity:1.2});
  };
  for(const p of world.abilities?.projectiles??[])chainCue(p.id,p.ownerId,p.abilityId,
    {x:p.previousPosition.x+(p.position.x-p.previousPosition.x)*fraction,y:p.previousPosition.y+(p.position.y-p.previousPosition.y)*fraction},10,false);
  for(const c of world.abilities?.chains??[]) {
    const target=world.bodies.find(b=>b.id===c.targetId);
    if(target)chainCue(c.id,c.ownerId,c.abilityId,bodyPoint(target),target.radius,true);
    const effect=world.abilities?.definitions.find(d=>d.id===c.abilityId)?.effect;
    if(target&&effect?.kind==='hook'&&effect.constriction&&cues.length<MAX_VFX_CUES)
      cues.push({key:`coil-${c.id}`,kind:'aura',point:bodyPoint(target),angle:0,ageMs:Math.max(0,timeMs-c.spawnedTick*1000/60),durationMs:1440,size:target.radius*3.3,color:'#ffe0a0',clipId:'chain-constriction',opacity:1.1,ballRadius:target.radius});
  }
  for(const s of world.abilities?.inkStrokes??[]) {
    if(cues.length>=MAX_VFX_CUES)break;
    const binding=data.abilities.find(a=>a.abilityId===s.abilityId);
    if(!binding?.area)continue;
    cues.push({key:s.id,kind:'zone',point:{...s.position},angle:s.angle,ageMs:Math.max(0,timeMs-s.spawnedTick*1000/60),
      durationMs:Infinity,size:s.length/.8,color:binding.color,clipId:binding.area.clipId,opacity:Math.min(1.4,(s.expiresTick-world.tick)/30)});
  }
  for (const s of world.abilities?.summons ?? []) {
    if (cues.length >= MAX_VFX_CUES) break;
    const binding = data.abilities.find(a => a.abilityId === s.abilityId);
    const empowered = world.tick < s.empoweredUntil;
    cues.push({ key: s.id, kind: 'summon', point: { x: s.previousPosition.x + (s.position.x - s.previousPosition.x) * fraction,
      y: s.previousPosition.y + (s.position.y - s.previousPosition.y) * fraction }, angle: 0,
      ageMs: Math.max(0, timeMs - s.spawnedTick * 1000 / 60), durationMs: Infinity,
      size: s.attachedTo ? 24 : (binding?.summon?.size ?? s.radius * 2) * (empowered ? 1.25 : 1), color: binding?.color ?? '#f4b2cf',
      clipId: empowered ? binding?.summon?.empoweredClipId : binding?.summon?.clipId, opacity: 1.45 });
  }
  for (const e of [...(world.abilities?.events ?? [])].reverse()) {
    const binding = data.abilities.find(a => a.abilityId === e.abilityId);
    if (!binding || e.tick > world.tick) continue;
    const ageMs = Math.max(0, timeMs - e.tick * 1000 / 60);
    const base = { key: `event-${e.id}`, point: { ...e.point }, angle: 0, ageMs, color: binding.color };
    const emit = (cue: VfxCue) => { if (cues.length < MAX_VFX_CUES && ageMs < cue.durationMs) cues.push(cue); };
    if(e.kind==='thrust'&&e.reason==='wind-fan'&&e.end&&binding.release){
      const dx=e.end.x-e.point.x,dy=e.end.y-e.point.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
      emit({...base,kind:'release',angle,clipId:binding.release.clipId,size:length/.6,durationMs:duration(binding.release.clipId),opacity:1.2});continue;
    }
    if(e.kind==='projectile'&&(e.reason==='cannon-fire'||e.reason==='cannon-heavy')&&e.end&&binding.release){
      const angle=Math.atan2(e.end.y-e.point.y,e.end.x-e.point.x);
      emit({...base,kind:'release',angle,point:{x:e.point.x+Math.cos(angle)*30,y:e.point.y+Math.sin(angle)*30},clipId:binding.release.clipId,size:e.reason==='cannon-heavy'?150:115,durationMs:duration(binding.release.clipId),opacity:1.1});
      continue;
    }
    if(e.kind==='detonate'&&(e.reason==='cannon-burst'||e.reason==='cannon-wall-burst')){
      const effect=world.abilities?.definitions.find(d=>d.id===e.abilityId)?.effect;
      if(effect?.kind==='cannon-shot'||effect?.kind==='cannon-salvo'){
        const radius=e.reason==='cannon-wall-burst'&&effect.kind==='cannon-salvo'?effect.finalRadius:effect.blastRadius;
        emit({...base,kind:'impact',clipId:binding.impact.clipId,size:radius/.45,radius,durationMs:duration(binding.impact.clipId),opacity:1.1});
      }
      continue;
    }
    if(e.kind==='cancelled'&&e.reason==='charge-interrupted'){
      const owner=world.bodies.find(b=>b.id===e.ownerId);
      emit({...base,point:owner?bodyPoint(owner):base.point,kind:'dodge',size:34,durationMs:900,label:'เสียสมาธิ'});
    }
    if(e.reason==='beam-release'&&e.end)emit({...base,point:e.end,kind:'impact',clipId:binding.impact.clipId,size:binding.impact.size*.8,durationMs:duration(binding.impact.clipId)});
    if(e.kind==='detonate'&&e.reason==='fox-ember')emit({...base,kind:'impact',clipId:'fox-impact',size:150,durationMs:duration('fox-impact'),opacity:1.1});
    if(e.kind==='detonate'&&e.reason==='go-final')emit({...base,kind:'impact',clipId:'go-impact',size:360,durationMs:duration('go-impact'),opacity:1.1});
    if(e.reason==='chain-crush')emit({...base,kind:'impact',clipId:'chain-constriction',size:150,ageMs:1200+ageMs,durationMs:1440,opacity:1.2});
    if(e.kind==='dodge')emit({...base,kind:'dodge',size:34,durationMs:520,label:e.reason==='umbrella-block'?'รับลม':e.reason==='retreat-shot'?'ถอยยิง':'หลบ'});
    if(e.kind==='area'&&e.reason==='guard-release') {
      const effect=world.abilities?.definitions.find(d=>d.id===e.abilityId)?.effect;
      if(effect?.kind==='guard-burst')emit({...base,kind:'area',clipId:binding.impact.clipId,size:effect.radius*2.2,radius:effect.radius,durationMs:duration(binding.impact.clipId),opacity:1.2});
    }
    if(e.kind==='thrust'&&e.reason==='crescent-sweep'&&e.end&&binding.release){
      emit({...base,kind:'release',angle:Math.atan2(e.end.y-e.point.y,e.end.x-e.point.x),clipId:binding.release.clipId,size:binding.release.size,durationMs:duration(binding.release.clipId),opacity:1.1});
    }
    if(e.reason==='masks-wrath'&&e.kind==='slash'&&e.end){
      emit({...base,kind:'release',point:{x:(e.point.x+e.end.x)/2,y:(e.point.y+e.end.y)/2},angle:Math.atan2(e.end.y-e.point.y,e.end.x-e.point.x),clipId:'masks-strike',size:155,durationMs:duration('masks-strike'),opacity:1.1});
    }
    if(e.reason==='masks-smile'&&e.kind==='area')emit({...base,kind:'area',clipId:'masks-impact',size:(e.end?.x??120)*2.2,durationMs:duration('masks-impact'),opacity:1.1});
    if(e.reason==='masks-mark')emit({...base,kind:'impact',clipId:'masks-impact',size:155,durationMs:duration('masks-impact'),opacity:1.2});
    if(e.reason==='gates-fist'&&e.end){
      const dx=e.end.x-e.point.x,dy=e.end.y-e.point.y,clipId=e.kind==='finisher'?'gates-finisher':'gates-punch';
      emit({...base,kind:'release',point:{x:(e.point.x+e.end.x)/2,y:(e.point.y+e.end.y)/2},angle:Math.atan2(dy,dx),clipId,size:e.kind==='finisher'?225:145,durationMs:duration(clipId),opacity:1.15});
    }
    if(e.kind==='thrust' && e.reason!=='crescent-sweep' && e.end && binding.release) {
      const dx=e.end.x-e.point.x,dy=e.end.y-e.point.y;
      const effect=world.abilities?.definitions.find(d=>d.id===e.abilityId)?.effect;
      const ticks=e.reason==='spear-lunge'?2:effect?.kind==='thrust'?(effect.activeTicks??1):1;
      emit({...base,kind:'release',point:{x:(e.point.x+e.end.x)/2,y:(e.point.y+e.end.y)/2},angle:Math.atan2(dy,dx),
        clipId:binding.release.clipId,size:Math.hypot(dx,dy),durationMs:ticks*1000/60,shaftRadius:effect?.kind==='thrust'?effect.radius:undefined,opacity:1.2});
    }
    if(e.kind==='lunge-burst') {
      const effect=world.abilities?.definitions.find(d=>d.id===e.abilityId)?.effect;
      if(effect?.kind==='thrust'&&effect.lunge)emit({...base,kind:'impact',clipId:binding.impact.clipId,size:effect.lunge.burstRadius*2.2,durationMs:duration(binding.impact.clipId),opacity:1.2});
    }
    if ((e.kind === 'decoy-spawn' || e.kind === 'decoy-swap') && binding.release) {
      emit({...base,kind:'release',clipId:binding.release.clipId,size:binding.release.size,durationMs:duration(binding.release.clipId),opacity:1.3});
      if (e.end) emit({...base,key:base.key+'-origin',point:e.end,kind:'release',clipId:binding.release.clipId,size:binding.release.size,durationMs:duration(binding.release.clipId),opacity:1.3});
    }
    if (e.kind === 'decoy-break') emit({...base,kind:'impact',clipId:binding.impact.clipId,size:binding.impact.size,durationMs:duration(binding.impact.clipId),opacity:1.4});
    if ((e.kind === 'slash' || e.kind === 'finisher') && binding.sequence) {
      const effect = world.abilities?.definitions.find(d => d.id === e.abilityId)?.effect;
      if (effect?.kind === 'flurry') {
        const clipId = e.kind === 'finisher' ? binding.sequence.finisherClipId : binding.sequence.slashClipId;
        emit({ ...base, kind: 'release', clipId, angle: Number(e.reason ?? 0) * 2.399963229728653,
          size: effect.radius / binding.sequence.artRadiusFraction, durationMs: duration(clipId), opacity: e.kind === 'finisher' ? 1.3 : .9 });
      }
    }
    if ((e.kind === 'summon' || e.kind === 'summon-pulse') && binding.release) {
      const effect = world.abilities?.definitions.find(d => d.id === e.abilityId)?.effect;
      const radius = e.kind === 'summon-pulse' && effect?.kind === 'summon' ? effect.detonation ? 110 : effect.empowerment?.pulseRadius : undefined;
      emit({ ...base, kind: radius ? 'area' : 'release', clipId: binding.release.clipId, size: radius ? radius / .45 : binding.release.size,
        radius, durationMs: duration(binding.release.clipId), opacity: .95 });
    }
    if (e.kind === 'detonate' && binding.zone) {
      const effect = world.abilities?.definitions.find(d => d.id === e.abilityId)?.effect;
      if (effect?.kind === 'zone') emit({ ...base, kind: 'area', clipId: binding.zone.detonationClipId,
        size: (effect.collapseRadius??effect.radius) / binding.zone.artRadiusFraction, radius: effect.collapseRadius??effect.radius, durationMs: duration(binding.zone.detonationClipId), opacity: 1.2 });
    }
    if ((e.kind === 'melee' || (e.kind === 'miss' && e.reason === 'out-of-range')) && binding.release && e.end) {
      const dx = e.end.x - e.point.x, dy = e.end.y - e.point.y;
      const distance = Math.hypot(dx, dy);
      const tier = world.abilities?.definitions.find(d => d.id === e.abilityId)?.range ?? 0;
      const ownerRadius = world.bodies.find(b => b.id === e.ownerId)?.radius ?? 34;
      const targetRadius = world.bodies.find(b => b.id === e.targetId)?.radius ?? 34;
      const range = ABILITY_RANGE_GAP[tier] + ownerRadius + targetRadius;
      const travel = Math.min(distance * 0.5, range * 0.5);
      emit({ ...base, key: `${base.key}-release`, kind: 'release', clipId: binding.release.clipId,
        point: { x: e.point.x + (distance ? dx / distance * travel : 0), y: e.point.y + (distance ? dy / distance * travel : 0) },
        size: binding.release.size, durationMs: duration(binding.release.clipId) });
    }
    const applied = (e.kind === 'melee' || e.kind === 'hit') && world.combat?.results.some(r =>
      r.appliedDamage > 0 && r.request.tick === e.tick && r.request.targetId === e.targetId &&
      r.request.source.attackerId === e.ownerId && r.request.source.kind !== 'collision' && r.request.source.abilityId === e.abilityId);
    // A palm's single atlas already includes its impact; avoid drawing two copies over the face.
    if ((applied && !binding.sequence && (e.kind !== 'melee' || binding.impact.clipId !== binding.release?.clipId)) || e.kind === 'wall' || e.kind === 'obstacle') emit({ ...base, key: `${base.key}-impact`, kind: applied ? 'impact' : 'wall',
      point: { ...(e.kind === 'melee' && e.end ? e.end : e.point) }, clipId: binding.impact.clipId,
      size: binding.impact.size * (applied ? 1 : 0.65), durationMs: duration(binding.impact.clipId) });
  }
  for (const r of world.abilities?.runtimes ?? []) {
    if ((r.status !== 'casting' && r.status !== 'empowered') || cues.length >= MAX_VFX_CUES) continue;
    const binding = data.abilities.find(a => a.abilityId === r.abilityId);
    const owner = world.bodies.find(b => b.id === r.ownerId);
    const definition = world.abilities?.definitions.find(d => d.id === r.abilityId);
    if (!owner || !binding || !definition) continue;
    const windup = definition.ultimate?.windupTicks ?? definition.castTicks;
    const castEvent = [...(world.abilities?.events ?? [])].reverse().find(e => e.ownerId === r.ownerId && e.abilityId === r.abilityId && e.kind === 'cast');
    if(definition.effect.kind==='thrust' && binding.release && castEvent?.end) {
      const angle=Math.atan2(castEvent.end.y-castEvent.point.y,castEvent.end.x-castEvent.point.x),length=definition.effect.length;
      const p=bodyPoint(owner);
      cues.push({key:`cast-${r.ownerId}`,kind:'cast',point:{x:p.x+Math.cos(angle)*length/2,y:p.y+Math.sin(angle)*length/2},angle,
        ageMs:100,durationMs:Infinity,size:length,clipId:binding.release.clipId,color:binding.color,opacity:.3});
      continue;
    }
    cues.push({ key: `cast-${r.ownerId}`, kind: 'cast', point: bodyPoint(owner), angle: 0,
      ageMs: binding.aura ? Math.max(0, timeMs - (castEvent?.tick ?? world.tick) * 1000 / 60) : Math.max(0, windup - r.castRemaining - 1 + fraction) * 1000 / 60,
      durationMs: binding.aura ? Infinity : windup * 1000 / 60, size: binding.aura?.size ?? owner.radius * 2 + 16, clipId: binding.aura?.clipId, ballRadius:owner.radius,
      color: world.characters.find(c => c.entityId === r.ownerId)?.visual.auraColor ?? binding.color });
  }
  for (const s of world.combat?.statuses ?? []) {
    if (!s.definition.vfxClipId || cues.length >= MAX_VFX_CUES || !data.clips.some(c => c.id === s.definition.vfxClipId)) continue;
    const body = world.bodies.find(b => b.id === s.targetId);
    if (!body) continue;
    cues.push({ key: `status-${s.targetId}-${s.definition.id}-${s.sourceId}`, kind: 'aura', point: bodyPoint(body), angle: 0,
      ageMs: Math.max(0, timeMs - s.appliedTick * 1000 / 60), durationMs: Infinity, size: s.definition.effect.kind === 'freeze' ? body.radius * 3.6 : body.radius * 2 + 19,
      ballRadius: s.definition.effect.kind === 'freeze' ? body.radius : undefined,
      color: s.definition.vfxColor ?? '#ff713d', clipId: s.definition.vfxClipId, opacity: s.definition.effect.kind === 'freeze' ? 1.35 : 0.5 + (s.stacks - 1) * 0.15 });
  }
  for (const sequence of world.abilities?.flurries ?? []) {
    if (cues.length >= MAX_VFX_CUES) break;
    const binding = data.abilities.find(a => a.abilityId === sequence.abilityId);
    if (!binding?.sequence) continue;
    cues.push({ key: sequence.id, kind: 'zone', point: { ...sequence.position }, angle: 0,
      ageMs: Math.max(0, timeMs - sequence.spawnedTick * 1000 / 60), durationMs: (sequence.endsTick - sequence.spawnedTick + 1) * 1000 / 60,
      size: sequence.radius / binding.sequence.artRadiusFraction, radius: sequence.radius, color: binding.color,
      clipId: binding.sequence.telegraphClipId, opacity: .18 });
  }
  for (const zone of world.abilities?.zones ?? []) {
    if (cues.length >= MAX_VFX_CUES) break;
    const binding = data.abilities.find(a => a.abilityId === zone.abilityId);
    const ageMs = Math.max(0, timeMs - zone.spawnedTick * 1000 / 60);
    cues.push({ key: zone.id, kind: 'zone', point: { ...zone.position }, angle: 0, ageMs,
        durationMs: ((zone.triggerUntilTick ?? zone.detonatesTick) - zone.spawnedTick) * 1000 / 60,
      size: zoneRadius(zone,world.tick-1+fraction) / (binding?.zone?.artRadiusFraction ?? .45), radius: zoneRadius(zone,world.tick-1+fraction),
      color: binding?.color ?? '#c3a1ff', clipId: binding?.zone?.clipId,
      opacity: zone.triggerUntilTick !== undefined ? (world.tick < zone.detonatesTick ? .35 : .9) : zone.pullAcceleration > 0 ? 1.1 : .75 });
  }
  for (const area of world.abilities?.areas ?? []) {
    if (cues.length >= MAX_VFX_CUES) break;
    const binding = data.abilities.find(a => a.abilityId === area.abilityId);
    if (!binding?.area) continue;
    const ageMs = Math.max(0, timeMs - area.spawnedTick * 1000 / 60);
    const durationMs = (area.expiresTick - area.spawnedTick) * 1000 / 60;
    const radius = area.maxRadius * Math.min(1, ageMs / durationMs);
    cues.push({ key: area.id, kind: 'area', point: { ...area.position }, angle: 0, ageMs, durationMs,
      size: radius / binding.area.artRadiusFraction, radius, color: binding.color, clipId: binding.area.clipId, opacity: 1.15 });
  }
  for (const p of world.abilities?.projectiles.slice(0, MAX_VFX_PROJECTILES) ?? []) {
    const copied = p.visualAbilityId && data.abilities.find(a => a.abilityId === p.visualAbilityId);
    const binding = copied && copied.projectile ? copied : data.abilities.find(a => a.abilityId === p.abilityId);
    cues.push({ key: p.id, kind: 'projectile', point: {
      x: p.previousPosition.x + (p.position.x - p.previousPosition.x) * fraction,
      y: p.previousPosition.y + (p.position.y - p.previousPosition.y) * fraction }, angle: Math.atan2(p.velocity.y, p.velocity.x),
      ageMs: Math.max(0, timeMs - p.spawnedTick * 1000 / 60), durationMs: Infinity,
      size: (binding?.projectile?.size ?? p.radius * 2)*(p.visualScale??1), color: binding?.color ?? '#b8acf0', clipId: (p.visualScale??1)>1 ? binding?.projectile?.finisherClipId??binding?.projectile?.clipId : binding?.projectile?.clipId });
  }
  return cues;
}
