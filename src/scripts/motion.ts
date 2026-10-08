/**
 * Scroll-driven motion, switched on by data attributes so templates stay
 * declarative:
 *
 *   data-reveal            appear when scrolled into view (styles in motion.css)
 *   data-count="20"        count up to the number when first seen
 *   data-parallax="40"     drift up to 40px against the scroll while in view
 *
 * All of it is skipped when the visitor asks for reduced motion.
 */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tells the watchdog in <head> that this script arrived and will reveal the content.
document.documentElement.dataset.motion = 'on';

/**
 * Calls back once for each element when any part of it enters the viewport.
 * The trigger must not be a share of the element's own height: an article many
 * screens tall never has a tenth of itself in view and would stay hidden.
 */
function onceVisible(elements: Iterable<Element>, callback: (element: Element) => void, rootMargin = '0px') {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        callback(entry.target);
      }
    },
    { rootMargin, threshold: 0 },
  );
  for (const element of elements) observer.observe(element);
}

function initReveals() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (reducedMotion) {
    for (const element of elements) element.classList.add('is-visible');
    return;
  }
  onceVisible(elements, (element) => element.classList.add('is-visible'), '0px 0px -8% 0px');
}

const COUNT_DURATION = 1600;

/** Fast at first, settling on the final number. */
const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

function initCounters() {
  if (reducedMotion) return;
  onceVisible(document.querySelectorAll<HTMLElement>('[data-count]'), (element) => {
    const target = Number((element as HTMLElement).dataset.count);
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - started) / COUNT_DURATION, 1);
      element.textContent = String(Math.round(target * easeOut(progress)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/**
 * Moves each element between -distance and +distance as its parent crosses the
 * viewport. `transform` is used because the templates position these elements
 * with the separate `translate` property, which this must not overwrite.
 */
function initParallax() {
  if (reducedMotion) return;
  const items = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map((element) => ({
    element,
    track: element.parentElement ?? element,
    distance: Number(element.dataset.parallax),
  }));
  if (items.length === 0) return;

  let queued = false;
  const update = () => {
    queued = false;
    const viewport = window.innerHeight;
    for (const { element, track, distance } of items) {
      const { top, bottom, height } = track.getBoundingClientRect();
      if (bottom < 0 || top > viewport) continue;
      // 0 as the parent's top edge meets the bottom of the screen, 1 as it leaves at the top.
      const progress = (viewport - top) / (viewport + height);
      element.style.transform = `translate3d(0, ${((progress * 2 - 1) * distance).toFixed(1)}px, 0)`;
    }
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}

initReveals();
initCounters();
initParallax();
