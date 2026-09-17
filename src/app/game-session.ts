import { DEFAULT_CONFIG, type SandboxConfig } from '../content/scenarios';
import { DEFAULT_CHARACTER_IDS } from '../content/characters';
import { SandboxController, type SandboxCommand } from './sandbox-controller';
import { UltimatePresentation } from './ultimate-presentation';

export type GameScreen = 'setup' | 'battle' | 'result';
export const GAME_DEFAULTS: SandboxConfig = { ...DEFAULT_CONFIG, scenario: 'chaos', arenaId: 'baseline',
  combatEnabled: true, abilitiesEnabled: true, abilityAutoCast: true, characterIds: [...DEFAULT_CHARACTER_IDS] };

/** Navigation policy belongs to the app; simulation has no knowledge of screens. */
export class GameSession {
  readonly controller: SandboxController;
  readonly presentation = new UltimatePresentation();
  private capture = () => {
    const snapshot = this.controller.snapshot();
    if (snapshot.state === 'finished') { this.presentation.clear(); return false; }
    return this.presentation.capture(snapshot.abilities, snapshot.characters);
  };
  private route: 'setup' | 'battle' = 'setup';
  constructor(private readonly randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]!) {
    this.controller = new SandboxController(GAME_DEFAULTS, randomSeed);
    this.controller.dispatch({ type: 'pause' });
  }
  get screen(): GameScreen { return this.route === 'setup' ? 'setup' : this.controller.snapshot().state === 'finished' ? 'result' : 'battle'; }
  start(config: SandboxConfig) {
    const previous = this.controller.snapshot().config.seed;
    const sampled = this.randomSeed();
    this.controller.dispatch({ type: 'configure', config: { ...config, seed: sampled === previous ? (sampled + 1) >>> 0 : sampled } });
    this.presentation.clear();
    this.route = 'battle'; this.controller.dispatch({ type: 'resume' });
  }
  rematch() {
    this.controller.dispatch({ type: 'new-round' }); this.route = 'battle'; this.controller.dispatch({ type: 'resume' });
    this.presentation.clear();
  }
  setup() { this.controller.dispatch({ type: 'pause' }); this.route = 'setup'; this.presentation.clear(); }
  advance(delta: number) {
    if (this.route !== 'battle' || this.controller.snapshot().state !== 'running') return;
    if (this.presentation.active) { this.presentation.advance(delta); return; }
    this.controller.advance(delta, this.capture);
  }
  dispatch(command: SandboxCommand) {
    if (this.presentation.active && (command.type === 'step' || command.type === 'step-second')) {
      this.controller.dispatch({ type: 'pause' });
      this.presentation.advance(command.type === 'step' ? 1 / 60 : 1);
      return;
    }
    this.controller.dispatch(command, this.route === 'battle' ? this.capture : undefined);
    if (['reset', 'configure', 'new-round'].includes(command.type)) this.presentation.clear();
    // Debug step is explicit; leaving it must never start a hidden battle in setup.
    if (this.route === 'setup') this.controller.dispatch({ type: 'pause' });
  }
}
