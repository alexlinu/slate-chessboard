// Copyright 2026 Linu Alex. SPDX-License-Identifier: Apache-2.0
// Game model: turns PGN (including variations, comments and NAGs) or a FEN into
// a flat list of plies the board can index by number.
//
// chess.js validates every move; this file only adds what it doesn't keep:
// the variation tree, so a script can say "show the variation after 14...Nxe4".
import { Chess } from 'chess.js';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const NAG_GLYPHS = { 1: '!', 2: '?', 3: '!!', 4: '??', 5: '!?', 6: '?!' };

/** Split PGN into header tags and movetext tokens. */
function tokenize(pgn) {
  const headers = {};
  // Tags may share a line; they never appear inside movetext.
  const body = pgn.replace(/\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/g, (_, k, v) => {
    headers[k] = v.replace(/\\"/g, '"');
    return '';
  });
  const tokens = [];
  const re = /\{([^}]*)\}|;([^\n]*)|(\()|(\))|\$(\d+)|(1-0|0-1|1\/2-1\/2|\*)|(\d+)\.(?:\.\.)?|([^\s{}();$]+)/g;
  let m;
  while ((m = re.exec(body))) {
    if (m[1] !== undefined) tokens.push({ t: 'comment', v: m[1].trim() });
    else if (m[2] !== undefined) tokens.push({ t: 'comment', v: m[2].trim() });
    else if (m[3]) tokens.push({ t: '(' });
    else if (m[4]) tokens.push({ t: ')' });
    else if (m[5]) tokens.push({ t: 'nag', v: +m[5] });
    else if (m[6]) tokens.push({ t: 'result', v: m[6] });
    else if (m[7]) continue; // move number
    else if (m[8]) {
      // Inline annotation glyphs ("Nxe4!?") become NAG-equivalents.
      const g = m[8].match(/^(.*?)([!?]{1,2})?$/);
      tokens.push({ t: 'san', v: g[1] });
      if (g[2]) tokens.push({ t: 'glyph', v: g[2] });
    }
  }
  return { headers, tokens };
}

function moveRecord(move, ply) {
  return {
    ply,                                   // 1 = White's first move
    moveNo: Math.ceil(ply / 2),
    color: move.color,
    san: move.san,
    from: move.from,
    to: move.to,
    piece: move.piece,
    captured: move.captured || null,
    promotion: move.promotion || null,
    flags: move.flags,
    fenBefore: move.before,
    fenAfter: move.after,
    comment: null,
    glyph: null,
    variations: [],                        // each: array of move records
  };
}

/** Parse a line of tokens starting from `fen`; returns [moves, nextIndex]. */
function parseLine(tokens, i, fen, firstPly) {
  const chess = new Chess(fen);
  const moves = [];
  let ply = firstPly;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.t === ')') return [moves, i + 1];
    if (tok.t === 'result') { i++; continue; }
    if (tok.t === 'comment') {
      const last = moves[moves.length - 1];
      if (last) last.comment = last.comment ? `${last.comment} ${tok.v}` : tok.v;
      i++; continue;
    }
    if (tok.t === 'nag' || tok.t === 'glyph') {
      const last = moves[moves.length - 1];
      if (last) last.glyph = tok.t === 'nag' ? (NAG_GLYPHS[tok.v] || last.glyph) : tok.v;
      i++; continue;
    }
    if (tok.t === '(') {
      // A variation is an alternative to the move just played.
      const last = moves[moves.length - 1];
      if (!last) throw new Error('PGN variation before any move');
      const [line, next] = parseLine(tokens, i + 1, last.fenBefore, last.ply);
      last.variations.push(line);
      i = next; continue;
    }
    if (tok.t === 'san') {
      let move;
      try { move = chess.move(tok.v, { strict: false }); } catch { move = null; }
      if (!move) throw new Error(`Illegal or unreadable move "${tok.v}" at ply ${ply}`);
      moves.push(moveRecord(move, ply));
      ply++; i++; continue;
    }
    i++;
  }
  return [moves, i];
}

/**
 * Load a game.
 * @param {{pgn?: string, fen?: string}} source
 * @returns {{headers: object, startFen: string, plies: object[], result: string|null}}
 */
export function loadGame(source) {
  if (typeof source === 'string') source = source.trim().startsWith('[') || /\d\./.test(source) ? { pgn: source } : { fen: source };
  if (source.fen && !source.pgn) {
    new Chess(source.fen); // validates
    return { headers: {}, startFen: source.fen, plies: [], result: null };
  }
  const { headers, tokens } = tokenize(source.pgn || '');
  const startFen = headers.FEN || source.fen || START_FEN;
  const startPly = startFen.split(' ')[1] === 'b' ? 2 : 1;
  const [plies] = parseLine(tokens, 0, startFen, startPly);
  const result = tokens.find((t) => t.t === 'result')?.v ?? headers.Result ?? null;
  return { headers, startFen, plies, result };
}

/** FEN of the position after `ply` (0 = start position). */
export function fenAt(game, ply) {
  if (ply <= 0 || !game.plies.length) return game.startFen;
  const rec = plyRecord(game, ply);
  return rec ? rec.fenAfter : game.plies[game.plies.length - 1].fenAfter;
}

/** Move record for a ply number, or null. */
export function plyRecord(game, ply) {
  return game.plies.find((p) => p.ply === ply) || null;
}

/** Last ply number in the main line (0 if none). */
export function lastPly(game) {
  return game.plies.length ? game.plies[game.plies.length - 1].ply : 0;
}

/**
 * Find a ply by a human reference: "14...Nxe4", "14.Nf3", "Nxe4", or a number.
 * Matching on both move number and SAN is what catches script typos.
 */
export function findPly(game, ref) {
  if (typeof ref === 'number') return ref;
  const s = String(ref).trim();
  if (/^\d+$/.test(s)) return +s;
  const m = s.match(/^(\d+)(\.\.\.|\.)\s*(.+)$/);
  const strip = (x) => x.replace(/[+#!?]/g, '');
  if (m) {
    const ply = (+m[1] - 1) * 2 + (m[2] === '...' ? 2 : 1);
    const rec = plyRecord(game, ply);
    if (!rec) throw new Error(`No ply ${s} in this game`);
    if (strip(rec.san) !== strip(m[3])) throw new Error(`Script says ${s} but the game has ${m[1]}${m[2]}${rec.san}`);
    return ply;
  }
  const hits = game.plies.filter((p) => strip(p.san) === strip(s));
  if (hits.length !== 1) throw new Error(`"${s}" matches ${hits.length} moves; add the move number`);
  return hits[0].ply;
}

/** Play SAN moves from a FEN (for variations written in a script). */
export function playLine(fen, sans, firstPly) {
  const chess = new Chess(fen);
  let ply = firstPly ?? (fen.split(' ')[1] === 'b' ? 2 : 1);
  return sans.map((san) => {
    const clean = san.replace(/^\d+\.(\.\.)?/, '');
    if (!clean) return null;
    let move;
    try { move = chess.move(clean, { strict: false }); } catch { move = null; }
    if (!move) throw new Error(`Illegal move "${san}" in variation`);
    return moveRecord(move, ply++);
  }).filter(Boolean);
}

/** SAN with move number, e.g. "14...Nxe4". */
export function moveLabel(rec) {
  return `${rec.moveNo}${rec.color === 'w' ? '.' : '...'}${rec.san}`;
}

/** Piece placement as { e4: 'wP', ... }. */
export function placement(fen) {
  const map = {};
  const rows = fen.split(' ')[0].split('/');
  rows.forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += +ch; continue; }
      const sq = 'abcdefgh'[f] + (8 - r);
      map[sq] = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase();
      f++;
    }
  });
  return map;
}
