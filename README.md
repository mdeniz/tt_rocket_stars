# TT Rocket Stars 🚀

Juego educativo offline-first de multiplicaciones y divisiones (tablas 1–12) con misiones espaciales, planetas, recompensas, cohetes y perfiles de piloto. Sin anuncios ni cuentas.

**Versión semántica:** `0.1.0`. El prototipo histórico **v190** es el punto de partida, no una versión SemVer.

## Desarrollo

Requiere Node.js 22:

```bash
npm install
npm run dev
npm run check
npx playwright install
npm run test:e2e
npm run build
npm run preview
```

Vite sirve la aplicación normalmente en http://localhost:5173. La versión compilada está en `dist/`. No abras el `index.html` de desarrollo directamente: Vite inyecta traducciones durante dev/build. El repositorio incluye `package-lock.json` y la CI usa `npm ci` para instalaciones reproducibles.

## Estructura

```text
index.html                   Entrada HTML de Vite
vite.config.mjs              Configuración y traducciones
src/styles/legacy.css        CSS legado, orden original
public/legacy/scripts/       32 scripts clásicos ordenados
src/locales/{es,en}.json     Traducciones declarativas
src/data/                    Datos de dominio (migración pendiente)
src/assets/                  SVG, audio, imágenes (migración pendiente)
scripts/                     Herramientas de validación e i18n
tests/unit/                  Tests unitarios
tests/e2e/                   Playwright Chromium/Firefox/WebKit
.github/workflows/ci.yml     CI
AGENTS.md                    Guía de agentes
CHANGELOG.md                 SemVer y cambios
```

La v190 era un único HTML. Se han extraído los estilos y scripts manteniendo orden y semántica. La modularización de lógica, datos, SVG inline y textos dinámicos debe hacerse progresivamente, sin duplicar fuentes de verdad.

## Calidad y navegadores

`npm run check` valida sintaxis de los 32 scripts, traducciones y build. `npm run test:e2e` comprueba el arranque y la navegación en Chromium, Firefox, WebKit y WebKit móvil. WebKit en Linux no sustituye Safari real en iPhone. Validar en iOS el primer toque, audio, fullscreen, almacenamiento restringido y orientación.

## Versionado

Seguimos MAJOR.MINOR.PATCH. PATCH: correcciones compatibles; MINOR: funcionalidades y cambios documentados durante 0.x; MAJOR: contrato estable o cambios incompatibles tras 1.0. Actualizar `package.json`, lockfile y `CHANGELOG.md`, ejecutar pruebas y crear tag `vX.Y.Z`. No continuar numerando HTML como v191, v192.

## Privacidad y datos

Progreso guardado localmente por piloto, sin sincronización entre dispositivos. Borrar los datos del navegador puede eliminarlo; usar copias de seguridad.

## Licencia

No hay licencia open-source definida. Repositorio privado, derechos reservados.
