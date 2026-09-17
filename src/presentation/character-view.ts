import type { CharacterSnapshot } from '../contracts/characters';

export const BODY_COLORS = ['#74ddd0', '#efa792', '#b8acf0', '#edca7d'];
export function characterColor(characters: readonly CharacterSnapshot[], entityId: string, slot: number) {
  return characters.find(c => c.entityId === entityId)?.visual.color ?? BODY_COLORS[slot % BODY_COLORS.length] ?? '#f7d99b';
}
export function characterVisualRadius(characters: readonly CharacterSnapshot[], entityId: string, scale: number) {
  return (characters.find(c => c.entityId === entityId)?.visual.radius ?? 34) * scale;
}
