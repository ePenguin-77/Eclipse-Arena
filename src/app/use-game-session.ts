import { useCallback, useEffect, useRef, useState } from 'react';
import { GameSession } from './game-session';
import type { SandboxCommand } from './sandbox-controller';
import type { SandboxConfig } from '../content/scenarios';
import { CanvasRenderer, DEFAULT_VIEW, type ViewOptions } from '../presentation/canvas-renderer';
import { VISUAL_ASSETS } from '../content/visual-assets';
import { VFX_DEFINITION } from '../content/vfx';
import { ARENA_REGISTRY } from './arena-catalog';
import { MOBILE_LANDSCAPE, usePortraitGuard } from './use-portrait-guard';


export function useGameSession() {
  const portraitRequired = usePortraitGuard();
  const [session] = useState(() => new GameSession());
  const [renderer] = useState(() => new CanvasRenderer(VISUAL_ASSETS, VFX_DEFINITION, Object.fromEntries(ARENA_REGISTRY.list().map(a => [a.id, a.visual]))));
  const [snapshot, setSnapshot] = useState(() => session.controller.snapshot());
  const [screen, setScreen] = useState(() => session.screen);
  const [announcement, setAnnouncement] = useState(() => session.presentation.current);
  const [view] = useState<ViewOptions>(() => ({ ...DEFAULT_VIEW, arenaMeasurements: false, reducedVfx: window.matchMedia('(prefers-reduced-motion: reduce)').matches }));
  const viewRef = useRef(view); const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { viewRef.current = view; }, [view]);
  const sync = useCallback(() => { setSnapshot(session.controller.snapshot()); setScreen(session.screen); setAnnouncement(session.presentation.current); }, [session]);
  const send = useCallback((command: SandboxCommand) => {
    session.dispatch(command);
    if (['reset', 'configure', 'new-round'].includes(command.type)) renderer.clear();
    sync();
  }, [session, renderer, sync]);
  const start = (config: SandboxConfig) => { session.start(config); renderer.clear(); sync(); };
  const rematch = () => { session.rematch(); renderer.clear(); sync(); };
  const setup = () => { session.setup(); sync(); };
  useEffect(() => {
    if (portraitRequired) send({ type: 'pause' });
  }, [portraitRequired, send]);
  useEffect(() => {
    const mobileLandscape = window.matchMedia(MOBILE_LANDSCAPE);
    let frame = 0, previous = performance.now(), lastUi = previous;
    const loop = (now: number) => {
      if (!mobileLandscape.matches) session.advance((now - previous) / 1000);
      previous = now;
      const state = session.controller.snapshot();
      setAnnouncement(session.presentation.current);
      if (canvasRef.current) renderer.render(canvasRef.current, state, viewRef.current, session.controller.interpolationAlpha);
      if (now - lastUi >= 80) { setSnapshot(state); setScreen(session.screen); lastUi = now; }
      frame = requestAnimationFrame(loop);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (mobileLandscape.matches || session.screen !== 'battle' || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
        (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, button, a, summary'))) return;
      if (event.code === 'Space') { event.preventDefault(); send({ type: session.controller.snapshot().state === 'running' ? 'pause' : 'resume' }); }
    };
    const visibility = () => { previous = performance.now(); if (document.hidden) send({ type: 'pause' }); };
    window.addEventListener('keydown', keyboard); document.addEventListener('visibilitychange', visibility);
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', keyboard); document.removeEventListener('visibilitychange', visibility); };
  }, [session, renderer, send]);
  return { snapshot, screen, announcement, view, canvasRef, send, start, rematch, setup, portraitRequired };
}
