import { useEffect, useRef, useState } from 'react';
import type { SandboxConfig } from '../content/scenarios';
import { DEFAULT_CHARACTER_IDS } from '../content/characters';
import { ARENA_REGISTRY } from './arena-catalog';
import { CHARACTER_REGISTRY } from './character-catalog';
import { CharacterPortrait } from './CharacterPortrait';
import { ArenaSelect } from './ArenaSelect';
import { CharacterRoster } from './CharacterRoster';


const steps = ['รูปแบบและสนาม', 'เลือกตัวละคร', 'พร้อมประลอง'];
export function MatchSetup({ config, onStart }: { config: SandboxConfig; onStart: (config: SandboxConfig) => void }) {
  const [draft, setDraft] = useState(config);
  const [step, setStep] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const signature = JSON.stringify(config);
  useEffect(() => setDraft(JSON.parse(signature) as SandboxConfig), [signature]);
  const ids = draft.characterIds ?? [...DEFAULT_CHARACTER_IDS];
  const arena = ARENA_REGISTRY.get(draft.arenaId ?? 'baseline');
  const selectStep = (next: number, focus = false) => { setStep(next); if (focus) tabRefs.current[next]?.focus(); };
  return <div className="setup-flow">
    <section className="menu-hero"><div className="hero-copy"><p className="eyebrow">ECLIPSE ARENA · วิถีแห่งเซียน</p><h1 tabIndex={-1}>จัดทัพประชันเซียน</h1><p>เลือกสนาม รวมเหล่าเซียน แล้วก้าวสู่การประลอง</p></div></section>
    <div className="setup-tabs" role="tablist" aria-label="ขั้นตอนจัดการประลอง">{steps.map((name, index) => <button key={name} ref={node => { tabRefs.current[index] = node; }} id={`setup-tab-${index}`} role="tab" aria-selected={step === index} aria-controls={`setup-panel-${index}`} tabIndex={step === index ? 0 : -1} onClick={() => selectStep(index)} onKeyDown={e => {
      const next = e.key === 'ArrowRight' ? (index + 1) % 3 : e.key === 'ArrowLeft' ? (index + 2) % 3 : e.key === 'Home' ? 0 : e.key === 'End' ? 2 : null;
      if (next !== null) { e.preventDefault(); selectStep(next, true); }
    }}><span>{String(index + 1).padStart(2, '0')}</span>{name}</button>)}</div>
    <section className="setup-step-panel" role="tabpanel" id={`setup-panel-${step}`} aria-labelledby={`setup-tab-${step}`} tabIndex={0}>
      {step === 0 && <><section className="setup-count" aria-label="จำนวนผู้ประลอง"><div><h2>กี่วิถีในลานเดียว</h2><p>ประลองอิสระ · ทุกคนเป็นคู่ต่อสู้</p></div><div className="count-options">{([2, 3, 4] as const).map(count => <button key={count} aria-pressed={draft.count === count} onClick={() => setDraft(d => ({ ...d, count }))}>{count}<span>ผู้ประลอง</span></button>)}</div></section><ArenaSelect setup arenas={ARENA_REGISTRY.list()} selected={arena.id} onSelect={arenaId => setDraft(d => ({ ...d, arenaId }))} /></>}
      {step === 1 && <CharacterRoster ids={ids} count={draft.count} hp={draft.combatHP} artworkChoices={draft.artworkChoices} onSelect={(slot, id) => setDraft(d => ({ ...d, characterIds: ids.map((v, i) => i === slot ? id : v), combatHP: undefined }))} />}
      {step === 2 && <div className="match-confirm"><div className="confirm-heading"><p className="eyebrow">เหล่าเซียนพร้อมแล้ว</p><h2>{arena.name}</h2><p>{draft.count} ผู้ประลอง · ใช้วิชาอัตโนมัติ</p></div><div className="confirm-lineup">{ids.slice(0, draft.count).map((id, index) => { const c = CHARACTER_REGISTRY.get(id); return <article key={index}><CharacterPortrait visual={c.visual} name={c.name} /><span className="confirm-epithet">{c.epithet}</span><strong>{c.name}</strong><small>{c.discipline ?? c.role} · HP {draft.combatHP?.[index] ?? c.stats.maxHP}</small></article>; })}</div><p className="confirm-note">ทิศออกตัวสุ่มใหม่ทุกครั้ง · วิชาฝ่ามือทำงานเมื่อปะทะจริง</p></div>}
    </section>
    <div className="setup-navigation"><div className="setup-summary"><strong>{arena.name}</strong><span>{draft.count} ผู้ประลอง · {step + 1} / 3</span></div><div className="setup-nav-actions">{step > 0 && <button className="game-secondary" onClick={() => selectStep(step - 1, true)}>ย้อนกลับ</button>}{step < 2 ? <button className="game-primary" onClick={() => selectStep(step + 1, true)}>{step === 0 ? 'เลือกตัวละคร' : 'ตรวจความพร้อม'} <span aria-hidden="true">→</span></button> : <button className="game-primary" onClick={() => onStart({ ...draft, characterIds: [...ids], scenario: 'chaos', combatEnabled: true, abilitiesEnabled: true, abilityAutoCast: true })}>เริ่มประลอง <span aria-hidden="true">→</span></button>}</div></div>
  </div>;
}
