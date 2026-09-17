import type { CharacterInstance, CharacterSnapshot } from '../contracts/characters';
import type { CombatantState } from '../contracts/combat';

/** Instance composition. Combat remains the single owner of HP and life state. */
export class CharacterRuntime {
  private instance: CharacterInstance;
  constructor(instance: CharacterInstance) { this.instance = structuredClone(instance); }
  get entityId() { return this.instance.entityId; }
  snapshot(combatant?: CombatantState): CharacterSnapshot {
    return { ...structuredClone(this.instance), status: combatant?.alive === false ? 'defeated' : 'active', hp: combatant?.hp ?? null };
  }
}
