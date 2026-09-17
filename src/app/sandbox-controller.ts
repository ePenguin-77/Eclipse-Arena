import { ARENA_REGISTRY } from './arena-catalog';
import { validateSpawnSeparation } from '../arenas/spawn-layout';
import { COMBAT_RULES, DEFAULT_MAX_HP } from '../config/combat';
import { PROTOTYPE_ABILITIES } from '../content/abilities';
import { createScenario, DEFAULT_CONFIG, SCENARIOS, scenarioPhysicsOverrides, type ParticipantCount, type SandboxConfig } from '../content/scenarios';
import { MatchController, type MatchCommand } from '../core/match-controller';
import { SimulationWorld } from '../core/simulation-world';
import { createCharacter } from '../characters/character-factory';
import { CHARACTER_REGISTRY } from './character-catalog';

export type SandboxCommand = MatchCommand<SandboxConfig> | { type: 'new-round'; count?: ParticipantCount };
function buildWorld(config: SandboxConfig) {
  if (!SCENARIOS.some(s => s.id === config.scenario) || ![2, 3, 4].includes(config.count) ||
    !Number.isInteger(config.seed) || config.seed < 0 || config.seed > 0xffffffff) throw new Error('Invalid sandbox configuration');
  if ((config.combatEnabled !== undefined && typeof config.combatEnabled !== 'boolean') || (config.combatHP !== undefined &&
    (!Array.isArray(config.combatHP) || config.combatHP.length !== 4 || config.combatHP.some(hp => !Number.isFinite(hp) || hp <= 0 || hp > 10000)))) throw new Error('Invalid combat HP');
  const arena = ARENA_REGISTRY.get(config.arenaId ?? 'baseline');
  if (!arena.supportsDiagnostics && config.scenario !== 'chaos') throw new Error('This arena supports Chaos scenarios only');
  const spawns = createScenario(config, arena);
  if (config.characterIds !== undefined && (!Array.isArray(config.characterIds) || config.characterIds.length !== 4 || config.characterIds.some(id => typeof id !== 'string'))) throw new Error('Invalid character lineup');
  config.characterIds?.forEach(id => CHARACTER_REGISTRY.get(id));
  const characters = config.characterIds ? spawns.map((spawn, index) => createCharacter(CHARACTER_REGISTRY, config.characterIds![index]!, spawn,
    { maxHP: config.combatHP?.[index], physics: scenarioPhysicsOverrides(config.scenario, index) })) : null;
  if ([config.abilitiesEnabled, config.abilityAutoCast].some(v => v !== undefined && typeof v !== 'boolean')) throw new Error('Invalid ability options');
  const bodies = characters?.map(c => c.body) ?? spawns;
  if (config.scenario === 'chaos') validateSpawnSeparation(bodies);
  return new SimulationWorld(arena.boundary, bodies, config.seed, config.combatEnabled ? { rules: { ...COMBAT_RULES },
    combatants: characters?.map(c => c.combatant) ?? spawns.map((body, index) => ({ id: body.id, maxHP: config.combatHP?.[index] ?? DEFAULT_MAX_HP, damageMultiplier: 1 })) } : undefined,
    config.combatEnabled && config.abilitiesEnabled ? { definitions: PROTOTYPE_ABILITIES, autoCast: config.abilityAutoCast ?? true, maxProjectiles: 64,
      loadouts: characters?.map(c => c.loadout) ?? spawns.map(b => ({ ownerId: b.id, abilityIds: ['pulse-strike', 'spark-shot'] })) } : undefined,
    characters?.map(c => c.instance));
}
// Composition belongs to the app. The core never imports scenario or UI modules.
export class SandboxController extends MatchController<SandboxConfig> {
  constructor(config: SandboxConfig = DEFAULT_CONFIG, private readonly nextSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]!) { super(config, buildWorld); }
  override dispatch(command: SandboxCommand, stopAfterTick?: () => boolean) {
    if (command.type !== 'new-round') { super.dispatch(command, stopAfterTick); return; }
    const current = this.snapshot();
    const sampled = this.nextSeed();
    const seed = sampled === current.config.seed ? (sampled + 1) >>> 0 : sampled;
    super.dispatch({ type: 'configure', config: { ...current.config, scenario: 'chaos', count: command.count ?? current.bodies.length as ParticipantCount, seed } });
  }
}
