import type { AbilitySnapshot } from '../contracts/abilities';
import type { CharacterSnapshot } from '../contracts/characters';
import type { CombatSnapshot } from '../contracts/combat';
import { characterColor } from '../presentation/character-view';
import { BasicChargeMeter, UltimateMeter } from './AbilityHUD';
import { CharacterBackdrop } from './CharacterPortrait';
import { VISUAL_ASSETS } from '../content/visual-assets';

/** One panel above the arena per fighter owns their health and ability presentation. */
export function BattleAbilityHUD({ combat, characters, abilities, onCast, tick = 0 }: {
  tick?: number;
  combat: CombatSnapshot;
  characters: readonly CharacterSnapshot[];
  abilities: AbilitySnapshot | null;
  onCast: (ownerId: string, abilityId: string) => void;
}) {
  return <aside className="battle-abilities" aria-label="HP และวิชาเหนือสนาม">
    <div className="fighter-grid">{combat.combatants.map((fighter, index) => {
      const character = characters.find(c => c.entityId === fighter.id);
      const name = character?.name ?? `ผู้ประลอง ${index + 1}`;
      const ownerLabel = `${name} คนที่ ${index + 1}`;
      const attached = abilities?.summons?.filter(s => s.attachedTo === fighter.id) ?? [];
      const rewind=abilities?.timeRewinds?.find(r=>r.ownerId===fighter.id);
      const fuel=abilities?.soulFuel?.find(r=>r.ownerId===fighter.id)?.amount??0;
      const prisms=abilities?.crystalPrisms?.filter(p=>p.ownerId===fighter.id).length??0;
      const thorns=abilities?.thornTraps?.filter(p=>p.ownerId===fighter.id).length??0;
      const feathers=abilities?.featherPins?.filter(p=>p.ownerId===fighter.id).length??0;
      const timeMarks=abilities?.timeMarks?.filter(m=>m.targetId===fighter.id)??[];
      const restored=(combat.recoveryEvents??[]).filter(e=>e.ownerId===fighter.id&&e.kind==='time-rewind'&&tick>=e.tick&&tick-e.tick<60).reduce((n,e)=>n+e.amount,0);
      const recovered = (combat.recoveryEvents ?? []).filter(e => e.ownerId === fighter.id && e.kind === 'lifesteal' && tick >= e.tick && tick - e.tick < 60).reduce((n, e) => n + e.amount, 0);
      const color = characterColor(characters, fighter.id, index);
      const backdrop = VISUAL_ASSETS[character?.visual.hudBackgroundAssetId ?? 'jade-frame-v3'] ?? VISUAL_ASSETS['jade-frame-v3'];
      const robot=abilities?.automatons?.find(r=>r.ownerId===fighter.id);
      const scene = character?.visual.hudScene;
      const sceneImage = scene && VISUAL_ASSETS[scene.assetId];
      return <section key={fighter.id} data-character={character?.definitionId} className={`fighter-card ability-owner-card${fighter.alive ? '' : ' defeated'}`} aria-label={`สถานะ ${ownerLabel}`} style={{ '--body-color': color, '--aura-color': character?.visual.auraColor ?? color, '--fighter-backdrop': `url("${backdrop}")`, '--fighter-backdrop-height': `${100 * (character?.visual.hudBackgroundScaleY ?? 1)}%` } as React.CSSProperties}>
        {scene && sceneImage && <div className="fighter-scene" aria-hidden="true" style={{
          backgroundImage: `linear-gradient(180deg, #06101930, transparent 65%), url("${sceneImage}")`,
          left: `${scene.insetX * 100}%`, right: `${scene.insetX * 100}%`,
          height: `${(1 - 2 * scene.insetY) * (character?.visual.hudBackgroundScaleY ?? 1) * 100}%`,
        }} />}
        {character && <div className="fighter-art-stage" aria-hidden="true"><CharacterBackdrop visual={character.visual} /></div>}
        <div className="fighter-identity"><div className="fighter-identity-copy">
          <h2 className="ability-owner" title={[name, character?.epithet, character?.discipline].filter(Boolean).join(' · ')}>{name}{!fighter.alive && <span className="fighter-ko">แพ้</span>}</h2>
          <div className="fighter-health"><span>HP</span><strong>{Math.ceil(fighter.hp)}<small>/{Math.ceil(fighter.maxHP)}</small></strong></div>
          <div className="fighter-statuses" aria-label={`สถานะ ${ownerLabel}`}>
            {robot&&<span className="fighter-status-chip" title={`หุ่นกล ${Math.ceil(robot.hp)}/${robot.maxHP} HP${robot.charged?' · ชุดถัดไปเจาะทะลุ':''}`}>หุ่น {Math.ceil(robot.hp)}/{robot.maxHP}{robot.charged?' · เจาะ':''}</span>}
            {fighter.alive && prisms>0 && <span className="fighter-status-chip" title="ผลึกปักกำแพงสำหรับหักเหกระสุน">ผลึก {prisms}/2</span>}
            {fighter.alive && thorns>0 && <span className="fighter-status-chip" title="ดอกหนามบนขอบกำแพง">หนาม {thorns}/4</span>}
            {fighter.alive && feathers>0 && <span className="fighter-status-chip" title="ขนนกที่ปักไว้พร้อมเรียกกลับ">ขนปัก {feathers}/5</span>}
            {fighter.alive && fuel>0 && <span className="fighter-status-chip" title="เพิ่มภูตอัลติหนึ่งตนต่อเชื้อวิญญาณ">เชื้อ {fuel}/3</span>}
            {fighter.alive && rewind && <span className="fighter-status-chip" title="กำลังบันทึกบาดแผล รอย้อนกลับเมื่อทรายหมด">ย้อนกาล {Math.max(0,(rewind.endsTick-tick)/60).toFixed(1)}s</span>}
            {fighter.alive && timeMarks.length>0 && <span className="fighter-status-chip" title="บาดแผลระหว่างติดตราจะเกิดดาเมจซ้ำบางส่วน">รอยกาล</span>}
            {fighter.alive && restored>0 && <span className="fighter-status-chip" title="HP ที่ย้อนคืนจริง">คืน HP +{restored.toFixed(1)}</span>}
            {fighter.alive && recovered > 0 && <span className="fighter-status-chip" style={{ color: '#a3edc7' }} title="HP ที่ดูดคืนจริงใน 1 วินาทีล่าสุด">ดูดเลือด +{recovered.toFixed(1)}</span>}
            {attached.length > 0 && <span className="fighter-status-chip summon-status" title={attached.map(s => `${s.name} · กระแทกอีก ${s.impactsRemaining} ครั้งจะสลาย · ${characters.find(c => c.entityId === s.ownerId)?.name}`).join(' / ')}>ภูต {attached.length}</span>}
            {(combat.statuses ?? []).filter(s => s.targetId === fighter.id).map(s => <span className="fighter-status-chip" key={`${s.definition.id}-${s.sourceId}`} style={s.definition.vfxColor ? { color: s.definition.vfxColor, borderColor: s.definition.vfxColor } : undefined} title={`ติดสถานะ ${s.definition.name}${s.definition.effect.kind === 'speed-modifier' ? ` · ลดความเร็ว ${Math.round(s.definition.effect.reductionPerStack * s.stacks * 100)}%` : s.definition.effect.kind === 'freeze' ? ' · หยุดเคลื่อนที่และใช้วิชา' : s.definition.effect.kind === 'mark' ? ` · จาก ${characters.find(c => c.entityId === s.sourceId)?.name ?? 'ผู้ใช้'} · ครบ 3 ตราจะถูกดึง` : ''}`}>
              {s.definition.name}{s.definition.stacking === 'stack' ? ` ${s.stacks}/${s.definition.maxStacks}` : ''}
            </span>)}
          </div>
        </div></div>
        <div className="battle-skill-slots" aria-label={`ช่องวิชาของ ${ownerLabel}`}>
          <div className="basic-skill-slot" role="group" aria-label="โจมตีธรรมดา">
            <BasicChargeMeter ownerLabel={ownerLabel} owner={fighter.id} abilities={abilities} finished={combat.status === 'finished'} onCast={onCast} />
          </div>
          <UltimateMeter owner={fighter.id} abilities={abilities} combat={combat} finished={combat.status === 'finished'} onCast={onCast} ownerLabel={ownerLabel} />
        </div>
      </section>;
    })}</div>
  </aside>;
}
