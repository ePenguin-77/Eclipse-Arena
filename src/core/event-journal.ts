import { PHYSICS } from '../config/physics';
import type { PhysicsEvent } from '../contracts/types';

/** Bounded diagnostics, not a gameplay event bus with recursive callbacks. */
export class EventJournal {
  private nextId = 1;
  private entries: PhysicsEvent[] = [];
  wallCount = 0;
  contactCount = 0;
  obstacleCount = 0;
  record(event: Omit<PhysicsEvent, 'id'>) {
    this.entries.push({ ...event, id: this.nextId++ });
    if (event.type === 'wall') this.wallCount++; else if (event.type === 'obstacle') this.obstacleCount++; else this.contactCount++;
    if (this.entries.length > PHYSICS.eventHistoryLimit) this.entries.shift();
  }
  snapshot(): PhysicsEvent[] {
    return this.entries.map(event => ({ ...event, point: { ...event.point }, normal: { ...event.normal } }));
  }
  reset() {
    this.nextId = 1;
    this.entries = [];
    this.wallCount = 0;
    this.contactCount = 0;
    this.obstacleCount = 0;
  }
}
