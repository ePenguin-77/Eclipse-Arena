import type { SandboxController } from './sandbox-controller';
import { VISUAL_ASSETS } from '../content/visual-assets';
import { CharacterPortrait } from './CharacterPortrait';
import { UI_ASSETS } from '../content/ui-assets';

export function MatchResult({ snapshot, onRematch, onSetup }: { snapshot: ReturnType<SandboxController['snapshot']>; onRematch: () => void; onSetup: () => void }) {
  const combat = snapshot.combat!, winner = snapshot.characters.find(c => c.entityId === combat.winnerId);

  return <section className="result-screen" aria-label="ผลการประลอง">
    <img className="result-emblem" src={UI_ASSETS.emblem} alt="" />
    <p className="eyebrow">สิ้นสุดการประลอง</p><h1 tabIndex={-1}>{combat.winnerId ? 'หนึ่งวิถีเหนือสรรพสิ่ง' : 'เสมอบนลานประลอง'}</h1>
    <p className="result-subtitle">{combat.winnerId ? `${winner?.name ?? 'ผู้ประลอง'} ครองชัย` : 'เสมอ · ไม่มีผู้ประลองเหลืออยู่ในลาน'}</p>
    {winner && <p className="result-identity">{winner.epithet} · {winner.discipline}</p>}
    {winner?.visual.artwork && <div className="victor-art">{winner.visual.artwork.auraAssetId && <img className="portrait-aura" src={VISUAL_ASSETS[winner.visual.artwork.auraAssetId]} alt="" aria-hidden="true" />}<img src={VISUAL_ASSETS[winner.visual.artwork.assetId]} alt={`ผู้ชนะ ${winner.name}`} /></div>}
    <div className="result-facts"><div><span>เวลาประลอง</span><strong>{snapshot.time.toFixed(1)} <small>วินาที</small></strong></div><div><span>ผู้ประลอง</span><strong>{snapshot.bodies.length}</strong></div><div><span>ความเสียหายรวม</span><strong>{Math.round(combat.totalDamage)}</strong></div></div>
    <div className="result-roster">{combat.combatants.map(c => { const character = snapshot.characters.find(a => a.entityId === c.id); return <div key={c.id}>{character && <CharacterPortrait visual={character.visual} name={character.name} />}<span><strong>{character?.name ?? 'ผู้ประลอง'}</strong><small className="result-character-path">{[character?.epithet, character?.discipline].filter(Boolean).join(' · ')}</small><small>{c.alive ? `ผู้ชนะ · HP ${Math.ceil(c.hp)}` : 'พ่ายแพ้ · HP 0'}</small></span></div>; })}</div>
    <div className="result-actions"><button className="game-primary" onClick={onRematch}>ประลองอีกครั้ง</button><button className="game-secondary" onClick={onSetup}>กลับไปจัดทีม</button></div>
  </section>;
}
