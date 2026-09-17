import type { CharacterVisualDefinition } from '../contracts/characters';
import { VISUAL_ASSETS } from '../content/visual-assets';
import { useState } from 'react';

export function CharacterPortrait({ visual, name, catalogue = false }: { visual: CharacterVisualDefinition; name: string; catalogue?: boolean }) {
  const src = visual.artwork && VISUAL_ASSETS[visual.artwork.assetId];
  const crop = (catalogue ? visual.artwork?.cataloguePortrait : undefined) ?? visual.artwork?.portrait ?? { x: 0, y: 0, size: 1 };
  const [ratio, setRatio] = useState(1);
  const width = Math.max(1, ratio), height = Math.max(1, 1 / ratio);
  const style = { width: `${100 * width / crop.size}%`, height: `${100 * height / crop.size}%`, left: `${-Math.min(width - crop.size, crop.x * width) / crop.size * 100}%`, top: `${-Math.min(height - crop.size, crop.y * height) / crop.size * 100}%` };
  const aura = visual.artwork?.auraAssetId && VISUAL_ASSETS[visual.artwork.auraAssetId];
  return src ? <span className="character-portrait">
    {aura && <img className="portrait-aura" src={aura} alt="" aria-hidden="true" style={style} />}
    <img key={src} src={src} alt={`Artwork ${name}`} style={style} onLoad={e => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} onError={e => { e.currentTarget.hidden = true; }} />
  </span> : null;
}

export function CharacterBackdrop({ visual }: { visual: CharacterVisualDefinition }) {
  const src = visual.artwork && VISUAL_ASSETS[visual.artwork.assetId];
  const crop = visual.artwork?.hudPortrait ?? visual.artwork?.portrait ?? { x: .2, y: .02, size: .6 };
  // Register full HUD artwork to the same face window used by circles and balls.
  // The original jade portrait (.2, .02, .6) remains the reference composition.
  const style = {
    '--hud-art-width': 1.14 / crop.size,
    '--hud-art-center-x': `${100 * (crop.x + crop.size / 2)}%`,
    '--hud-art-offset-y': 1.9 * (.02 - .6 * crop.y / crop.size),
  } as React.CSSProperties;
  const aura = visual.artwork?.auraAssetId && VISUAL_ASSETS[visual.artwork.auraAssetId];
  return src ? <>
    {aura && <img className="fighter-artwork portrait-aura" src={aura} alt="" aria-hidden="true" style={style} />}
    <img className="fighter-artwork" data-artwork={visual.artwork?.assetId} src={src} alt="" aria-hidden="true" style={style} onError={e => { e.currentTarget.hidden = true; }} />
  </> : null;
}
