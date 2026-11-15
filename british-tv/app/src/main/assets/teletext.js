/* Teletext viewer for Telly Addicts: draws a 40 x 25 teletext page (level 1: colours, mosaic graphics, double height,
 * flash, hold graphics, Fastext) on a canvas, parses the plain-text .tti page files that teletext services publish, and
 * builds pages from a small markup. Written for this app; no outside code. */
(function () {
  'use strict';
  var COLS = 40, ROWS = 25, CW = 20, CH = 24;
  var COLOURS = ['#000000', '#ff2a2a', '#25e04a', '#ffe81a', '#2a3cff', '#ff2aff', '#1ae8f0', '#ffffff'];
  var MARK = { r: 1, g: 2, y: 3, b: 4, m: 5, c: 6, w: 7, R: 17, G: 18, Y: 19, B: 20, M: 21, C: 22, W: 23,
    f: 8, s: 9, N: 12, H: 13, bk: 28, nb: 29, hold: 30, rel: 31, con: 25, sep: 26, k: 0 };
  var FONT = {32:[0,0,0,0,0,0,0,0,0],33:[0,8,8,8,8,0,8,0,0],34:[0,20,20,20,0,0,0,0,0],35:[0,20,20,62,20,62,20,20,0],36:[8,28,42,40,28,10,42,28,8],37:[16,42,18,4,8,18,21,2,0],38:[0,24,36,36,24,38,36,26,0],39:[0,8,8,8,0,0,0,0,0],40:[0,4,8,8,8,8,8,4,0],41:[0,8,4,4,4,4,4,8,0],42:[0,0,34,20,62,20,34,0,0],43:[0,0,8,8,62,8,8,0,0],44:[0,0,0,0,0,12,4,4,8],45:[0,0,0,0,62,0,0,0,0],46:[0,0,0,0,0,12,12,0,0],47:[0,2,2,4,8,16,16,0,0],48:[0,12,18,18,18,18,12,0,0],49:[0,8,24,8,8,8,28,0,0],50:[0,12,18,2,4,8,30,0,0],51:[0,30,4,12,2,2,28,0,0],52:[0,4,12,20,36,62,4,0,0],53:[0,30,16,28,2,2,28,0,0],54:[0,12,16,28,18,18,12,0,0],55:[0,30,2,2,4,8,8,0,0],56:[0,12,18,12,18,18,12,0,0],57:[0,12,18,18,14,2,12,0,0],58:[0,0,12,12,0,12,12,0,0],59:[0,0,12,12,0,12,4,4,8],60:[0,0,6,24,32,24,6,0,0],61:[0,0,0,62,0,62,0,0,0],62:[0,0,48,12,2,12,48,0,0],63:[12,18,2,12,8,0,8,0,0],64:[0,28,36,42,44,32,28,0,0],65:[0,8,20,34,62,34,34,0,0],66:[0,60,34,60,34,34,60,0,0],67:[0,12,18,16,16,18,12,0,0],68:[0,28,18,18,18,18,28,0,0],69:[0,30,16,28,16,16,30,0,0],70:[0,30,16,28,16,16,16,0,0],71:[0,12,18,16,22,18,12,0,0],72:[0,18,18,30,18,18,18,0,0],73:[0,28,8,8,8,8,28,0,0],74:[0,14,4,4,4,36,24,0,0],75:[0,18,20,24,20,18,18,0,0],76:[0,16,16,16,16,16,30,0,0],77:[0,34,54,42,42,34,34,0,0],78:[0,18,26,22,18,18,18,0,0],79:[0,28,34,34,34,34,28,0,0],80:[0,28,18,18,28,16,16,0,0],81:[0,12,18,18,26,22,12,2,0],82:[0,28,18,18,28,18,18,0,0],83:[0,12,18,8,4,18,12,0,0],84:[0,62,8,8,8,8,8,0,0],85:[0,18,18,18,18,18,12,0,0],86:[0,18,18,18,30,12,12,0,0],87:[0,34,34,42,42,54,34,0,0],88:[0,34,20,8,8,20,34,0,0],89:[0,34,34,20,8,8,8,0,0],90:[0,30,2,4,8,16,30,0,0],91:[0,28,16,16,16,16,28,0,0],92:[0,16,16,8,4,2,2,0,0],93:[0,28,4,4,4,4,28,0,0],94:[0,8,20,34,0,0,0,0,0],95:[0,0,0,0,0,0,0,0,62],96:[0,8,4,0,0,0,0,0,0],97:[0,0,0,14,18,18,14,0,0],98:[0,16,16,28,18,18,28,0,0],99:[0,0,0,14,16,16,14,0,0],100:[0,2,2,14,18,18,14,0,0],101:[0,0,0,12,22,24,14,0,0],102:[0,4,10,8,28,8,8,0,0],103:[0,0,0,12,18,18,14,2,12],104:[0,16,16,28,18,18,18,0,0],105:[0,8,0,24,8,8,28,0,0],106:[0,4,0,12,4,4,4,20,8],107:[0,16,16,20,24,20,18,0,0],108:[0,24,8,8,8,8,28,0,0],109:[0,0,0,52,42,42,34,0,0],110:[0,0,0,28,18,18,18,0,0],111:[0,0,0,12,18,18,12,0,0],112:[0,0,0,28,18,18,28,16,16],113:[0,0,0,14,18,18,14,2,2],114:[0,0,0,20,26,16,16,0,0],115:[0,0,0,14,24,6,28,0,0],116:[0,8,8,28,8,10,4,0,0],117:[0,0,0,18,18,18,14,0,0],118:[0,0,0,18,18,12,12,0,0],119:[0,0,0,34,42,42,20,0,0],120:[0,0,0,18,12,12,18,0,0],121:[0,0,0,18,18,18,14,18,12],122:[0,0,0,30,4,8,30,0,0],123:[4,8,8,16,8,8,4,0,0],124:[0,8,8,8,8,8,8,8,0],125:[16,8,8,4,8,8,16,0,0],126:[0,0,10,20,0,0,0,0,0],163:[0,12,18,16,60,16,62,0,0],189:[0,18,52,20,18,10,27,0,0],247:[0,0,8,0,62,0,8,0,0],8592:[0,0,8,16,62,16,8,0,0],8593:[0,8,28,42,8,8,8,0,0],8594:[0,0,4,2,62,2,4,0,0],9632:[0,62,62,62,62,62,62,0,0]};
  // teletext's national-option positions -> the glyph to draw (6 x 9 pixel letters from the public-domain X11 fixed font, plus a few drawn by hand)
  var NATIONAL = { 0x23: 0xa3, 0x5b: 0x2190, 0x5c: 0xbd, 0x5d: 0x2192, 0x5e: 0x2191, 0x5f: 35, 0x60: 45, 0x7b: 0xbd, 0x7c: 124, 0x7d: 0xbd, 0x7e: 0xf7, 0x7f: 0x25a0 };

  /** Build one row of 40 codes from text with {tokens}: {y} yellow text, {B} blue graphics, {nb} new background, {H} double height, {#127} a mosaic or raw code. */
  function row(str) {
    var out = [], i = 0;
    str = String(str || '');
    while (i < str.length && out.length < COLS) {
      var ch = str.charAt(i);
      if (ch === '{') {
        var j = str.indexOf('}', i), tok = str.slice(i + 1, j);
        if (tok.charAt(0) === '#') out.push(parseInt(tok.slice(1), 10) & 127);
        else if (MARK[tok] != null) out.push(MARK[tok]);
        i = j + 1;
      } else { out.push(ch === '£' ? 0x23 : str.charCodeAt(i) & 127); i++; }
    }
    while (out.length < COLS) out.push(32);
    return out;
  }
  function page(num, lines, fast) {
    var rows = [];
    for (var r = 0; r < ROWS; r++) rows.push(row(lines[r] || ''));
    return { num: num, rows: rows, fast: fast || [] };
  }

  /** Parse a .tti file (text, many pages) -> [{num, sub, rows, fast}] */
  function parseTTI(text) {
    var pages = [], p = null;
    String(text).split(/\r?\n/).forEach(function (ln) {
      var k = ln.slice(0, 2), v = ln.slice(3);
      if (k === 'PN') { p = { num: +String(v).slice(0, 3), sub: +String(v).slice(3) || 0, rows: [], fast: [] }; for (var r = 0; r < ROWS; r++) p.rows.push(row('')); pages.push(p); }
      else if (!p) return;
      else if (k === 'OL') {
        var c = v.indexOf(','), n = +v.slice(0, c), t = v.slice(c + 1), codes = [];
        for (var i = 0; i < t.length && codes.length < COLS; i++) {
          var cc = t.charCodeAt(i);
          if (cc === 27 && i + 1 < t.length) { codes.push((t.charCodeAt(i + 1) - 64) & 31); i++; } else codes.push(cc & 127);
        }
        while (codes.length < COLS) codes.push(32);
        if (n >= 0 && n < ROWS) p.rows[n] = codes;
      } else if (k === 'FL') p.fast = v.split(',').map(function (x) { return parseInt(x, 16); });
    });
    return pages;
  }

  function draw(cv, pg, flashOn) {
    var ctx = cv.getContext('2d');
    cv.width = COLS * CW; cv.height = ROWS * CH;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.textBaseline = 'alphabetic';
    var dblBg = null;
    for (var r = 0; r < ROWS; r++) {
      var codes = pg.rows[r];
      if (dblBg) {                                           // the row under double-height text carries only its background
        for (var q = 0; q < COLS; q++) if (!dblBg.m[q]) { ctx.fillStyle = COLOURS[dblBg.b[q]]; ctx.fillRect(q * CW, r * CH, CW, CH); }
        dblBg = null; continue;
      }
      var fg = 7, bg = 0, gfx = false, sep = false, dbl = false, flash = false, hold = false, held = 32, conceal = false, bgs = [], mask = [], sawDbl = false;
      for (var c = 0; c < COLS; c++) {
        var code = codes[c], ctl = code < 32, x = c * CW, y = r * CH, glyph = code;
        if (ctl) {
          // set-at codes act on their own cell
          if (code === 9) flash = false; else if (code === 12) { dbl = false; held = 32; } else if (code === 25) sep = false; else if (code === 26) sep = true;
          else if (code === 28) bg = 0; else if (code === 29) bg = fg; else if (code === 30) hold = true;
          glyph = hold && gfx ? held : 32;
        } else if (gfx && (code & 0x20)) held = code;
        var showHeld = ctl && hold && gfx;
        ctx.fillStyle = COLOURS[bg]; ctx.fillRect(x, y, CW, dbl ? CH * 2 : CH);
        bgs.push(bg); mask.push(dbl);
        var visible = !(conceal) && !(flash && !flashOn);
        if (visible && glyph !== 32 && (!ctl || showHeld)) {
          ctx.fillStyle = COLOURS[fg];
          if (gfx && (glyph & 0x20)) {
            var b = [1, 2, 4, 8, 16, 64], hh = dbl ? CH * 2 : CH, third = hh / 3;
            for (var k = 0; k < 6; k++) if (glyph & b[k]) {
              var cx = (k % 2) * (CW / 2), cy = Math.floor(k / 2) * third;
              ctx.fillRect(x + cx, y + cy, CW / 2 - (sep ? 2 : 0), third - (sep ? 2 : 0));
            }
          } else {
            var gl = FONT[NATIONAL[glyph] || glyph];
            if (gl) {
              var pw = CW / 6, ph = (dbl ? CH * 2 : CH) / 9;
              for (var gy = 0; gy < 9; gy++) { var bits = gl[gy]; if (!bits) continue; for (var gx = 0; gx < 6; gx++) if ((bits >> (5 - gx)) & 1) ctx.fillRect(x + gx * pw, y + gy * ph, pw + 0.4, ph + 0.4); }
            }
          }
        }
        if (ctl) {                                           // set-after codes take effect from the next cell
          if (code <= 7) { fg = code; gfx = false; conceal = false; held = 32; }
          else if (code === 8) flash = true;
          else if (code === 13) { dbl = true; sawDbl = true; }
          else if (code >= 17 && code <= 23) { fg = code - 16; gfx = true; conceal = false; }
          else if (code === 24) conceal = true;
          else if (code === 31) hold = false;
        }
      }
      if (sawDbl) { dblBg = { b: bgs, m: mask }; }
    }
  }
  /** What can be selected on a page, in reading order: every page number in the text (100-899), then the Fastext labels on the bottom line. */
  function links(pg) {
    var out = [], r, c;
    for (r = 1; r < ROWS - 1; r++) {
      var codes = pg.rows[r], gfxOn = false;
      for (c = 0; c < COLS - 2; c++) {
        var k = codes[c];
        if (k < 32) { if (k <= 7) gfxOn = false; else if (k >= 17 && k <= 23) gfxOn = true; continue; }
        if (gfxOn) continue;
        var d0 = codes[c] - 48, d1 = codes[c + 1] - 48, d2 = codes[c + 2] - 48;
        if (d0 >= 1 && d0 <= 8 && d1 >= 0 && d1 <= 9 && d2 >= 0 && d2 <= 9 &&
            !(codes[c - 1] >= 48 && codes[c - 1] <= 57) && !(codes[c + 3] >= 48 && codes[c + 3] <= 57)) {
          out.push({ row: r, c0: c, c1: c + 3, target: d0 * 100 + d1 * 10 + d2 }); c += 2;
        }
      }
    }
    var last = pg.rows[ROWS - 1], starts = [];
    for (c = 0; c < COLS; c++) if (last[c] === 1 || last[c] === 2 || last[c] === 3 || last[c] === 6) starts.push(c);
    starts.forEach(function (st, n) {
      var end = n + 1 < starts.length ? starts[n + 1] : COLS;
      while (end > st + 1 && last[end - 1] === 32) end--;
      if (end > st + 1 && pg.fast[n] > 0) out.push({ row: ROWS - 1, c0: st + 1, c1: end, target: pg.fast[n], fast: 1 });
    });
    return out;
  }
  /** Draw the selection box round a link. */
  function mark(cv, l) {
    if (!l) return;
    var ctx = cv.getContext('2d');
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(l.c0 * CW - 2, l.row * CH, (l.c1 - l.c0) * CW + 4, CH);
    ctx.strokeRect(l.c0 * CW - 2, l.row * CH + 1.5, (l.c1 - l.c0) * CW + 4, CH - 3);
  }
  window.Teletext = { links: links, mark: mark, row: row, page: page, parseTTI: parseTTI, draw: draw, COLS: COLS, ROWS: ROWS, CW: CW, CH: CH };
})();
