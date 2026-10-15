# Slate Chessboard changelog

## 0.4.0 (2026-10-15)

- **Piece colours**: the app's twelve pairings (`pieceColours` option, `setPieceColours`, `SlateChessboard.pieceColours()`,
  a third appearance menu, remembered with `remember`). Same names, hex values and recolouring rule as the app's
  `PieceTint`. **Amber & Sky** lights both sides by hue with one shared outline: the pairing for the dark boards.
- README: the dark-board diagram is now Classic Staunton in Amber & Sky on Navy.

## 0.3.1 (2026-10-15)

- **FEN input**: a `fen` option shows one position (diagrams, puzzle starts); `games` and the no-code embed also accept
  a FEN, or a list mixing PGN and FEN. A placement-only FEN is read as White to move. A position with no moves shows
  "Position" and the side to move instead of players and a move count. New helpers: `isFEN`, `toGames`.
- README diagrams, drawn by the library (`npm run readme-image`).

## 0.3.0 (2026-10-15)

First public release.

- **One readable source tree** in `src/` replaces the minified `vendor/chess-stage.js`: the board, the stage, and the
  pure core (game model, themes, marks, SVG rendering, animation), each file under Apache 2.0.
- **One script tag**: `dist/slate-chessboard.all.js` carries the board, its stylesheet and the Classic Staunton pieces.
  The separate files are still built: `dist/slate-chessboard.js` (global), `.mjs` (ES module), `.css`, and
  `dist/pieces/<name>.js` (registering script) or `.mjs` (module).
- Built with esbuild from npm's chess.js 1.4.0 (`npm run build`); its BSD 2-Clause notice is kept in every bundle.
- One API on `SlateChessboard`: the `ChessStage` global is gone. The bare stage is `SlateChessboard.createStage`
  (and `board.stage` as before), plus `listen`, `loadGame`, `boardSVG`, `boardDocument`, `registerPieceSet`,
  `parseMarks` and the rest of the core. Parent-window messages use the key `slateChessboard`.
- The 20 colour schemes and their labels live in the core (`SCHEMES`, `SCHEME_LABELS`), in the app's order.
- `SlateChessboard.DEFAULT_THEME` is now the stage's full default theme; the board's own defaults are `BOARD_THEME`.
- Piece scripts may load before or after the library.
- Board UI only: the video tooling the runtime came with (director timelines, narration audio, captions, the
  landscape/portrait/square video layouts, the timeline scrubber) is not part of the library. The stage keeps
  moves, animation, marks, variations, its controls and `listen`; `layout`, `setCaption`, `play(director)`,
  `cue`, `seek` and `setLayout` are gone.
- Showcase games are now three classics: the Opera Game, the Immortal Game and the Evergreen Game.
- Tests: `npm test` (node --test).

## Before 0.3.0

Earlier versions were used only on slatechess.com and were not published.
