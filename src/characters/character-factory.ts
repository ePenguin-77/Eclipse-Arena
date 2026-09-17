import type { CharacterInstance } from '../contracts/characters';
import type { CombatantDefinition } from '../contracts/combat';
import type { BodyDefinition } from '../contracts/physics';
import { type BodySpawn, validateBodyDefinition } from '../physics/body';
import type { CharacterRegistry } from './character-registry';

export function createCharacter(registry: CharacterRegistry, characterId: string,
  spawn: Pick<BodySpawn, 'id' | 'position' | 'direction'>, overrides: { maxHP?: number; physics?: Partial<BodyDefinition> } = {}) {
  const definition = registry.get(characterId);
  const physics = { ...definition.physics, ...overrides.physics };
  const stats = { ...definition.stats, maxHP: overrides.maxHP ?? definition.stats.maxHP };
  validateBodyDefinition(physics);
  if (!spawn.id || !Number.isFinite(stats.maxHP) || stats.maxHP <= 0 || stats.maxHP > 10000) throw new Error('Invalid character instance');
  const body: BodySpawn = { ...physics, id: spawn.id, position: { ...spawn.position }, direction: { ...spawn.direction } };
  const combatant: CombatantDefinition = { id: spawn.id, ...stats };
  const loadout = { ownerId: spawn.id, abilityIds: [...definition.abilityIds], slots: { basic: definition.kit.basic, ultimate: definition.kit.ultimate } };
  const instance: CharacterInstance = { entityId: spawn.id, definitionId: definition.id, name: definition.name, description: definition.description,
    epithet: definition.epithet, discipline: definition.discipline, disciplineEn: definition.disciplineEn,
    role: definition.role, stats: { ...stats }, physics: { ...physics }, abilityIds: [...definition.abilityIds], kit: structuredClone(definition.kit), visual: structuredClone(definition.visual) };
  return { body, combatant, loadout, instance };
}
