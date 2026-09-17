import { CharacterRegistry } from '../characters/character-registry';
import { PROTOTYPE_CHARACTERS } from '../content/characters';
import { PROTOTYPE_ABILITIES } from '../content/abilities';

export const CHARACTER_REGISTRY = new CharacterRegistry(PROTOTYPE_CHARACTERS, PROTOTYPE_ABILITIES.map(d => d.id));
