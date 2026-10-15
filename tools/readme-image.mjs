// Copyright 2026 Linu Alex. SPDX-License-Identifier: Apache-2.0
// Renders the README's diagrams with the library itself: npm run readme-image
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, fenAt, plyRecord, findPly, splitPGN, resolveTheme, registerPieceSet, boardDocument, parseMarks } from '../src/index.js';
import classic from '../src/pieces/classic-staunton.js';
import modern from '../src/pieces/modern-staunton.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
registerPieceSet(classic); registerPieceSet(modern);
const [opera, immortal] = splitPGN(fs.readFileSync(path.join(root, 'games/showcase.pgn'), 'utf8')).map((pgn) => loadGame({ pgn }));
const out = (name, svg) => { fs.writeFileSync(path.join(root, 'docs', name), svg + '\n'); console.log(`docs/${name}`); };
const at = (game, ref) => { const ply = findPly(game, ref); return { fen: fenAt(game, ply), lastMove: plyRecord(game, ply) }; };

// The Opera Game, 16.Qb8+: the queen sacrifice, with the mating idea marked.
out('opera-game.svg', boardDocument(
  { ...at(opera, '16.Qb8+'), ...parseMarks({ arrows: ['d1d8 blue'], circles: ['d8 red'] }) },
  resolveTheme({ scheme: 'mahogany', pieceSet: 'classic-staunton', surface: 'transparent' }), 480, 'op'));
// The Immortal Game's final position: Classic Staunton in Amber & Sky on Navy, the app's dark-board pairing.
out('immortal-game.svg', boardDocument(
  at(immortal, '23.Be7#'),
  resolveTheme({ scheme: 'navy', pieceSet: 'classic-staunton', pieceColours: 'amberSky', surface: 'transparent' }), 480, 'im'));
