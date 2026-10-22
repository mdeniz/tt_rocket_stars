# AGENTS.md — TT Rocket Stars

## Objetivo y principios
Juego educativo de multiplicaciones y divisiones 1–12 para niños, offline-first, sin anuncios, cuentas, telemetría ni peticiones de red obligatorias. Conservar misiones, planetas, cohetes, monedas, logros, progreso y perfiles. Mobile/tablet first; táctil, orientación horizontal/vertical, safe areas, accesibilidad, contraste y reduced-motion.

## Flujo de trabajo del agente
1. Leer README, CHANGELOG, este documento y los archivos implicados.
2. Trabajar en rama y PR pequeño, nunca directamente en main sin autorización.
3. Describir el comportamiento a cambiar, riesgos y contratos de datos.
4. Implementar con tests unitarios/E2E. Ejecutar `npm run check` y `npm run test:e2e` y reportar resultados reales, nunca inventados.
5. Mantener CHANGELOG y proponer bump SemVer para releases.

## Comandos
```bash
npm ci
npm run dev
npm run check
npm run test:unit
npx playwright install
npm run test:e2e
npm run build
```
Node 22. El lockfile debe estar actualizado y comprometido para que `npm ci` funcione.

## Arquitectura
- `index.html`: HTML de entrada de Vite; scripts clásicos **ordenados**.
- `src/styles/legacy.css`: CSS legado, cascada conservada.
- `public/legacy/scripts/00.js` a `31.js`: lógica global original, dependiente del orden y de los handlers inline. **No** cambiar ciegamente a `type=module`.
- `src/locales/es.json` y `en.json`: fuente de verdad de traducciones declarativas. `data-i18n` se transforma por Vite en `data-es` y `data-en` para compatibilidad. No duplicar strings.
- `src/data/`: extraer aquí planetas, misiones, preguntas, recompensas y logros, **un dominio a la vez**; eliminar el origen legado al conectar el nuevo módulo.
- `src/assets/`: extraer SVG/audio/imágenes inline gradualmente, con pruebas visuales.
- `tests/unit/`: lógica pura, esquemas y contratos; `tests/e2e/`: recorridos completos y persistencia.

Los 91 bloques CSS y 32 bloques JS originales se separaron preservando orden, no se refactorizaron. La migración profesional es **incremental**: módulos ESM en `src/`, adaptadores a globals, tests antes de borrar código legado. No crear scaffolding vacío como sustituto de código funcional.

## Contratos críticos
- Progreso independiente por piloto. Conservar claves localStorage/sessionStorage, compatibilidad de backups y migraciones de datos. Nunca borrar progreso como arreglo.
- Safari puede bloquear almacenamiento y autoplay: mantener shim y gestos de usuario para audio/fullscreen. Validar modo privado en dispositivo real.
- Arranque desde splash con **un toque**, sin pantalla negra ni excepciones JS.
- Traducciones español/inglés completas, incluyendo textos dinámicos al migrarlos. Nuevas claves descriptivas; `ui.NNN` es transitorio.
- Preguntas matemáticamente correctas y acordes con tablas 1–12.
- Sin CDNs, fuentes remotas ni recursos externos en producción; `dist/` autocontenido.

## Definition of done
`npm run check` y E2E sin fallos (o documentar exactamente qué no se pudo ejecutar); arranque con un toque; navegación, perfiles, misiones, ajustes, sonido, backups y tutorial sin regresiones; UI responsive y accesible; traducciones correctas; changelog y versión coherentes. Playwright WebKit no equivale a Safari de iOS.

## Prioridades técnicas
1. Reproducir problemas de splash Safari y SVG malformados con tests.
2. E2E de misión, historial, guardado/restauración y perfiles.
3. Extraer datos y traducciones dinámicas; aislar persistencia.
4. Extraer SVG/audio; separar UI y lógica por feature.
5. Convertir gradualmente globals a módulos sin perder compatibilidad.

**Ante la duda: preservar datos y funcionamiento antes que refactorizar por estética.**
