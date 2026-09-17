import { useEffect, useState } from 'react';

// Touch-first devices use the portrait layout; desktop windows remain unrestricted.
export const MOBILE_LANDSCAPE = '(hover: none) and (pointer: coarse) and (orientation: landscape)';

export function usePortraitGuard() {
  const [blocked, setBlocked] = useState(() => window.matchMedia(MOBILE_LANDSCAPE).matches);
  useEffect(() => {
    const media = window.matchMedia(MOBILE_LANDSCAPE);
    const update = () => setBlocked(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return blocked;
}
