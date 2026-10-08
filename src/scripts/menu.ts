/**
 * The main menu in both of its forms.
 *
 * On wide screens each group is a button that discloses a list of links. The
 * stylesheet alone opens a list under a mouse pointer; this adds what a
 * keyboard, a touch screen and a screen reader need: the button opens and
 * closes its list and says which it is, Escape closes, and so does moving on.
 *
 * On narrow screens the whole menu is a dialog, opened by one button.
 */

export function initMenuBar() {
  const bar = document.querySelector<HTMLElement>('[data-menu-bar]');
  if (!bar) return;
  const buttons = [...bar.querySelectorAll<HTMLButtonElement>('button[aria-controls]')];

  const isOpen = (button: HTMLButtonElement) => button.getAttribute('aria-expanded') === 'true';
  const setOpen = (button: HTMLButtonElement, open: boolean) =>
    button.setAttribute('aria-expanded', String(open));
  const closeAll = (except?: HTMLButtonElement) => {
    for (const button of buttons) if (button !== except) setOpen(button, false);
  };

  for (const button of buttons) {
    const group = button.parentElement;
    if (!group) continue;

    button.addEventListener('click', () => {
      closeAll(button);
      setOpen(button, !isOpen(button));
    });

    // Tabbing or clicking out of a group closes it.
    group.addEventListener('focusout', (event) => {
      if (!group.contains(event.relatedTarget as Node | null)) setOpen(button, false);
    });

    group.addEventListener('pointerleave', (event) => {
      // A list closed with Escape may open under the pointer again.
      delete group.dataset.dismissed;
      // A mouse that opened a list by a click closes it by leaving, as it
      // would a list opened by hovering.
      if (event.pointerType === 'mouse') setOpen(button, false);
    });
  }

  // Focus arriving in one group closes the others. `focusout` alone would miss
  // a list opened by a click in Safari, which does not focus a clicked button.
  bar.addEventListener('focusin', (event) => {
    const group = (event.target as HTMLElement).closest('.menu-group');
    for (const button of buttons) if (button.parentElement !== group) setOpen(button, false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const button of buttons) {
      const group = button.parentElement;
      if (!group) continue;
      const hovered = group.matches(':hover');
      if (!isOpen(button) && !hovered) continue;
      // Keep the list shut although the pointer is still over it.
      if (hovered) group.dataset.dismissed = '';
      // Focus inside the list would be lost with it; hand it back to the button.
      if (group.contains(document.activeElement) && document.activeElement !== button) button.focus();
      setOpen(button, false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!bar.contains(event.target as Node)) closeAll();
  });
}

export function initMobileMenu() {
  const menu = document.querySelector<HTMLDialogElement>('#site-menu');
  if (!menu) return;

  // Opened as a modal dialog, the browser keeps focus inside it, closes it on
  // Escape and returns focus to the button afterwards.
  document.querySelector('[data-menu-open]')?.addEventListener('click', () => menu.showModal());

  menu.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('[data-menu-close], a')) menu.close();
  });

  // The dialog belongs to the narrow layout; it must not stay open over the wide one.
  window.matchMedia('(width >= 64rem)').addEventListener('change', (event) => {
    if (event.matches && menu.open) menu.close();
  });
}
