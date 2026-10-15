// Copyright 2026 Linu Alex. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerPieceSet, pieceDefs, resolveTheme, PIECE_COLOURS } from '../src/index.js';
import classic from '../src/pieces/classic-staunton.js';
import modern from '../src/pieces/modern-staunton.js';

registerPieceSet(classic); registerPieceSet(modern);
const sym = (defs, code) => defs.match(new RegExp(`<symbol id="t-${code}"[^>]*>(.*?)</symbol>`))[1];

test('the twelve piece colours, in the app order', () => {
  assert.deepEqual(Object.keys(PIECE_COLOURS), ['original', 'ivoryGraphite', 'pearlSlate', 'champagneSteel', 'ivoryEspresso',
    'blushBurgundy', 'creamCocoa', 'pistachioLagoon', 'sandClaret', 'porcelainNavy', 'parchmentMoss', 'amberSky']);
});

test('original keeps the artwork colours', () => {
  assert.equal(pieceDefs('modern-staunton', 't', resolveTheme({}).tint), pieceDefs('modern-staunton', 't'));
});

test('Amber & Sky matches the app: amber white, sky black, one dark outline', () => {
  for (const set of ['classic-staunton', 'modern-staunton']) {
    const defs = pieceDefs(set, 't', resolveTheme({ pieceColours: 'amberSky' }).tint);
    const w = sym(defs, 'wK'), b = sym(defs, 'bK');
    assert.match(w, /#F9D978/); assert.match(w, /#16100B/); assert.doesNotMatch(w, /#84D6EC/);
    assert.match(b, /#84D6EC/); assert.match(b, /#16100B/); assert.doesNotMatch(b, /#F9D978/);
    assert.doesNotMatch(defs, /#fff\b|#000\b|#1f1a17/i, set);
  }
});

test('a classic pair swaps fill and line on both sides', () => {
  const defs = pieceDefs('modern-staunton', 't', resolveTheme({ pieceColours: 'porcelainNavy' }).tint);
  for (const code of ['wQ', 'bQ']) { const s = sym(defs, code); assert.match(s, /#EFF3F8/); assert.match(s, /#1F3357/); }
});

test('unknown piece colours are an error that lists the choices', () => {
  assert.throws(() => resolveTheme({ pieceColours: 'neon' }), /amberSky/);
});
