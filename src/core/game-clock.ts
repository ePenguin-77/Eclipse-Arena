import { PHYSICS } from '../config/physics';

export class GameClock {
  tick = 0;
  get time() { return this.tick * PHYSICS.fixedDt; }
  advance() { this.tick += 1; }
  reset() { this.tick = 0; }
}
