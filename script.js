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
   The inline script in each page's <head> already set data-theme on
   <html> before this file ever ran - dark by default, or whatever
   was saved from a previous visit (see the comment there). This
   block handles what happens after that: syncing the switch's icon
   to whichever theme is active, and saving the visitor's choice
   when they click it so it's remembered next time they're here.
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
    localStorage.setItem('theme', nextTheme); // remembered for next visit

    syncSwitch();
  });

}

/* ===========================================================
   HERO SCROLL ZOOM
   Only index.html has a .hero, so this is a no-op (skipped
   entirely) on pricing.html - same guard-clause pattern as above.

   Sets --hero-scale on .hero as the visitor scrolls down through
   it; styles.css does the actual visual work (.hero scales up to
   match, .hero > * scales back down by the inverse so the text
   stays put - see the comments there). This is a transform, driven
   directly by scroll position rather than a CSS transition, which
   is what a scroll-linked effect needs - you want the zoom to track
   the scrollbar 1:1, not lag behind it easing into position.
============================================================ */

const hero = document.querySelector('.hero');

// respects the visitor's OS-level motion preference, same courtesy
// the waveform bars' bounce animation already gets in styles.css
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (hero && !prefersReducedMotion) {

  const MAX_ZOOM = 0.11; // hero image grows up to 11% larger at full scroll-through
  let ticking = false; // rAF throttle flag - see updateHeroZoom below

  const updateHeroZoom = () => {
    const progress = Math.min(window.scrollY / hero.offsetHeight, 1); // 0 at the top, 1 once fully scrolled past
    hero.style.setProperty('--hero-scale', 1 + progress * MAX_ZOOM);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    // requestAnimationFrame throttling: a scroll event can fire many
    // times per frame, but the screen only repaints once per frame -
    // this collapses a burst of scroll events down to one update
    if (!ticking) {
      requestAnimationFrame(updateHeroZoom);
      ticking = true;
    }
  }, { passive: true }); // passive: true tells the browser this listener never calls
                          // preventDefault(), so it doesn't have to wait for this code
                          // to finish before scrolling the page - keeps scrolling smooth

  updateHeroZoom(); // sets the correct scale immediately, in case the page loads
                     // already scrolled down (e.g. returning via back/forward)

}

/* ===========================================================
   NAV WAVEFORM REVEAL
   A mini copy of the hero's waveform lives inside the nav brand
   link (see .waveform--nav in styles.css) but starts invisible.
   This watches the REAL waveform down in the hero, and as soon as
   it scrolls out of view, reveals the mini one in the nav - so it
   reads as the same animation having moved up there, rather than
   two unrelated things.

   IntersectionObserver instead of a scroll listener: unlike the
   zoom above, this doesn't need a continuous 0-1 progress value,
   just a yes/no "is it on screen" - the browser can answer that far
   more cheaply than re-checking scroll position on every frame.
============================================================ */

const heroWaveform = document.querySelector('.hero .waveform');
const nav = document.querySelector('.nav');

if (heroWaveform && nav) {

  const waveformObserver = new IntersectionObserver(([entry]) => {
    // entry.isIntersecting is true while the hero waveform is still
    // on screen - show the nav's copy exactly when that flips false
    nav.classList.toggle('show-waveform', !entry.isIntersecting);
  });

  waveformObserver.observe(heroWaveform);

}
