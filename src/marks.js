// Copyright 2026 Linu Alex. SPDX-License-Identifier: Apache-2.0
// Teaching marks on a board: arrows, square highlights, circles and badges, in whichever
// shorthand a page writes them ("e2e4 green", ["d7", "red"], { square, color }).

const sqRe = /^[a-h][1-8]$/;
export const NO_MARKS = { arrows: [], highlights: [], circles: [], badges: [] };

function parseArrow(a) {
  if (Array.isArray(a)) return { from: a[0], to: a[1], color: a[2] };
  if (typeof a === 'string') { const [mv, color] = a.trim().split(/\s+/); return { from: mv.slice(0, 2), to: mv.slice(2, 4), color }; }
  return a;
}
function parseSquareMark(h, key = 'color') {
  if (Array.isArray(h)) return { square: h[0], [key]: h[1] };
  if (typeof h === 'string') { const [square, v] = h.trim().split(/\s+/); return { square, [key]: v }; }
  return h;
}

/** Normalise the many ways a page can write marks. */
export function parseMarks(m = {}) {
  const out = {
    arrows: (m.arrows || []).map(parseArrow),
    highlights: (m.highlights || []).map((h) => parseSquareMark(h)),
    circles: (m.circles || []).map((h) => parseSquareMark(h)),
    badges: (m.badges || []).map((b) => parseSquareMark(b, 'glyph')),
  };
  for (const a of out.arrows) if (!sqRe.test(a.from) || !sqRe.test(a.to)) throw new Error(`Bad arrow ${JSON.stringify(a)}`);
  for (const k of ['highlights', 'circles', 'badges']) for (const h of out[k]) if (!sqRe.test(h.square)) throw new Error(`Bad square in ${k}: ${JSON.stringify(h)}`);
  return out;
}
