import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import type { CharacterDefinition } from '../contracts/characters';
import { CharacterPortrait } from './CharacterPortrait';

/** Each group owns its scrolling and drag state. */
export function CharacterCatalogueRow({title, characters, selectedId, sideName, onSelect}: {
 title:string; characters:CharacterDefinition[]; selectedId:string; sideName:string; onSelect:(id:string)=>void;
}) {
  const catalogue = useRef<HTMLDivElement>(null);
  const drag = useRef<{pointerId:number;x:number;scrollLeft:number;active:boolean} | null>(null);
  const suppressDragClick = useRef(false);
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    const strip = event.currentTarget;
    drag.current = null;
    delete strip.dataset.dragging;
    if (strip.hasPointerCapture(event.pointerId)) strip.releasePointerCapture(event.pointerId);
  };
  useEffect(() => {
    const strip = catalogue.current;
    const active = strip?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (strip && active) strip.scrollTo({ left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2 });
  }, [selectedId]);
  return <section className="selection-catalogue-group" aria-label={title}>
    <div className="selection-catalogue-heading">
      <h4>{title}<small>{characters.length} ตัวละคร</small></h4>
      <div><button type="button" className="selection-arrow" aria-label={`เลื่อน${title}ไปทางซ้าย`} onClick={() => catalogue.current?.scrollBy({left: -(catalogue.current.clientWidth * .8)})}>‹</button><button type="button" className="selection-arrow" aria-label={`เลื่อน${title}ไปทางขวา`} onClick={() => catalogue.current?.scrollBy({left: catalogue.current.clientWidth * .8})}>›</button></div>
    </div>
    <div className="selection-catalogue" ref={catalogue} aria-label={`รายชื่อ${title}`}
      onDragStart={event => event.preventDefault()}
      onPointerDown={event => {
        suppressDragClick.current = false;
        if (event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary) return;
        const strip = event.currentTarget;
        // Leave the native scrollbar and touch scrolling to the browser.
        if (event.clientY >= strip.getBoundingClientRect().top + strip.clientTop + strip.clientHeight) return;
        drag.current = {pointerId:event.pointerId,x:event.clientX,scrollLeft:strip.scrollLeft,active:false};
      }}
      onPointerMove={event => {
        const gesture = drag.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;
        if (!(event.buttons & 1)) { finishDrag(event); return; }
        const distance = event.clientX - gesture.x;
        if (!gesture.active && Math.abs(distance) < 6) return;
        const strip = event.currentTarget;
        if (!gesture.active) {
          gesture.active = true;
          suppressDragClick.current = true;
          strip.dataset.dragging = 'true';
          strip.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
        strip.scrollLeft = gesture.scrollLeft - distance;
      }}
      onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
      onClickCapture={event => {
        if (event.detail > 0 && suppressDragClick.current) {
          event.preventDefault(); event.stopPropagation(); suppressDragClick.current = false;
        }
      }}>
      {characters.map(c => <button type="button" key={c.id} aria-label={`เลือก ${c.name} ให้${sideName}`} aria-pressed={selectedId === c.id} onClick={() => onSelect(c.id)} style={{'--fighter-color':c.visual.color} as CSSProperties}>
        <CharacterPortrait visual={c.visual} name={c.name} catalogue /><strong>{c.name}</strong>
      </button>)}
    </div>
  </section>;
}
