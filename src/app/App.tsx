import { useEffect, useRef } from 'react';
import { useGameSession } from './use-game-session';
import { MatchSetup } from './MatchSetup';
import { MatchResult } from './MatchResult';
import { BattleAbilityHUD } from './BattleAbilityHUD';
import { UltimateAnnouncement } from './UltimateAnnouncement';
import { ARENA_REGISTRY } from './arena-catalog';
import { UI_ASSETS } from '../content/ui-assets';
import './styles.css';
import './game-ui.css';
import './setup-flow.css';
import './mobile-battle.css';
import './jade-battle-hud.css';
import './charge-hud.css';
import './character-identity.css';
import './illustrated-ui.css';

export function App() {
  const game = useGameSession();
  const { snapshot, screen, view, canvasRef, send } = game;
  const mainRef = useRef<HTMLElement>(null);
  const arena = ARENA_REGISTRY.get(snapshot.arena.id);
  const paused = snapshot.state === 'paused';
  useEffect(() => {
    mainRef.current?.querySelector('h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);
  return <><div data-reduced-vfx={view.reducedVfx} data-paused={paused || !!game.announcement} inert={game.portraitRequired} className={`app-shell game-shell screen-${screen}`} style={{ '--menu-art': `url("${UI_ASSETS.hero}")` } as React.CSSProperties}>
    <a href="#main" className="skip-link">ข้ามไปเนื้อหา</a>
    <header className="masthead"><button className="brand brand-home" onClick={game.setup} aria-label="Eclipse Arena · กลับไปจัดทีม"><img src={UI_ASSETS.emblem} alt="" /><span>ECLIPSE <b>ARENA</b></span></button><nav aria-label="ขั้นตอนการประลอง"><span aria-current={screen === 'setup' ? 'step' : undefined}>จัดทีม</span><i /><span aria-current={screen === 'battle' ? 'step' : undefined}>ประลอง</span><i /><span aria-current={screen === 'result' ? 'step' : undefined}>ผลการแข่งขัน</span></nav></header>
    <main id="main" ref={mainRef}>
      {screen === 'setup' && <MatchSetup config={snapshot.config} onStart={game.start} />}
      {screen === 'battle' && <>
        <div className="battle-heading"><div><p className="eyebrow">ลานแห่งการประชันวิชา</p><h1 tabIndex={-1}>{arena.name}</h1></div><div className="battle-clock" aria-label="เวลาประลอง">{snapshot.time.toFixed(1)} <small>วินาที</small><span>{paused ? 'หยุดชั่วคราว' : 'กำลังประลอง'}</span></div></div>
        <div className={`battle-layout count-${snapshot.combat?.combatants.length ?? snapshot.bodies.length}`}>
          {snapshot.combat && <BattleAbilityHUD tick={snapshot.tick} combat={snapshot.combat} characters={snapshot.characters} abilities={snapshot.abilities} onCast={(ownerId, abilityId) => send({ type: 'cast', ownerId, abilityId })} />}
          <section className="battle-stage panel" aria-label="สนามต่อสู้">
            <div className="arena-viewport"><canvas ref={canvasRef} aria-label={`สนาม ${arena.name} ${snapshot.arena.width} คูณ ${snapshot.arena.height} World Units`} role="img" /></div>
          </section>
            <div className="battle-controls"><button className="game-primary" onClick={() => send({ type: paused ? 'resume' : 'pause' })}>{paused ? 'เล่นต่อ' : 'หยุดชั่วคราว'} <kbd>SPACE</kbd></button><button className="game-secondary" onClick={game.rematch}>เริ่มรอบใหม่</button><button className="game-secondary" onClick={game.setup}>กลับไปจัดทีม</button></div>

        </div>
      </>}
      {screen === 'result' && <MatchResult snapshot={snapshot} onRematch={game.rematch} onSetup={game.setup} />}
    </main>
    <footer className="game-footer"><span>ECLIPSE ARENA · วิถีแห่งเซียน</span><span>Phase 10.40 · หน้ากากสามวิญญาณ · v0.47.0</span></footer>
    {screen === 'battle' && <UltimateAnnouncement announcement={game.announcement} reducedMotion={view.reducedVfx} />}
  </div>{game.portraitRequired && <section className="portrait-guard" role="alert" aria-labelledby="portrait-title"><div className="portrait-device" aria-hidden="true">↶</div><h1 id="portrait-title">หมุนเครื่องเป็นแนวตั้ง</h1><p>จัดทัพและประลองในแนวตั้ง เพื่อมองเห็นสนามได้ครบ</p>{screen === 'battle' && <p className="portrait-pause">พักการประลองให้แล้ว · หมุนกลับแล้วกดเล่นต่อ</p>}</section>}</>;
}
