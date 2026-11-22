/* Seasonal effects: a decorative pixel-art overlay drawn over the TV guide (first season: Christmas snow).
 * One transparent layer, never focusable, no input handling. It is drawn small and scaled up with no smoothing
 * for the 16-bit look. Other seasons (Halloween, New Year) can be added to SEASONS and drawn by their own painter. */
(function () {
  'use strict';

  // When each season runs: [month, day] from and to, inclusive. Months count from 0 (0 = January, 10 = November).
  // A season whose end is earlier in the year than its start runs over the new year.
  var SEASONS = [
    { id: 'xmas', label: 'Christmas snow', from: [10, 1], to: [0, 6], hat: 'santa' }
  ];

  // How it looks. PIXEL = screen pixels per canvas pixel (2 = 16-bit, 3 = chunkier). DRIFT is 0 to 10.
  var CFG = { PIXEL: 2, FLAKES: 96, DRIFT: 5, PAUSE_MS: 180,
              CYCLE_MS: 45000,       // drifts grow for this long, then the plough clears them and it starts again (the design is 15 min = 900000; 45 s for now so it can be seen)
              PLOUGH_MS: 12000,      // the plough's drive across the screen
              START: 0.12 };          // share of full drift height showing at the start of a cycle (0 to 1)
  var T0 = Date.now();               // the cycle runs from app start, so closing and opening the guide does not restart it

  function inSeason(s, d) {
    var v = d.getMonth() * 100 + d.getDate(), a = s.from[0] * 100 + s.from[1], b = s.to[0] * 100 + s.to[1];
    return a <= b ? v >= a && v <= b : v >= a || v <= b;
  }
  /** The season that is on at a date, or null. */
  function current(d) {
    d = d || new Date();
    for (var i = 0; i < SEASONS.length; i++) if (inSeason(SEASONS[i], d)) return SEASONS[i];
    return null;
  }

  // Snow sprites, 16-bit style: '#' the flake's own colour, 'b' its shaded edge, 'w' a bright highlight, '.' nothing.
  // Tiny and small flakes are plain; the medium and big ones are drawn with a shaded edge and a bright centre, like a 16-bit game.
  var SPR = {
    dot: ['#'], blob: ['##', '##'],
    plus: ['.#.', '###', '.#.'],
    cross: ['#.#', '.#.', '#.#'],
    star: ['..#..', '.#.#.', '##.##', '.#.#.', '..#..'],
    crystal: ['#.#.#', '.###.', '#####', '.###.', '#.#.#'],
    ball: ['.###.', '#w###', '#####', '####b', '.bbb.'],
    flake7: ['b..#..b', '.b.#.b.', '..###..', '###w###', '..###..', '.b.#.b.', 'b..#..b'],
    flake9: ['....#....', '.#..#..#.', '..#.#.#..', '...b#b...', '####w####', '...b#b...', '..#.#.#..', '.#..#..#.', '....#....'],
    flake11: ['.....#.....', '.#...#...#.', '..#..#..#..', '...#.#.#...', '....b#b....', '#####w#####', '....b#b....', '...#.#.#...', '..#..#..#..', '.#...#...#.', '.....#.....'],
    big: ['...bb...', '..b##b..', '.b####b.', 'b#w####b', 'b######b', '.b####b.', '..b##b..', '...bb...']
  };
  // four depth layers, far to near: share of the flakes, sprites, colours (main, shade, highlight), alpha, speed (canvas px a second) and sway (canvas px).
  // The small ones are many and slow, the big ones few and quick, so the nearest flakes drift past large and soft.
  var LAYERS = [
    { share: 0.38, spr: ['dot', 'blob', 'plus'], col: ['#6f86c4', '#8aa0d8'], sh: '#4c63a0', hi: '#a9bdf0', a: 0.7, v: 5, sway: 0.8 },
    { share: 0.30, spr: ['plus', 'cross', 'blob', 'star'], col: ['#b8d0f4', '#dfeaff'], sh: '#8aa6dc', hi: '#ffffff', a: 0.9, v: 9, sway: 1.4 },
    { share: 0.20, spr: ['star', 'crystal', 'ball', 'flake7'], col: ['#ffffff', '#f2f8ff'], sh: '#aac4f0', hi: '#ffffff', a: 1, v: 15, sway: 2.2 },
    { share: 0.12, spr: ['flake9', 'flake11', 'big', 'flake7'], col: ['#ffffff', '#eef5ff'], sh: '#9fbbea', hi: '#ffffff', a: 1, v: 21, sway: 3 }
  ];
  // snowdrifts, back to front: body, top edge, shaded underside, height share and noise frequencies
  var DRIFTS = [
    { body: '#5c74b8', top: '#7d93d0', shade: null, h: 3.2, f: [0.011, 0.027], seed: 1.3 },
    { body: '#a9c2ee', top: '#d3e2fb', shade: '#8aa6dc', h: 2.2, f: [0.017, 0.041], seed: 4.1 },
    { body: '#eef5ff', top: '#ffffff', shade: '#c4d6f5', h: 1.4, f: [0.023, 0.057], seed: 7.7 }
  ];

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(l) { return l[(Math.random() * l.length) | 0]; }
  function mk(cls, w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; c.className = cls; return c; }

  /**
   * box: the overlay element (a div). bottomClear(): screen pixels free under the last row of the guide, so the drifts can
   * be kept off it. Returns { start, stop, touch }.
   *
   * Nothing is redrawn while it runs: each depth layer is painted once onto a tall canvas (two screens high, the flakes
   * repeated in both halves) and the browser slides it down on the graphics chip, round and round, with a slow side to side
   * sway on top. That keeps the movement smooth at the screen's own frame rate and costs the TV almost no work.
   */
  function snow(box, bottomClear, note) {
    var anims = [], resumeT = 0, running = false, noteT = 0, ploughBox = null;

    function paintLayer(L, W, H) {
      var c = mk('sn-flakes', W, H * 2), x = c.getContext('2d'), n = Math.round(CFG.FLAKES * L.share);
      x.imageSmoothingEnabled = false; x.globalAlpha = L.a;
      for (var i = 0; i < n; i++) {
        var s = SPR[pick(L.spr)], fx = Math.round(rnd(4, W - 14)), fy = Math.round(rnd(0, H - s.length - 1));   // whole flakes only: none straddles the loop's seam
        var main = pick(L.col);
        for (var h = 0; h < 2; h++)                                  // the same flake again one screen lower, so the loop has no seam
          for (var r = 0; r < s.length; r++) for (var q = 0; q < s[r].length; q++) {
            var ch = s[r].charAt(q);
            if (ch === '.') continue;
            x.fillStyle = ch === 'b' ? L.sh : ch === 'w' ? L.hi : main;
            x.fillRect(fx + q, fy + r + h * H, 1, 1);
          }
      }
      return c;
    }

    function paintDrifts(W, H) {
      var c = mk('sn-drift', W, H), x = c.getContext('2d'), px = CFG.PIXEL, k = Math.max(0, Math.min(10, CFG.DRIFT)) / 10 * 2;
      var clear = bottomClear ? Math.max(0, bottomClear()) : 40, cap = Math.max(6, Math.round((clear - 4) / px)), tops = [], tall = 1;
      DRIFTS.forEach(function (D) {
        var base = D.h * 5 * k, prev = -1;
        for (var i = 0; i < W; i++) {
          var h = base + base * 0.35 * Math.sin(i * D.f[0] + D.seed) + base * 0.18 * Math.sin(i * D.f[1] + D.seed * 2);
          h = Math.max(1, Math.min(cap, Math.round(h)));
          if (h > tall) tall = h;
          x.fillStyle = D.body; x.fillRect(i, H - h, 1, h);
          x.fillStyle = D.top; x.fillRect(i, H - h, 1, 1);
          if (D.shade && prev > h) { x.fillStyle = D.shade; x.fillRect(i, H - h + 1, 1, Math.min(2, prev - h)); }
          if (D.shade && h > 3 && Math.random() < 0.012) tops.push([i, H - h - 1]);
          prev = h;
        }
      });
      var sp = mk('sn-sparkle', W, H), sx = sp.getContext('2d');
      sx.fillStyle = '#ffffff';
      tops.forEach(function (t) { sx.fillRect(t[0], t[1], 1, 1); });
      return [c, sp, tall * px];   // and how tall the tallest drift is, in screen pixels: the build-up rises to exactly this
    }

    // Santa on a snow plough, facing right, 34 x 26 canvas pixels: [x, y, w, h, colour]. Its blade is the front edge (x = 33).
    var PLOUGH = [
      [16,0,3,3,'#fff'], [14,1,3,3,'#d8232a'], [9,3,7,3,'#d8232a'], [8,6,9,2,'#fff'], [9,8,7,3,'#f2c6a0'], [10,9,1,1,'#222'], [13,9,1,1,'#222'],
      [8,11,9,3,'#fff'], [7,13,11,4,'#d8232a'], [16,14,5,2,'#d8232a'], [21,14,2,2,'#222'],
      [0,11,6,6,'#8a5a2b'], [2,11,1,6,'#d8232a'], [0,13,6,1,'#d8232a'],
      [5,12,2,5,'#14532a'], [2,17,26,5,'#1f7a3a'], [2,17,26,1,'#ffc83d'], [19,13,2,2,'#ffc83d'], [20,15,1,2,'#666'],
      [1,22,28,4,'#1c1c24'], [3,23,2,2,'#777'], [9,23,2,2,'#777'], [15,23,2,2,'#777'], [21,23,2,2,'#777'], [26,23,2,2,'#777'],
      [27,19,4,2,'#888'], [30,13,3,13,'#c8d2e0'], [32,13,1,13,'#8fa0b8'], [30,12,3,1,'#fff'],
      [30,16,3,1,'#ffc83d'], [30,20,3,1,'#ffc83d'], [30,24,2,1,'#ffc83d'], [33,12,1,1,'#fff'], [32,10,1,1,'#fff'], [33,8,1,1,'#fff']
    ];
    var PLOUGH_W = 34, PLOUGH_H = 26, PLOUGH_FRONT = 33;
    function paintPlough() {
      var c = mk('sn-plough', PLOUGH_W, PLOUGH_H), x = c.getContext('2d');
      PLOUGH.forEach(function (r) { x.fillStyle = r[4]; x.fillRect(r[0], r[1], r[2], r[3]); });
      return c;
    }

    function build() {
      var px = CFG.PIXEL, sw = window.innerWidth || 1920, sh = window.innerHeight || 1080, W = Math.ceil(sw / px), H = Math.ceil(sh / px);
      box.textContent = ''; anims = [];
      var sheets = [];
      LAYERS.forEach(function (L) { sheets.push([L, 1, 1]); });      // one sheet a depth: fewer full-screen layers for the TV to blend each frame
      sheets.forEach(function (sh) {
        var L = sh[0], vf = sh[1], dir = sh[2], wrap = document.createElement('div'), c = paintLayer(L, W, H);
        wrap.className = 'sn-wrap'; c.style.height = (H * 2 * px) + 'px'; wrap.appendChild(c); box.appendChild(wrap);
        var amp = L.sway * px * 2.2;                                    // side to side, slow, a different pace for each depth
        anims.push(wrap.animate([{ transform: 'translateX(' + (-amp) + 'px)' }, { transform: 'translateX(' + amp + 'px)' }],
          { duration: 5200 / (L.v / 5) * 1.6 * (dir > 0 ? 1 : 1.3), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }));
        anims.push(c.animate([{ transform: 'translateY(' + (-H * px) + 'px)' }, { transform: 'translateY(0)' }],      // downwards: the sheet is two screens tall and slides from its lower half to its upper
          { duration: H / (L.v * vf) * 1000, iterations: Infinity, easing: 'linear' }));
      });
      var d = paintDrifts(W, H);
      d[0].style.opacity = '0.85';
      // the plough's cut is two nested layers sliding opposite ways (a transform, which the TV moves without redrawing), not an animated
      // clip-path, which is redrawn every frame on the main thread and fell out of step with the plough. The outer layer hides everything
      // left of the blade; the inner one slides back by the same amount so the drifts themselves stay where they are.
      var cut = document.createElement('div'), un = document.createElement('div');
      cut.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;will-change:transform';
      un.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;will-change:transform';
      var rs = document.createElement('div');
      rs.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;will-change:transform';
      rs.appendChild(d[0]); rs.appendChild(d[1]); un.appendChild(rs); cut.appendChild(un); box.appendChild(cut);
      anims.push(d[1].animate([{ opacity: 0.1 }, { opacity: 1 }, { opacity: 0.1 }], { duration: 2400, iterations: Infinity, easing: 'steps(4)' }));
      // The drifts are painted once at full height and slid up from below the screen: a transform, so the TV does no drawing.
      // They rise in whole canvas pixels (steps) for the 16-bit look. At the end of the cycle Santa's snow plough drives in from the
      // left; the drifts are cut away exactly at its blade (a clip-path moving with it), so the snow behind it is gone.
      var cyc = Math.max(20000, CFG.CYCLE_MS), run = Math.min(CFG.PLOUGH_MS, cyc / 4), grow = 1 - run / cyc,
          startY = Math.round(d[2] * (1 - Math.max(0, Math.min(1, CFG.START)))),
          pp = px * 0.75,    // three quarters of the flakes' pixel size (3 device pixels on a 2x screen): big enough to be Santa, small enough to sit mostly in the strip under the guide
          pw = PLOUGH_W * pp, front = PLOUGH_FRONT * pp, endX = sw + front, opt = { duration: cyc, iterations: Infinity, delay: -((Date.now() - T0) % cyc) };
      var rise = [
        { offset: 0,    transform: 'translateY(' + startY + 'px)', easing: 'steps(' + Math.max(1, Math.round(startY / px)) + ')' },
        { offset: grow, transform: 'translateY(0)' },
        { offset: 1,    transform: 'translateY(0)' }
      ];
      anims.push(rs.animate(rise, opt));
      anims.push(cut.animate([{ offset: 0, transform: 'translateX(0)' }, { offset: grow, transform: 'translateX(0)' }, { offset: 1, transform: 'translateX(' + endX + 'px)' }], opt));
      anims.push(un.animate([{ offset: 0, transform: 'translateX(0)' }, { offset: grow, transform: 'translateX(0)' }, { offset: 1, transform: 'translateX(' + (-endX) + 'px)' }], opt));
      // say in the debug log when the plough is due and when it sets off, so a crossing can be checked afterwards
      clearTimeout(noteT);
      var due = ((grow * cyc - ((Date.now() - T0) % cyc)) % cyc + cyc) % cyc;
      if (note) {
        note('SNOW: Santa\'s plough is due in ' + Math.round(due / 1000) + ' s (cycle ' + Math.round(cyc / 1000) + ' s)');
        noteT = setTimeout(function again() { if (!running) return; note('SNOW: Santa\'s plough sets off'); noteT = setTimeout(again, cyc); }, due);
      }
      {
        var pl = paintPlough();
        pl.style.cssText = 'position:absolute;left:0;image-rendering:pixelated;will-change:transform;top:auto;bottom:0;width:' + pw + 'px;height:' + (PLOUGH_H * pp) + 'px';
        // above the guide's rows (the snow itself is behind them): its own layer in the guide, taken away again when the snow stops
        if (ploughBox && ploughBox.parentNode) ploughBox.parentNode.removeChild(ploughBox);
        ploughBox = document.createElement('div');
        ploughBox.style.cssText = 'position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden';
        ploughBox.appendChild(pl);
        (box.parentNode || box).appendChild(ploughBox);
        anims.push(pl.animate([                                                    // waits off the left edge, then crosses at the same speed as the cut
          { offset: 0,    transform: 'translateX(' + (-pw) + 'px)' },
          { offset: grow, transform: 'translateX(' + (-pw) + 'px)' },
          { offset: 1,    transform: 'translateX(' + sw + 'px)' }
        ], opt));
      }
    }

    function setPlay(on) { anims.forEach(function (a) { try { if (on) a.play(); else a.pause(); } catch (e) { /* ignore */ } }); }

    return {
      start: function () { if (running) return; running = true; build(); box.className = ''; },
      // a menu is over the guide: hold the snow still, carry on when it closes
      hold: function (on) { if (running) setPlay(!on); },
      on: function () { return running; },
      /** Milliseconds until the plough sets off, and how long it drives: so its crossing can be measured. */
      plough: function () { var cyc = Math.max(20000, CFG.CYCLE_MS), run = Math.min(CFG.PLOUGH_MS, cyc / 4), grow = 1 - run / cyc; return { due: ((grow * cyc - ((Date.now() - T0) % cyc)) % cyc + cyc) % cyc, run: run }; },
      stop: function () { running = false; clearTimeout(resumeT); clearTimeout(noteT); setPlay(false); box.className = 'hidden'; box.textContent = ''; anims = []; if (ploughBox && ploughBox.parentNode) ploughBox.parentNode.removeChild(ploughBox); ploughBox = null; },
      // the guide is being scrolled: hold the snow still until it has settled
      touch: function () { if (!running) return; setPlay(false); clearTimeout(resumeT); resumeT = setTimeout(function () { if (running) setPlay(true); }, CFG.PAUSE_MS); }
    };
  }


  // A little hat for the guide clock, drawn from a sprite and handed to the stylesheet as a picture (#gclock::before in
  // index.html shows it while body has the class "season-hat"). R red, r shaded red, W white fur, w shaded fur.
  var HATS = {
    santa: ['..........WW..', '.........WWWW.', '........RRWWW.', '.......RRRRR..', '......RRRRRrr.', '.....RRRRRRrr.',
            '....RRRRRRRrr.', '...RRRRRRRrr..', '.WWWWWWWWWWWW.', 'WWWWWWWWWWWWWw', 'WWWWWWWWWWWwww'],
    pal: { R: '#d8232a', r: '#8f1118', W: '#ffffff', w: '#c9d6f2' }
  };
  var hatURL = {};
  /** Show (or, with null, hide) the hat that belongs to a season. */
  function hat(season) {
    var kind = season && season.hat, b = document.body;
    if (!kind || !HATS[kind]) { b.classList.remove('season-hat'); return; }
    if (!hatURL[kind]) {
      var rows = HATS[kind], c = document.createElement('canvas'), x = c.getContext('2d');
      c.width = rows[0].length; c.height = rows.length;
      rows.forEach(function (row, y) { for (var i = 0; i < row.length; i++) { var ch = row.charAt(i); if (ch !== '.') { x.fillStyle = HATS.pal[ch]; x.fillRect(i, y, 1, 1); } } });
      hatURL[kind] = c.toDataURL();
    }
    document.documentElement.style.setProperty('--hat', 'url(' + hatURL[kind] + ')');
    b.classList.add('season-hat');
  }

  window.SEASONS = { list: SEASONS, cfg: CFG, current: current, snow: snow, hat: hat };
})();
