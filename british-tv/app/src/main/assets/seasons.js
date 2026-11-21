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
  var CFG = { PIXEL: 2, FLAKES: 64, DRIFT: 5, PAUSE_MS: 180 };

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
  function snow(box, bottomClear) {
    var anims = [], resumeT = 0, running = false;

    function paintLayer(L, W, H) {
      var c = mk('sn-flakes', W, H * 2), x = c.getContext('2d'), n = Math.round(CFG.FLAKES * L.share / 2);   // half of the layer's flakes: each layer is two sheets at different speeds
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
      var clear = bottomClear ? Math.max(0, bottomClear()) : 40, cap = Math.max(6, Math.round((clear - 4) / px)), tops = [];
      DRIFTS.forEach(function (D) {
        var base = D.h * 5 * k, prev = -1;
        for (var i = 0; i < W; i++) {
          var h = base + base * 0.35 * Math.sin(i * D.f[0] + D.seed) + base * 0.18 * Math.sin(i * D.f[1] + D.seed * 2);
          h = Math.max(1, Math.min(cap, Math.round(h)));
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
      return [c, sp];
    }

    function build() {
      var px = CFG.PIXEL, sw = window.innerWidth || 1920, sh = window.innerHeight || 1080, W = Math.ceil(sw / px), H = Math.ceil(sh / px);
      box.textContent = ''; anims = [];
      var sheets = [];
      LAYERS.forEach(function (L) { sheets.push([L, 0.8, 1], [L, 1.25, -1]); });
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
      d[0].style.opacity = '0.85'; box.appendChild(d[0]); box.appendChild(d[1]);
      anims.push(d[1].animate([{ opacity: 0.1 }, { opacity: 1 }, { opacity: 0.1 }], { duration: 2400, iterations: Infinity, easing: 'steps(4)' }));
    }

    function setPlay(on) { anims.forEach(function (a) { try { if (on) a.play(); else a.pause(); } catch (e) { /* ignore */ } }); }

    return {
      start: function () { if (running) return; running = true; build(); box.className = ''; },
      stop: function () { running = false; clearTimeout(resumeT); setPlay(false); box.className = 'hidden'; box.textContent = ''; anims = []; },
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
