# Design

The extracted modules expose immutable data-oriented functions and do not import React, browser APIs, storage, translations, or network clients. The existing `public/legacy/scripts/03.js` remains unchanged in this change; a later adapter can compare its runtime behavior against these contracts before wiring them into gameplay.
