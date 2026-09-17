# Eclipse Arena

An auto-battle arena where mystical warriors clash with unique skills and powerful ultimates. Watch up to four fighters bounce, collide, and turn the tide of battle.

**[Play Eclipse Arena](https://epenguin-77.github.io/Eclipse-ArenaEclipse-ArenaEclipse-Arena/)**

## Play locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Choose an arena, select 2–4 fighters, then start the match. Battles use automatic skills. Pause/resume with the on-screen button or Space; rematch and roster selection are available after a battle. Mobile play uses portrait orientation.

The current game includes 38 fighters and two arenas. The game interface is in Thai.

## Production build

```sh
npm run build
npm run preview
```

The generated `dist/` directory can be hosted by a static web server at its domain root. No backend or environment secrets are required. The GitHub Actions workflow builds and publishes GitHub Pages automatically on pushes to `main`, with the correct repository path for scripts, styles and artwork.

## Project layout

```text
src/
  app/             Screens, game session and HUD
  content/         Characters, abilities, arenas and active asset catalogs
  config/          Game settings and balance values
  abilities/       Character-specific skill behavior
  characters/      Character creation and registry
  combat/          Damage and health
  physics/         Movement and collisions
  presentation/    Canvas drawing, animation and effects
  core/            Simulation and match lifecycle
  contracts/       Shared TypeScript types
  .../             Supporting runtime systems
public/assets/
  characters/      Selected portraits and portrait auras, grouped by character
  vfx/             Active skill sprites and animation atlases
  ui/              Interface frames, backgrounds and scenes
  arenas/          Arena artwork
```

This repository contains the playable release source and its required artwork. Experimental panels, artwork comparison tools, alternate drafts, test reports and generation tooling remain in the local development workspace.
