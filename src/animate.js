// Copyright 2026 Linu Alex. SPDX-License-Identifier: Apache-2.0
// Move animation as a pure function of time, so every frame rate (and a still image
// taken mid-move) draws exactly the same piece positions.
import { placement } from './game.js';

/**
 * Underdamped spring step response, matching SwiftUI's
 * .spring(response:dampingFraction:) that the Slate Chess app animates moves with.
 * @param {number} t seconds since the move started
 * @returns {number} 0 at rest on the origin, 1 at rest on the destination
 */
export function spring(t, { response = 0.26, damping = 0.82 } = {}) {
  if (t <= 0) return 0;
  const w0 = (2 * Math.PI) / response;
  if (damping >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - damping * damping);
  const env = Math.exp(-damping * w0 * t);
  return 1 - env * (Math.cos(wd * t) + ((damping * w0) / wd) * Math.sin(wd * t));
}

/** The pieces a move relocates, including the rook in castling. */
export function movers(rec) {
  const list = [{ from: rec.from, to: rec.to }];
  if (rec.flags.includes('k') || rec.flags.includes('q')) {
    const rank = rec.color === 'w' ? '1' : '8';
    list.push(rec.flags.includes('k')
      ? { from: 'h' + rank, to: 'f' + rank }
      : { from: 'a' + rank, to: 'd' + rank });
  }
  return list;
}

/** Square of the captured piece (differs from `to` only for en passant). */
export function captureSquare(rec) {
  if (!rec.captured) return null;
  return rec.flags.includes('e') ? rec.to[0] + rec.from[1] : rec.to;
}

/**
 * Pieces to draw for a move `elapsed` seconds in.
 * @returns {{still: {sq, piece}[], moving: {from, to, p, piece}[], fading: {sq, piece, opacity}[], done: boolean}}
 */
export function frameOfMove(rec, elapsed, theme) {
  const duration = theme.moveDuration;
  if (elapsed >= duration) return settled(rec.fenAfter);

  const before = placement(rec.fenBefore);
  const p = spring(elapsed, theme.spring);
  const moving = movers(rec).map((m) => ({ ...m, p, piece: before[m.from] }));
  const capSq = captureSquare(rec);
  const fading = [];
  if (capSq) {
    // The captured piece goes as the attacker arrives, not before it leaves.
    fading.push({ sq: capSq, piece: before[capSq], opacity: Math.max(0, 1 - Math.max(0, p - 0.55) / 0.35) });
  }
  const skip = new Set([...moving.map((m) => m.from), capSq].filter(Boolean));
  const still = Object.entries(before)
    .filter(([sq]) => !skip.has(sq))
    .map(([sq, piece]) => ({ sq, piece }));
  return { still, moving, fading, done: false };
}

/** A position at rest. */
export function settled(fen) {
  return {
    still: Object.entries(placement(fen)).map(([sq, piece]) => ({ sq, piece })),
    moving: [], fading: [], done: true,
  };
}
