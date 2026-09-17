export type ImageStatus = 'loading' | 'ready' | 'error';
type Entry = { image: HTMLImageElement; status: ImageStatus };

/** Cache belongs to the renderer, outlives a round, and never blocks simulation. */
export class ImageCache {
  private entries = new Map<string, Entry>();
  constructor(private readonly sources: Readonly<Record<string, string>>) {}
  get(id: string): HTMLImageElement | null {
    const source = this.sources[id];
    if (!source) return null;
    let entry = this.entries.get(id);
    if (!entry) {
      const image = new Image();
      const created: Entry = { image, status: 'loading' };
      entry = created;
      this.entries.set(id, created);
      image.onload = () => { created.status = image.naturalWidth > 0 ? 'ready' : 'error'; };
      image.onerror = () => { created.status = 'error'; };
      image.decoding = 'async';
      image.src = source;
    }
    return entry.status === 'ready' ? entry.image : null;
  }
  status(id: string): ImageStatus | 'missing' { return this.entries.get(id)?.status ?? (this.sources[id] ? 'loading' : 'missing'); }
}
