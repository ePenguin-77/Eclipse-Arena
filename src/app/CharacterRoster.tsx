import { useState, type CSSProperties } from 'react';
import { CharacterCatalogueRow } from './CharacterCatalogueRow';
import { CHARACTER_REGISTRY } from './character-catalog';
import { CharacterPortrait } from './CharacterPortrait';
import { VISUAL_ASSETS } from '../content/visual-assets';
import { PROTOTYPE_ABILITIES } from '../content/abilities';
import './character-selection.css';

/** Each fighter owns its arrows; the catalogue edits only the active slot. */
export function CharacterRoster({ ids, count, hp, onSelect }: { ids: string[]; count: number; hp?: number[]; onSelect: (slot: number, id: string) => void; artworkChoices?: Record<string,string> }) {
  const [requestedSlot, setSlot] = useState(0);
  const slot = Math.min(requestedSlot, count - 1);
  const characters = CHARACTER_REGISTRY.list();
  const selected = characters.find(c => c.id === ids[slot])!;
  const sideName = (index: number) => count === 2 ? (index === 0 ? 'ฝั่งซ้าย' : 'ฝั่งขวา') : `ผู้ประลอง ${index + 1}`;
  const choose = (index: number, id: string) => { setSlot(index); onSelect(index, id); };
  const cycle = (index: number, direction: number) => {
    const current = characters.findIndex(c => c.id === ids[index]);
    choose(index, characters[(current + direction + characters.length) % characters.length]!.id);
  };
  const basic = PROTOTYPE_ABILITIES.find(a => a.id === selected.kit.basic);
  const ultimate = PROTOTYPE_ABILITIES.find(a => a.id === selected.kit.ultimate);
  return <section className="character-selection" aria-label="เลือกผู้ประลอง">
    <div className="selection-duel" aria-label="ช่องผู้ประลอง">
      {ids.slice(0, count).map((id, index) => {
        const c = characters.find(character => character.id === id)!;
        const art = c.visual.artwork;
        return <article key={index} className={`selection-fighter${index % 2 ? ' mirrored' : ''}${slot === index ? ' active' : ''}`} style={{
          '--fighter-color': c.visual.color,
          '--selection-showcase-scale': art?.showcaseScale ?? 1,
          '--selection-showcase-y': `${(art?.showcaseOffsetY??0)*100}%`,
        } as CSSProperties} aria-label={`${sideName(index)} · ${c.name}`}>
          <div className="selection-fighter-controls">
            <button type="button" className="selection-arrow" aria-label={`ตัวละครก่อนหน้า · ${sideName(index)}`} onClick={() => cycle(index, -1)}>‹</button>
            <button type="button" className="selection-slot" aria-label={`เลือก${sideName(index)} · ${c.name}`} aria-pressed={slot === index} onClick={() => setSlot(index)}>
              <CharacterPortrait visual={c.visual} name={c.name} />
              <span><small>{sideName(index)}</small><b>{c.name}</b></span>
            </button>
            <button type="button" className="selection-arrow" aria-label={`ตัวละครถัดไป · ${sideName(index)}`} onClick={() => cycle(index, 1)}>›</button>
          </div>
          <button type="button" className="selection-hero" aria-label={`ดูรายละเอียด ${c.name} · ${sideName(index)}`} aria-pressed={slot === index} onClick={() => setSlot(index)}>
            <div className="selection-art" key={c.id}>{art?.auraAssetId && <img className="portrait-aura" src={VISUAL_ASSETS[art.auraAssetId]} alt="" aria-hidden="true" />}{art && <img src={VISUAL_ASSETS[art.assetId]} alt={c.name} />}</div>
            <div className="selection-identity"><small>{c.epithet ?? c.role}</small><h3>{c.name}</h3><p>{c.discipline}</p><p className="selection-description">{c.description}</p><div className="selection-stats"><span>HP <b>{hp?.[index] ?? c.stats.maxHP}</b></span><span>ความเร็ว <b>{c.physics.targetSpeed}</b></span></div></div>
          </button>
        </article>;
      })}
    </div>
    <div className="selection-catalogue-heading selection-catalogue-instructions">
      <p role="status">เลือกให้<span>{sideName(slot)}</span><small>{characters.length} ตัวละคร · เลือกซ้ำได้ · ลากเพื่อเลื่อน</small></p>
    </div>
    <CharacterCatalogueRow title="ตัวละครชาย" characters={characters.filter(c=>c.gender==='male')} selectedId={selected.id} sideName={sideName(slot)} onSelect={id=>choose(slot,id)} />
    <CharacterCatalogueRow title="ตัวละครหญิง" characters={characters.filter(c=>c.gender==='female')} selectedId={selected.id} sideName={sideName(slot)} onSelect={id=>choose(slot,id)} />
    <details className="selection-kit">
      <summary>วิชาและรายละเอียด · {selected.name}<span aria-hidden="true">＋</span></summary>
      <p>{selected.description}</p>
      <div className="character-kit-review" aria-label={`ชุดวิชา ${selected.name}`}>
        <div><small>ติดตัว · Passive</small><strong>{selected.kit.passive?.name ?? 'อยู่ระหว่างพัฒนา'}</strong><p>{selected.kit.passive?.description}</p></div>
        <div><small>โจมตีธรรมดา</small><strong>{basic?.name}</strong><p>{basic?.description}</p></div>
        <div><small>อัลติเมต</small><strong>{ultimate?.name ?? 'อยู่ระหว่างพัฒนา'}</strong><p>{ultimate?.description}</p></div>
      </div>
    </details>
  </section>;
}
