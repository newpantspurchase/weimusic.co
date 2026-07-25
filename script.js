/* ===========================================================
   RESTORE SMOOTH SCROLL AFTER INITIAL LOAD
   Companion to the inline script in index.html's <head> that forces
   scroll-behavior: auto when arriving via a #hash link, so the
   browser's automatic jump to that section is instant instead of a
   visible scroll down the page. That override needs to be lifted
   again once the page has settled, or every future in-page link
   click would lose its smooth scroll too. Safe to run on every
   page, hash or not - clearing a style that was never set just does
   nothing.
============================================================ */
window.addEventListener('load', () => {
  document.documentElement.style.scrollBehavior = '';
});

// declared once, up here, since a couple of unrelated blocks below
// (the waveform reveal, and the settle-before-navigating block
// right after this comment) both need a reference to the nav
const nav = document.querySelector('.nav');

/* ===========================================================
   SETTLE NAV TRANSITIONS BEFORE LEAVING THE PAGE
   Companion to the .nav.no-transition rule in styles.css. Any link
   in the nav that goes to a different page - "About"/"Track Record"
   (which point at index.html from pricing.html), "Pricing", or the
   logo - gets one frame where every transition inside the nav is
   forced to finish instantly before the browser actually navigates
   away. That guarantees the view-transition engine always captures
   a fully-settled snapshot of the nav, instead of possibly catching
   the mini waveform mid fade-in/out if a link was clicked shortly
   after scrolling past the hero.
============================================================ */
if (nav) {
  nav.querySelectorAll('a[href]:not([href^="mailto:"])').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.add('no-transition');
      void nav.offsetHeight; // forces the browser to apply the instant state immediately, before navigation fires
    });
  });
}

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
// nav is already declared near the top of this file

if (heroWaveform && nav) {

  const waveformObserver = new IntersectionObserver(([entry]) => {
    // entry.isIntersecting is true while the hero waveform is still
    // on screen - show the nav's copy exactly when that flips false
    nav.classList.toggle('show-waveform', !entry.isIntersecting);
  }, {
    // Without this, "on screen" means anywhere in the full viewport -
    // but the sticky nav's own ~64px visually covers the top of that
    // viewport, so the hero waveform was getting hidden behind the
    // nav before the observer noticed it was gone. That gap was the
    // dead moment where neither waveform was visible. Shrinking the
    // observer's effective viewport by the nav's height makes it
    // flip at the same instant the real one visually disappears.
    rootMargin: '-64px 0px 0px 0px'
  });

  waveformObserver.observe(heroWaveform);

}

/* ===========================================================
   SCROLL REVEAL RHYTHM
   Companion to the [data-reveal-group] / .reveal styling in
   styles.css. Rather than a whole section just appearing as you
   scroll to it, each direct child of a reveal group gets its own
   transition-delay here, so the pieces land one after another on a
   short beat (heading, then body copy, then CTA) instead of all at
   once - the scroll equivalent of the waveform's rhythm, rather than
   a flat fade.

   The hero is a special case: it's visible immediately on load, not
   scrolled to, so it reveals itself right away below instead of
   waiting on an IntersectionObserver.
============================================================ */

const revealGroups = document.querySelectorAll('[data-reveal-group]');

revealGroups.forEach((group) => {
  // capped at 4 steps so a section with lots of children (like the
  // track record, with its stats grid and several paragraphs)
  // doesn't take forever to finish revealing - everything past the
  // fourth child just lands on the same beat as the fourth
  Array.from(group.children).forEach((child, i) => {
    child.classList.add('reveal');
    child.style.transitionDelay = `${Math.min(i, 4) * 90}ms`;
  });
});

if (prefersReducedMotion) {
  // skip the staggering entirely rather than firing it all at once -
  // same courtesy given to the waveform bars and hero zoom above
  revealGroups.forEach((group) => group.classList.add('is-visible'));
} else {

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target); // reveals once - scrolling back up shouldn't hide it again
      }
    });
  }, { threshold: 0.15 });

  revealGroups.forEach((group) => {
    if (group === hero) {
      group.classList.add('is-visible'); // already on screen at load - nothing to scroll to
    } else {
      revealObserver.observe(group);
    }
  });

}
