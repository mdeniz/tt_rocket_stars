# TT Rocket Stars 🚀

Juego educativo offline-first de multiplicaciones y divisiones (tablas 1–12) con misiones espaciales, planetas, recompensas, cohetes y perfiles de piloto. Sin anuncios ni cuentas.

**Versión semántica:** `0.1.1`. El prototipo histórico **v190** es el punto de partida, no una versión SemVer.

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

## Crear una release

Tras documentar los cambios en `CHANGELOG.md` bajo `Unreleased`, crea el HTML distribuible con uno de estos comandos:

```bash
npm run release -- patch
npm run release -- minor
npm run release -- major
# o una versión concreta mayor que la actual:
npm run release -- 0.2.0
```

El comando valida la versión SemVer, ejecuta `npm run check`, actualiza `package.json`, `package-lock.json`, `README.md` y `CHANGELOG.md`, y genera `releases/tt-rocket-stars-vX.Y.Z.html`. No crea commits, etiquetas de Git ni publica nada.

Después, confirma esos cambios en Git y sube el tag correspondiente para publicar el mismo HTML como descarga de una GitHub Release:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

El workflow exige que el tag coincida exactamente con `package.json` y que exista la entrada de esa versión en `CHANGELOG.md`.

La aplicación publicada para móviles está en [GitHub Pages](https://mdeniz.github.io/tt_rocket_stars/). Cada push a `main` vuelve a construir y desplegar el HTML autocontenido mediante el workflow de Pages.

Vite sirve la aplicación normalmente en http://localhost:5173. `npm run build` genera una distribución autocontenida en `dist/index.html`: CSS, JavaScript y recursos visuales quedan embebidos, por lo que se puede copiar o abrir sin archivos adyacentes. No abras el `index.html` de desarrollo directamente: Vite inyecta traducciones durante dev/build. El repositorio incluye `package-lock.json` y la CI usa `npm ci` para instalaciones reproducibles.

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
