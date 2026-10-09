/** Enhance fully readable HTML only after the controls are ready. No autoplay. */
export function initEraExplorers() {
  for (const explorer of document.querySelectorAll<HTMLElement>('[data-era-explorer]')) {
    if (explorer.dataset.ready) continue;
    const panels = [...explorer.querySelectorAll<HTMLElement>('[data-era-panel]')];
    const choices = [...explorer.querySelectorAll<HTMLButtonElement>('[data-era-select]')];
    const previous = explorer.querySelector<HTMLButtonElement>('[data-era-previous]');
    const next = explorer.querySelector<HTMLButtonElement>('[data-era-next]');
    const count = explorer.querySelector<HTMLElement>('[data-era-count]');
    if (!panels.length || panels.length !== choices.length || !previous || !next || !count) continue;
    let current = 0;
    const select = (index: number) => {
      current = Math.max(0, Math.min(index, panels.length - 1));
      panels.forEach((panel, i) => {
        const active = i === current;
        panel.dataset.active = String(active);
        panel.inert = !active;
        panel.setAttribute('aria-hidden', String(!active));
      });
      choices.forEach((choice, i) => choice.setAttribute('aria-pressed', String(i === current)));
      previous.disabled = current === 0;
      next.disabled = current === panels.length - 1;
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
    };
    choices.forEach((choice, index) => {
      choice.addEventListener('click', () => select(index));
      choice.addEventListener('keydown', (event) => {
        let target: number;
        if (event.key === 'ArrowRight') target = Math.min(index + 1, choices.length - 1);
        else if (event.key === 'ArrowLeft') target = Math.max(index - 1, 0);
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = choices.length - 1;
        else return;
        event.preventDefault();
        select(target);
        choices[target]?.focus();
      });
    });
    previous.addEventListener('click', () => select(current - 1));
    next.addEventListener('click', () => select(current + 1));
    select(0);
    explorer.dataset.ready = 'true';
    for (const controls of explorer.querySelectorAll<HTMLElement>('[data-era-controls]'))
      controls.hidden = false;
  }
}

/** Follow the reader through the chapters without moving keyboard focus. */
export function initChapterNavigation() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]')];
  const sections = links.map((link) => document.getElementById(link.hash.slice(1)));
  if (!links.length) return;
  let queued = false;
  const update = () => {
    queued = false;
    let current = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= 190) current = index;
    });
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
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
