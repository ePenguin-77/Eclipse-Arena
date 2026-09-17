import type { AbilitySnapshot } from '../contracts/abilities';
import type { CharacterSnapshot } from '../contracts/characters';

export const ULTIMATE_PRESENTATION_SECONDS = 1.75;
export interface UltimateAnnouncement {
  eventId: number; ownerId: string; name: string; character: string;
  discipline: string; disciplineEn: string;
  color: string; artworkId?: string; backgroundId?: string; elapsed: number;
}

/** Real-time presentation queue. Combat never depends on artwork or animation completion. */
export class UltimatePresentation {
  private queue: UltimateAnnouncement[] = [];
  private lastEventId = 0;
  get current(): UltimateAnnouncement | null { return this.queue[0] ? { ...this.queue[0] } : null; }
  get active() { return this.queue.length > 0; }
  clear() { this.queue = []; this.lastEventId = 0; }
  capture(abilities: AbilitySnapshot | null, characters: readonly CharacterSnapshot[]) {
    for (const event of abilities?.events ?? []) {
      if (event.id <= this.lastEventId) continue;
      this.lastEventId = event.id;
      const definition = abilities!.definitions.find(d => d.id === event.abilityId);
      const owner = characters.find(c => c.entityId === event.ownerId);
      if (event.kind !== 'cast' || !definition?.ultimate || !owner || owner.status === 'defeated') continue;
      this.queue.push({ eventId: event.id, ownerId: event.ownerId, name: definition.name,
        character: owner.name, discipline: owner.discipline ?? owner.role, disciplineEn: owner.disciplineEn ?? 'IMMORTAL DAO', color: owner.visual.auraColor ?? owner.visual.color,
        artworkId: owner.visual.artwork?.assetId, backgroundId: owner.visual.hudBackgroundAssetId, elapsed: 0 });
    }
    return this.active;
  }
  advance(delta: number) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    // Never skip the next announcement after a delayed browser frame.
    const current = this.queue[0];
    if (!current) return;
    current.elapsed += delta;
    if (current.elapsed + 1e-9 >= ULTIMATE_PRESENTATION_SECONDS) this.queue.shift();
  }
}
