/* ===========================================================
   MOBILE NAV TOGGLE
   Shared by index.html and pricing.html - same reasoning as the
   shared styles.css file: write the logic once, link it from both
   pages, instead of pasting the same <script> block twice.
============================================================ */

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

// Guard in case either element is missing - keeps this file safe
// to include on any future page that might not have a nav.
if (navToggle && navLinks) {

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);

    // keeps screen readers in sync with whether the menu is open
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // close the menu after a link is tapped, so it doesn't stay open
  // covering the page once the visitor has navigated
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

}

/* ===========================================================
   LIGHT / DARK MODE TOGGLE
   The inline script in each page's <head> already flipped a coin
   and set data-theme on <html> before this file ever ran (see the
   comment there for why that has to happen separately/earlier).
   This block only handles what happens after that: syncing the
   switch's visual state to whichever theme got picked, and letting
   the visitor manually override it for the rest of this page view
   by clicking. That override isn't saved anywhere - reload, and
   it's a fresh coin flip again.
============================================================ */

const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {

  // keeps the switch's aria-checked in sync with the real theme -
  // called once on load, and again after every click
  const syncSwitch = () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    themeToggle.setAttribute('aria-checked', String(isLight));
  };

  syncSwitch();

  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const nextTheme = isLight ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', nextTheme);

    syncSwitch();
  });

}
