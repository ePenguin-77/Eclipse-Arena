import {MASKS_BALANCE as M} from '../config/masks';
import type { AbilitySnapshot } from '../contracts/abilities';
import { scaledDamage } from '../config/combat';
import { ABILITY_RANGE_GAP, ABILITY_RANGE_LABEL } from '../config/ability-ranges';
import { ultimateCounter, ultimateDisplay } from '../presentation/ultimate-view';
import type { CombatSnapshot } from '../contracts/combat';

const label = (id: string) => String.fromCharCode(64 + Number(id.split('-')[1]));
const reasons: Record<string, string> = { 'out-of-range': 'ไม่มีเป้าหมายในระยะ', busy: 'กำลังใช้ Skill อื่น', cooldown: 'ยังติด Cooldown', 'target-defeated': 'เป้าหมายตายแล้ว', capacity: 'จำนวนกระสุนเต็ม', 'owner-defeated': 'ผู้ใช้ตายแล้ว', 'match-finished': 'จบรอบ' };
export function BasicChargeMeter({ owner, abilities, finished, onCast, ownerLabel }: { owner: string; abilities: AbilitySnapshot | null; finished: boolean; onCast: (ownerId: string, abilityId: string) => void; ownerLabel: string }) {
  const runtime = abilities?.runtimes.find(r => r.ownerId === owner && !abilities.definitions.find(d => d.id === r.abilityId)?.ultimate);
  const definition = abilities?.definitions.find(d => d.id === runtime?.abilityId);
  if (!runtime || !definition) return <span className="basic-charge-empty">ปิดวิชา</span>;
  const recharge = definition.basicCharge?.mode === 'recharge';
  const maskState=definition.effect.kind==='masks-shift'?abilities?.masks?.find(m=>m.ownerId===owner):undefined;
  const maskFace=maskState?.face??'wrath';
  const chargeLabel=definition.effect.kind==='masks-shift'?{wrath:'พิโรธ',sorrow:'โศก',smile:'ยิ้ม'}[maskFace]:definition.effect.kind==='bell'?'กังวาน':definition.basicCharge?.name??'พร้อมใช้';
  const count = runtime.basicStacks ?? (runtime.status === 'ready' ? 1 : 0), maximum = runtime.basicMaxStacks ?? 1;
  const progress = runtime.basicRechargeProgress ?? 0;
  // Large future capacities use one proportional gauge instead of hundreds of tiny DOM cells.
  const segments = maximum <= 8 ? maximum : 1;
  const empowered=maskState?.remaining.includes(maskFace);
  const maskDamage=maskFace==='wrath'?(empowered?M.wrathAwakenedDamage:M.wrathDamage):maskFace==='sorrow'?(empowered?M.sorrowAwakenedDamage:M.sorrowDamage):(empowered?M.smileAwakenedDamage:M.smileDamage);
  const damage = scaledDamage((definition.effect.kind==='masks-shift'?maskDamage:definition.effect.damage) * (1 + count * (definition.basicCharge?.damagePerStack ?? 0)));
  return <button className={`basic-charge-meter${count === maximum ? ' full' : ''}`} aria-label={`${ownerLabel} ใช้ ${definition.name}`}
    title={`${definition.name} · ${chargeLabel} ${count}/${maximum} · ดาเมจ ${damage} · ${runtime.status === 'active' ? definition.effect.kind === 'summon' ? 'ภูตยังอยู่ · เรียกใหม่เมื่อสลาย' : 'กำลังใช้วิชา' : recharge ? 'ใช้ครั้งละ 1 ชาร์จ' : 'ใช้แต้มเมื่อออกวิชา'}`}
    disabled={finished || runtime.status !== 'ready' || runtime.queued} onClick={() => onCast(owner, runtime.abilityId)}>
    <span className="basic-charge-label">{chargeLabel} <b>{count}/{maximum}</b></span>
    <span className="basic-charge-pips" role="meter" aria-label={`แต้มวิชาธรรมดา ${ownerLabel}`} aria-valuenow={count} aria-valuemin={0} aria-valuemax={maximum}>
      {Array.from({ length: segments }, (_, i) => {
        const fill = maximum > 8 ? (count + progress) / maximum : i < count ? 1 : i === count ? progress : 0;
        return <i key={i} className={fill >= 1 ? 'lit' : ''}><span style={{ width: `${Math.max(0, Math.min(1, fill)) * 100}%` }} /></i>;
      })}
    </span>
  </button>;
}
export function CharacterAbilities({ owner, abilities, finished, onCast, compact = false, meters = false, ownerLabel }: { owner: string; abilities: AbilitySnapshot; finished: boolean; onCast: (ownerId: string, abilityId: string) => void; compact?: boolean; meters?: boolean; ownerLabel?: string }) {
  const runtimes = abilities.runtimes.filter(r => r.ownerId === owner && !abilities.definitions.find(d => d.id === r.abilityId)?.ultimate);
  return <div className={`fighter-skills${compact ? ' fighter-skills-inline' : ''}${meters ? ' fighter-side-meters' : ''}`} role="group" aria-label={`วิชา ${ownerLabel ?? label(owner)}`}>
    {runtimes.length === 0 && <span className="fighter-no-skills">ไม่มี Skill ใน Loadout</span>}
    {runtimes.map(r => {
      const definition = abilities.definitions.find(d => d.id === r.abilityId)!;
      const status = r.status === 'defeated' ? 'แพ้แล้ว' : finished ? 'จบรอบ' : r.queued ? definition.range === 0 ? compact ? 'รอชน' : 'เตรียมแล้ว · รอชน' : compact ? 'เตรียมแล้ว' : 'รอ Tick ถัดไป' : r.status === 'casting' ? compact ? 'กำลังใช้' : `กำลังใช้ ${(r.castRemaining / 60).toFixed(1)}s` : r.status === 'cooldown' ? `${(r.cooldownRemaining / 60).toFixed(1)}s` : definition.range === 0 && abilities.autoCast ? 'รอปะทะ' : 'พร้อมใช้';
      const remaining = r.status === 'cooldown' ? r.cooldownRemaining / Math.max(1, definition.cooldownTicks) : 0;
      if (meters) return <button key={r.abilityId} className={`ability-side-meter ${r.status}`} aria-label={`${ownerLabel ?? label(owner)} ใช้ ${definition.name}`} aria-description={status} title={`${definition.name} · ${status}`} disabled={finished || r.status !== 'ready' || r.queued} onClick={() => onCast(owner, r.abilityId)}>
        <span className="side-charge-track" aria-hidden="true"><span style={{ width: `${r.status === 'defeated' || finished ? 0 : (1 - Math.min(1, remaining)) * 100}%` }} /></span>
      </button>;
      return <button className={`fighter-skill ${r.status}`} key={r.abilityId} aria-label={`${label(owner)} ใช้ ${definition.name}`} title={`${scaledDamage(definition.effect.damage)} HP · ระดับระยะ ${definition.range} · ${ABILITY_RANGE_LABEL[definition.range]}${definition.range ? ` · ห่างขอบบอลไม่เกิน ${ABILITY_RANGE_GAP[definition.range]} WU` : ' · กดเตรียมแล้วรอชนจริง'}`} disabled={finished || r.status !== 'ready' || r.queued} onClick={() => onCast(owner, r.abilityId)}>
        <span>{definition.name}<span className="skill-range-label">ระยะ {definition.range} · {ABILITY_RANGE_LABEL[definition.range]}</span></span><small>{status}</small>
        {compact && <span className="skill-ready-track" aria-hidden="true"><span style={{ width: `${r.status === 'defeated' || finished ? 0 : (1 - Math.min(1, remaining)) * 100}%` }} /></span>}
        {!finished && remaining > 0 && <span className="skill-cooldown-bar" aria-hidden="true" style={{ width: `${Math.min(1, remaining) * 100}%` }} />}
      </button>;
    })}
  </div>;
}
export function UltimateMeter({ owner, abilities, finished, onCast, ownerLabel, combat }: {
  owner: string; abilities: AbilitySnapshot | null; finished: boolean; onCast: (ownerId: string, abilityId: string) => void; ownerLabel: string; combat?: CombatSnapshot;
}) {
  const runtime = abilities?.runtimes.find(r => r.ownerId === owner && r.maxCharge !== undefined);
  const definition = abilities?.definitions.find(d => d.id === runtime?.abilityId);
  if (!runtime || !definition) return <div className="ultimate-skill-slot" role="img" aria-label="อัลติเมต · อยู่ระหว่างพัฒนา" title="อัลติเมต · อยู่ระหว่างพัฒนา"><span className="ultimate-name-placeholder" aria-hidden="true" /><span className="side-charge-track" /></div>;
  const masks = definition.effect.kind === 'masks-awaken' ? abilities?.masks?.find(m=>m.ownerId===owner) : undefined;
  if(masks?.remaining.length&&!finished)return <div className="ultimate-skill-slot ultimate-meter ultimate-ready" title={`${definition.name} · เหลือ ${masks.remaining.map(f=>({wrath:'พิโรธ',sorrow:'โศก',smile:'ยิ้ม'}[f])).join(' · ')} · ไม่มีเวลาหมด`}>
    <span className="ultimate-skill-name attachment-title"><span>ตื่นรู้</span><b>{masks.remaining.length}/3</b></span>
    <UltimateCountBar count={masks.remaining.length} maximum={3} label={`หน้ากากตื่นรู้ที่เหลือ ${ownerLabel}`} />
  </div>;
  const gateCombo = definition.effect.kind === 'gates-combo' ? abilities?.gates?.find(g => g.ownerId === owner && g.ultimate) : undefined;
  if (gateCombo && !finished) return <div className="ultimate-skill-slot ultimate-meter ultimate-ready" title={`${definition.name} · ใช้ ${gateCombo.activeGates} ประตู`}>
    <span className="ultimate-skill-name attachment-title"><span>ชุดหมัด</span><b>{gateCombo.hitIndex}/{gateCombo.hits}</b></span>
    <UltimateCountBar count={gateCombo.hitIndex} maximum={gateCombo.hits} label={`ชุดหมัด ${ownerLabel}`} />
  </div>;
  if (runtime.activeTicksRemaining !== undefined && (definition.effect.kind === 'automaton-awaken' || definition.effect.kind === 'retrace-return' || definition.effect.kind === 'thorn-garden' || definition.effect.kind === 'guard-burst' || definition.effect.kind === 'impact-form' && definition.effect.endCondition === 'duration')) {
    const seconds = runtime.activeTicksRemaining / 60;
    const formName=definition.effect.kind==='automaton-awaken'?'เทพจักรกล':definition.effect.kind==='retrace-return'?'กระบี่ย้อน':definition.effect.kind==='thorn-garden'?'เรือนหนาม':definition.effect.kind==='guard-burst'?'ม่านวายุ':definition.effect.formName??'ร่างอัสนี';
    return <div className="ultimate-skill-slot ultimate-meter ultimate-ready" title={`${definition.name} · เหลือ ${seconds.toFixed(1)} วินาที`}>
      <span className="ultimate-skill-name attachment-title"><span>{formName}</span><b>{seconds.toFixed(1)} วิ</b></span>
      <span className="side-charge-track" role="meter" aria-label={`เวลา${formName}ที่เหลือ ${ownerLabel}`} aria-valuemin={0} aria-valuemax={definition.effect.durationTicks / 60} aria-valuenow={seconds}><span style={{width:`${100 * runtime.activeTicksRemaining / definition.effect.durationTicks}%`}} /></span>
    </div>;
  }
  if (runtime.activeHitsRemaining !== undefined && definition.effect.kind==='impact-form') return <div className="ultimate-skill-slot ultimate-meter ultimate-ready" title={`${definition.name} · โจมตีได้อีก ${runtime.activeHitsRemaining} ครั้ง · ${((runtime.activeTicksRemaining??0)/60).toFixed(1)} วินาที`}>
    <span className="ultimate-skill-name attachment-title"><span>{definition.effect.formName ?? 'ร่างอัสนี'}</span><b>{runtime.activeHitsRemaining}/{definition.effect.hits}</b></span>
    <UltimateCountBar count={runtime.activeHitsRemaining} maximum={definition.effect.hits} label={`จำนวนโจมตีอัลติที่เหลือ ${ownerLabel}`} />
  </div>;
  if (definition.ultimate?.resource === 'attached-summons') {
    const count = finished || runtime.status === 'defeated' ? 0 : runtime.charge ?? 0;
    return <div className={`ultimate-skill-slot attachment-ultimate ${count === runtime.maxCharge ? 'ultimate-ready' : ''}`} title={`${definition.name} · ภูตที่เกาะและยังอยู่ครบ 3 ตน ระเบิดอัตโนมัติ`}>
      <span className="ultimate-skill-name attachment-title"><span>{definition.name}</span> <b>{count}/{runtime.maxCharge}</b></span>
      <UltimateCountBar count={count} maximum={runtime.maxCharge!} label={`ภูตที่เกาะศัตรู ${ownerLabel}`} />
    </div>;
  }
  const armed = runtime.status === 'empowered' || runtime.status === 'casting';
  const ready = !finished && (runtime.status === 'ready' || runtime.status === 'empowered');
  const percent = finished || runtime.status === 'defeated' ? 0 : armed ? 100 : 100 * (runtime.charge ?? 0) / runtime.maxCharge!;
  const status = runtime.status === 'active' ? 'กำลังปล่อยวิชา' : runtime.status === 'casting' ? 'กำลังรวมปราณ' : runtime.status === 'empowered' ? definition.range === 0 ? 'พร้อมปะทะ · รอชนจริง' : 'พร้อมปล่อยวิชา' : runtime.status === 'ready' ? 'อัลติพร้อมใช้' : `${definition.ultimatePresentation?.label ?? 'พลัง'} ${Math.floor(runtime.charge ?? 0)}/${runtime.maxCharge}`;
  const display = ultimateDisplay(definition.ultimate!, definition.ultimatePresentation);
  if (display.kind === 'count') {
    const { count, maximum } = ultimateCounter(definition, runtime, owner, combat, finished);
    const remembered=abilities?.scribeCasts?.find(c=>c.ownerId===owner);
    const rememberedId=remembered?.recordedAbilityId??runtime.recordedAbilityId;
    const rememberedMode=remembered?.mode??runtime.recordedMode;
    const rememberedName=abilities?.definitions.find(d=>d.id===rememberedId)?.name;
    const memoryLabel=rememberedMode?{projectile:'กระสุน',melee:'ประชิด',field:'ค่ายกล',beam:'ลำแสง',summon:'ภูต'}[rememberedMode]:'ว่าง';
    const meterLabel=definition.effect.kind==='script-return'?'จำ: '+memoryLabel:display.label;
    const counter = `${meterLabel} ${count}/${maximum} ${definition.ultimatePresentation?.statusCounter ? 'ตรา · จำนวนสูงสุดบนศัตรูตัวเดียว ไม่รวมข้ามตัว' : display.unit}`;
    return <button className={`ultimate-skill-slot ultimate-meter event-ultimate ${runtime.status}${ready ? ' ultimate-ready' : ''}`}
      aria-label={`${ownerLabel} ใช้ ${definition.name}`} aria-description={`${counter} · ${status}`}
      title={`${definition.name} · ${counter} · ${status}${rememberedName?" · บันทึก: "+rememberedName:""}\n${definition.description ?? ''}`}
      disabled={finished || runtime.status !== 'ready' || runtime.queued} onClick={() => onCast(owner, runtime.abilityId)}>
      <span className="ultimate-skill-name attachment-title"><span>{meterLabel}</span><b>{count}/{maximum}</b>{ready && <b className="ultimate-counter-ready">พร้อม</b>}</span>
      <UltimateCountBar count={count} maximum={maximum} label={`${display.label} ${ownerLabel}`} status={`${counter} · ${status}`} />
    </button>;
  }
  return <button className={`ultimate-skill-slot ultimate-meter ${runtime.status}${ready ? ' ultimate-ready' : ''}`} aria-label={`${ownerLabel} ใช้ ${definition.name}`} aria-description={status}
    title={`${definition.name} · ${status}`} disabled={finished || runtime.status !== 'ready' || runtime.queued} onClick={() => onCast(owner, runtime.abilityId)}>
    <span className="ultimate-skill-name">{ready && <b className="ultimate-ready-label">พร้อม · </b>}{definition.name}</span>
    <span className="side-charge-track" role="meter" aria-label={`พลังอัลติเมต ${ownerLabel}`} aria-valuenow={runtime.charge ?? 0} aria-valuemin={0} aria-valuemax={runtime.maxCharge} aria-valuetext={status}><span style={{ width: `${percent}%` }} /></span>
  </button>;
}
function UltimateCountBar({ count, maximum, label, status }: { count: number; maximum: number; label: string; status?: string }) {
  const segments = Number.isInteger(maximum) && maximum <= 8 ? maximum : 5;
  return <span className="basic-charge-pips ultimate-count-bar" role="meter" aria-label={label} aria-valuenow={count} aria-valuemin={0} aria-valuemax={maximum} aria-valuetext={status}>
    {Array.from({length: segments}, (_, i) => {
      const fill = Math.max(0, Math.min(1, count / maximum * segments - i));
      return <i key={i} className={fill === 1 ? 'lit' : ''} aria-hidden="true"><span style={{width: `${fill * 100}%`}} /></i>;
    })}
  </span>;
}
export function AbilityLog({ abilities }: { abilities: AbilitySnapshot }) {
  return <section className="panel damage-panel"><div className="panel-heading"><h2>Ability log</h2><span className="micro-label">LAST 4 EVENTS</span></div>
    {abilities.events.length === 0 ? <p className="helper">รอการใช้ Skill…</p> : abilities.events.slice(-4).reverse().map(e => <div className="event-row" key={e.id}>
      <div><strong>{label(e.ownerId)} · {e.kind} · {abilities.definitions.find(d => d.id === e.abilityId)?.name ?? e.abilityId}</strong><small>{e.reason ? reasons[e.reason] ?? e.reason : e.targetId ? `เป้าหมาย ${label(e.targetId)}` : '—'}</small></div><time>{(e.tick / 60).toFixed(2)}s</time>
    </div>)}
  </section>;
}
