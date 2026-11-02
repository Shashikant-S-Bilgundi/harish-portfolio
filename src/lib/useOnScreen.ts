import { useEffect, useState, type RefObject } from 'react';

/** True while the element is on (or near) the screen. Used to pause videos you've scrolled past. */
export function useOnScreen(ref: RefObject<Element | null>, rootMargin = '0px'): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return; }
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return on;
}