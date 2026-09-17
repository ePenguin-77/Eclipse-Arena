import type { ArenaBlueprint } from '../contracts/arenas';
import { VISUAL_ASSETS } from '../content/visual-assets';

export function ArenaSelect({ arenas, selected, onSelect, setup = false }: { arenas: readonly ArenaBlueprint[]; selected: string; onSelect: (id: string) => void; setup?: boolean }) {
  return <section className="panel arena-select" aria-label="เลือกสนามต่อสู้">
    <div className="lineup-heading"><div><p className="eyebrow">ดินแดนแห่งการประลอง</p><h2>เลือกสนามต่อสู้</h2></div><p className="helper">{setup ? 'สถานที่แห่งการประชันวิชา' : 'เปลี่ยนสนามเริ่มรอบใหม่ · ใช้ Seed และตัวละครเดิม'}</p></div>
    <div className="arena-choice-grid">{arenas.map(arena => <button key={arena.id} className="arena-choice" aria-label={`เลือก ${arena.name}`} aria-pressed={selected === arena.id} onClick={() => onSelect(arena.id)}>
      <svg className="arena-miniature" viewBox={`0 0 ${arena.boundary.width} ${arena.boundary.height}`} aria-hidden="true">
        <rect x="4" y="4" width={arena.boundary.width - 8} height={arena.boundary.height - 8} rx="10" fill={arena.visual.floor} stroke={arena.visual.accent} strokeWidth="8" />
        <circle cx={arena.boundary.width / 2} cy={arena.boundary.height / 2} r="70" fill="none" stroke={arena.visual.accent} opacity="0.25" strokeWidth="5" />
        {arena.visual.artwork && <image href={VISUAL_ASSETS[arena.visual.artwork.floorAssetId]} width={arena.boundary.width} height={arena.boundary.height} preserveAspectRatio="none" opacity={arena.visual.artwork.floorOpacity} />}
        {(arena.boundary.obstacles ?? []).map(o => {
          const art = arena.visual.artwork?.obstacle;
          return <g key={o.id}><circle cx={o.center.x} cy={o.center.y} r={o.radius} fill={arena.visual.stone} stroke={arena.visual.accent} strokeWidth="6" />
            {art && <svg x={o.center.x - o.radius} y={o.center.y - o.radius} width={o.radius * 2} height={o.radius * 2} viewBox={`${art.crop.x * 1000} ${art.crop.y * 1000} ${art.crop.size * 1000} ${art.crop.size * 1000}`}><image href={VISUAL_ASSETS[art.assetId]} width="1000" height="1000" /></svg>}
          </g>;
        })}
        {arena.spawnLayouts[4].map((p, i) => <circle key={i} cx={p.x * arena.boundary.width} cy={p.y * arena.boundary.height} r="16" fill="#c4d3bf" />)}
      </svg>
      <span className="arena-choice-copy"><strong>{arena.name}</strong><span>{arena.description}</span><small>{!setup && `${arena.boundary.width} × ${arena.boundary.height} · `}{arena.boundary.obstacles?.length ? `แท่น ${arena.boundary.obstacles.length} จุด` : 'ลานเปิด'} · 2–4 ผู้ประลอง</small></span>
      <span className="arena-choice-status">{selected === arena.id ? 'เลือกแล้ว' : 'เลือกสนาม'}</span>
    </button>)}</div>
  </section>;
}
