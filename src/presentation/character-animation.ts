import type { BodySnapshot, WorldSnapshot } from '../contracts/types';
import type { CharacterArtwork, CharacterVisualState } from '../contracts/visual';

export type VisualPreview = 'match' | CharacterVisualState;
export interface CharacterPose { state: CharacterVisualState; flipX: boolean; rotation: number; offsetY: number; offsetX: number; scaleX: number; scaleY: number; alpha: number; brightness: number }

/** Read-only, tick based sampling: pause, replay and repeated renders agree. */
export function characterPose(world: WorldSnapshot, body: BodySnapshot, art: CharacterArtwork, preview: VisualPreview = 'match'): CharacterPose {
  const damage = world.combat?.results.filter(r => r.request.targetId === body.id && r.appliedDamage > 0).at(-1);
  const hitAge = damage ? world.tick - damage.request.tick : Infinity;
  const defeated = world.combat?.combatants.find(c => c.id === body.id)?.alive === false;
  const casting = world.abilities?.runtimes.some(r => r.ownerId === body.id && r.status === 'casting');
  const state: CharacterVisualState = preview !== 'match' ? preview : defeated ? 'defeated' : hitAge >= 0 && hitAge < 10 ? 'hit' : casting ? 'casting' : body.speed > 1 ? 'moving' : 'idle';
  const t = world.tick / 60;
  const flipX = art.facing === 'mirror' && body.velocity.x < -1;
  const pose: CharacterPose = { state, flipX, rotation: 0, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, alpha: 1, brightness: 1 };
  if (state === 'idle') pose.scaleY = 1 + Math.sin(t * 3) * 0.012;
  if (state === 'moving') { pose.offsetY = Math.sin(t * 10) * 1.3; pose.rotation = (flipX ? -1 : 1) * 0.045; }
  if (state === 'casting') { pose.scaleX = 1.07; pose.scaleY = 1.04; pose.brightness = 1.25; pose.offsetY = -2; }
  if (state === 'hit') { pose.offsetX = Math.cos((preview === 'match' ? hitAge : world.tick) * 2.5) * 2.5; pose.brightness = 1.7; }
  if (state === 'defeated') { pose.rotation = 0.35; pose.scaleY = 0.7; pose.alpha = 0.28; }
  return pose;
}

/** Local drawing rectangle, independent of the physics radius. */
export function artworkRect(art: CharacterArtwork, scale: number) {
  return { x: (-art.width * art.anchor.x + art.offset.x) * scale, y: (-art.height * art.anchor.y + art.offset.y) * scale,
    width: art.width * scale, height: art.height * scale };
}
