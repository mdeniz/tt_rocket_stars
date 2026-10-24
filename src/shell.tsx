import { useEffect, useRef, useState } from 'react';
import en from './locales/en.json';
import es from './locales/es.json';

type Locale = typeof en;

function currentLocale(): Locale {
  return document.documentElement.lang === 'es' ? es : en;
}

/**
 * React owns the visible splash while the legacy runtime remains behind an
 * explicit entry adapter. This keeps the first migration reversible without
 * moving the gameplay DOM or changing persistence contracts.
 */
export function ReactShell() {
  const legacySplash = document.getElementById('launchSplash');
  const [visible] = useState(() => Boolean(legacySplash && !legacySplash.classList.contains('hidden')));
  const [entered, setEntered] = useState(false);
  const entering = useRef(false);

  useEffect(() => {
    if (!visible || !legacySplash) return;
    legacySplash.classList.add('hidden');
  }, [legacySplash, visible]);

  if (!visible) return null;

  const copy = currentLocale();
  const enterGame = () => {
    if (entering.current) return;
    entering.current = true;
    if (window.TTEnterGame) window.TTEnterGame();
    else legacySplash?.click();
    document.getElementById('menuBtn')?.focus({ preventScroll: true });
    // Keep the React event target mounted and hide it after the gesture. The
    // legacy adapter also observes this same gesture, so unmounting here can
    // race with its DOM updates in WebKit and Firefox.
    window.setTimeout(() => setEntered(true), 0);
  };

  return (
    <section
      id="reactLaunchSplash"
      className={`ttReactLaunchSplash${entered ? ' hidden' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={copy['ui.096']}
      onPointerDown={event => {
        if (event.button === 0) enterGame();
      }}
      onClick={enterGame}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          enterGame();
        }
      }}
    >
      <div className="ttReactSplashCard">
        <div className="ttReactSplashRocket" aria-hidden="true">🚀</div>
        <div className="splashTitle">TT <span>Rocket Stars</span></div>
        <div className="splashLead">{copy['ui.090']}</div>
        <div className="splashFacts">
          <span>{copy['ui.091']}</span>
          <span>{copy['ui.092']}</span>
          <span>{copy['ui.093']}</span>
        </div>
        <div className="splashStart">{copy['ui.094']}</div>
        <div className="splashHint">{copy['ui.095']}</div>
      </div>
    </section>
  );
}
