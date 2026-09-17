import type { CSSProperties } from 'react';
import { VISUAL_ASSETS } from '../content/visual-assets';
import { ULTIMATE_PRESENTATION_SECONDS, type UltimateAnnouncement as Announcement } from './ultimate-presentation';
import './ultimate-announcement.css';

export function UltimateAnnouncement({ announcement, reducedMotion = false }: { announcement: Announcement | null; reducedMotion?: boolean }) {
  if (!announcement) return null;
  const art = announcement.artworkId && VISUAL_ASSETS[announcement.artworkId];
  const background = announcement.backgroundId && VISUAL_ASSETS[announcement.backgroundId];
  const style = { '--ultimate-color': announcement.color, '--ultimate-art': background ? `url("${background}")` : 'none',
    '--cutin-time': `${-announcement.elapsed}s`, '--cutin-duration': `${ULTIMATE_PRESENTATION_SECONDS}s` } as CSSProperties;
  return <section key={`${announcement.ownerId}-${announcement.eventId}`} className={`ultimate-announcement${['mirror-portrait-v1','ink-portrait-v1','qin-portrait-v1','chain-portrait-v1'].includes(announcement.artworkId??'') ? ' compact-announcement' : ''}${reducedMotion ? ' reduced-motion' : ''}`} style={style}
    aria-label="ประกาศท่าไม้ตาย" role="status" aria-live="polite" aria-atomic="true">
    <div className="ultimate-cutin">
      <div className="ultimate-cutin-plate" />
      {art && <img className="ultimate-cutin-portrait" src={art} alt="" />}
      <div className="ultimate-cutin-copy"><p>{announcement.disciplineEn} · HEAVENLY ART</p><h2>{announcement.name}</h2><div className="ultimate-cutin-signature"><strong>{announcement.character}</strong><span> · {announcement.discipline}</span></div></div>
      <div className="ultimate-cutin-line" />
    </div>
  </section>;
}
