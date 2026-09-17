import { PHYSICS } from '../config/physics';
import { SimulationWorld } from './simulation-world';

export type MatchCommand<TConfig> = { type: 'pause' | 'resume' | 'step' | 'step-second' | 'reset' } | { type: 'configure'; config: TConfig } | { type: 'cast'; ownerId: string; abilityId: string };
export class MatchController<TConfig extends object> {
  private config: TConfig;
  private world: SimulationWorld;
  private accumulator = 0;
  private state: 'running' | 'paused' = 'running';
  private dropped = 0;
  private presentationSettled = true;
  constructor(config: TConfig, private readonly buildWorld: (config: TConfig) => SimulationWorld) {
    this.config = structuredClone(config);
    this.world = this.buildWorld(structuredClone(this.config));
  }
  dispatch(command: MatchCommand<TConfig>, stopAfterTick: () => boolean = () => false) {
    switch (command.type) {
      case 'cast': this.world.queueAbility(command.ownerId, command.abilityId); break;
      case 'pause': this.state = 'paused'; this.accumulator = 0; this.presentationSettled = true; break;
      case 'resume': this.state = 'running'; this.accumulator = 0; break;
      case 'step': this.state = 'paused'; this.accumulator = 0; this.world.step(); stopAfterTick(); this.presentationSettled = true; break;
      case 'step-second':
        this.state = 'paused'; this.accumulator = 0;
        for (let tick = 0; tick < 60 && !this.world.finished; tick++) { this.world.step(); if (stopAfterTick()) break; }
        this.presentationSettled = true; break;
      case 'configure':
        // Build first, so a rejected configuration cannot partially mutate a match.
        this.world = this.buildWorld(structuredClone(command.config));
        this.config = structuredClone(command.config);
        this.accumulator = 0; this.dropped = 0; this.presentationSettled = true;
        break;
      case 'reset': this.world = this.buildWorld(structuredClone(this.config)); this.accumulator = 0; this.dropped = 0; this.presentationSettled = true; break;
    }
  }
  advance(realDelta: number, stopAfterTick: () => boolean = () => false) {
    if (this.state !== 'running' || this.world.finished || !Number.isFinite(realDelta) || realDelta <= 0) return;
    const accepted = Math.min(realDelta, PHYSICS.maxFrameDelta);
    const budget = PHYSICS.fixedDt * PHYSICS.maxCatchUpTicks;
    const total = this.accumulator + accepted;
    this.dropped += realDelta - accepted + Math.max(0, total - budget);
    this.accumulator = Math.min(total, budget);
    while (this.accumulator + 1e-12 >= PHYSICS.fixedDt) {
      this.world.step();
      if (stopAfterTick()) { this.accumulator = 0; this.presentationSettled = true; break; }
      this.presentationSettled = false;
      this.accumulator = Math.max(0, this.accumulator - PHYSICS.fixedDt);
      if (this.world.finished) { this.accumulator = 0; break; }
    }
  }
  /** Read-only presentation fraction; never advances or alters simulation. */
  get interpolationAlpha() { return this.state === 'running' && !this.world.finished && !this.presentationSettled ? this.accumulator / PHYSICS.fixedDt : 1; }
  snapshot() { return { ...this.world.snapshot(), state: this.world.finished ? 'finished' as const : this.state, config: structuredClone(this.config), droppedTime: this.dropped }; }
}
