/**
 * Page motion, driven by data attributes so templates stay declarative:
 *
 *   data-reveal            fade and rise in when scrolled into view
 *   data-reveal="clip"     open out from an inset frame instead
 *   data-count="20"        count up to the number when first seen
 *   data-parallax="40"     drift up to 40px against the scroll while in view
 *
 * All of it is skipped when the visitor asks for reduced motion.
 */
import { animate, scroll } from 'motion';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onceVisible(elements: Iterable<Element>, callback: (element: Element) => void, rootMargin = '0px') {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        callback(entry.target);
      }
    },
    { rootMargin, threshold: 0.12 },
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

function initCounters() {
  const elements = document.querySelectorAll<HTMLElement>('[data-count]');
  if (reducedMotion) return;
  onceVisible(elements, (element) => {
    const target = Number((element as HTMLElement).dataset.count);
    animate(0, target, {
      duration: 1.6,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (value) => (element.textContent = String(Math.round(value))),
    });
  });
}

function initParallax() {
  if (reducedMotion) return;
  for (const element of document.querySelectorAll<HTMLElement>('[data-parallax]')) {
    const distance = Number(element.dataset.parallax);
    scroll(animate(element, { y: [-distance, distance] }, { ease: 'linear' }), {
      target: element.parentElement ?? element,
      offset: ['start end', 'end start'],
    });
  }
}

initReveals();
initCounters();
initParallax();
