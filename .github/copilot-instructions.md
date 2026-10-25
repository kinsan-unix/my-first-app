# Copilot instructions

Respond in Japanese. Write explanations in Japanese.

## Project structure and architecture

This is a dependency-free browser game, not a Node.js application. `index.html` defines the Japanese-language page and game controls, loads `style.css`, and loads `game.js` with `defer`.

The game is drawn on the `<canvas id="game">` element. `game.js` owns the game state, keyboard and pointer input, physics, platform collision, camera, and Canvas rendering. Its `requestAnimationFrame` loop updates the world and then renders it. The world uses pixel coordinates (currently 3200 px wide); the camera offsets world positions to create horizontal scrolling. CSS scales the fixed 16:9 canvas to fit the page and handles the responsive layout and touch controls.

Keep page structure and accessible labels in HTML, presentation and responsive behavior in CSS, and gameplay behavior and drawing in JavaScript. Keep the game playable with both keyboard and touch input when changing controls.

## Commands

There is no package manifest, build script, test runner, or configured linter. No automated single-test command is available.

- Check JavaScript syntax: `node --check game.js`
- Serve the page locally: `python3 -m http.server 8000`, then open `http://localhost:8000`

## Conventions

- Page text and user-facing controls are primarily Japanese; preserve the existing language and accessible names when editing the UI.
- Keep the implementation framework-free and use browser APIs directly.
- Game tuning values and the level layout are defined near the top of `game.js`; world positions are in canvas pixels, while update-loop delta time is in seconds.
- Add or update the existing HTML hooks (`id` and `data-control`) consistently when changing controls; `game.js` binds directly to those elements.
- Use the existing CSS media queries for responsive layout and touch-control visibility.
