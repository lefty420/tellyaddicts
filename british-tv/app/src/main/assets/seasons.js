/* Seasonal effects: a decorative pixel-art overlay drawn over the TV guide (first season: Christmas snow).
 * One transparent canvas, never focusable, no input handling. It is drawn small and scaled up with no smoothing
 * for the 16-bit look. Other seasons (Halloween, New Year) can be added to SEASONS and drawn by their own painter. */
(function () {
  'use strict';

  // When each season runs: [month, day] from and to, inclusive. Months count from 0 (0 = January, 10 = November).
  // A season whose end is earlier in the year than its start runs over the new year.
  var SEASONS = [
    { id: 'xmas', label: 'Christmas snow', from: [10, 1], to: [0, 6] }
  ];

  // How it looks. PIXEL = screen pixels per canvas pixel (2 = 16-bit, 3 = chunkier). DRIFT is 0 to 10.
  var CFG = { PIXEL: 2, FLAKES: 55, DRIFT: 5, FPS: 15, PAUSE_MS: 180 };

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

  // Snow sprites ('#' = a filled pixel)
  var SPR = {
    dot: ['#'], blob: ['##', '##'],
    plus: ['.#.', '###', '.#.'],
    star: ['..#..', '.#.#.', '##.##', '.#.#.', '..#..'],
    crystal: ['#.#.#', '.###.', '#####', '.###.', '#.#.#']
  };
  // three depth layers: share of the flakes, sprites, colours, alpha, speed (canvas px a second) and sway (canvas px)
  var LAYERS = [
    { share: 0.45, spr: ['dot', 'blob'], col: ['#6f86c4', '#8aa0d8'], a: 0.7, v: 5, sway: 0.8 },
    { share: 0.35, spr: ['dot', 'blob', 'plus'], col: ['#b8d0f4', '#dfeaff'], a: 0.9, v: 9, sway: 1.4 },
    { share: 0.20, spr: ['plus', 'star', 'crystal'], col: ['#ffffff', '#f2f8ff'], a: 1, v: 15, sway: 2.2 }
  ];
  // snowdrifts, back to front: body, top edge, shaded underside, height share and noise frequencies
  var DRIFTS = [
    { body: '#5c74b8', top: '#7d93d0', shade: null, h: 3.2, f: [0.011, 0.027], seed: 1.3 },
    { body: '#a9c2ee', top: '#d3e2fb', shade: '#8aa6dc', h: 2.2, f: [0.017, 0.041], seed: 4.1 },
    { body: '#eef5ff', top: '#ffffff', shade: '#c4d6f5', h: 1.4, f: [0.023, 0.057], seed: 7.7 }
  ];

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(l) { return l[(Math.random() * l.length) | 0]; }

  /**
   * canvas: the overlay canvas. bottomClear(): screen pixels free under the last row of the guide, so the drifts can be
   * kept off it. Returns { start, stop, touch }.
   */
  function snow(canvas, bottomClear) {
    var ctx = canvas.getContext('2d'), W = 0, H = 0, flakes = [], drift = null, sparkles = [], timer = 0, last = 0, touched = 0;

    function layout() {
      var px = CFG.PIXEL;
      W = Math.ceil((window.innerWidth || 1920) / px); H = Math.ceil((window.innerHeight || 1080) / px);
      canvas.width = W; canvas.height = H;
      ctx.imageSmoothingEnabled = false;
      flakes = [];
      LAYERS.forEach(function (L, li) {
        var n = Math.round(CFG.FLAKES * L.share);
        for (var i = 0; i < n; i++) {
          var s = SPR[pick(L.spr)];
          flakes.push({ L: L, s: s, c: pick(L.col), x: rnd(0, W), y: rnd(-8, H), v: L.v * rnd(0.7, 1.3), ph: rnd(0, 6.28), sp: rnd(0.4, 1.1) });
        }
      });
      drift = makeDrifts();
    }

    /** The drifts are the same every frame, so they are painted once into their own canvas. */
    function makeDrifts() {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d'), px = CFG.PIXEL, k = Math.max(0, Math.min(10, CFG.DRIFT)) / 10 * 2;
      var clear = bottomClear ? Math.max(0, bottomClear()) : 40;
      var cap = Math.max(8, Math.round((clear + 14) / px));     // keep off the last programme row
      sparkles = [];
      DRIFTS.forEach(function (D, di) {
        var base = D.h * 5 * k, prev = -1;
        for (var i = 0; i < W; i++) {
          var h = base + base * 0.35 * Math.sin(i * D.f[0] + D.seed) + base * 0.18 * Math.sin(i * D.f[1] + D.seed * 2);
          h = Math.max(1, Math.min(cap, Math.round(h)));
          x.fillStyle = D.body; x.fillRect(i, H - h, 1, h);
          x.fillStyle = D.top; x.fillRect(i, H - h, 1, 1);
          if (D.shade && prev > h) { x.fillStyle = D.shade; x.fillRect(i, H - h + 1, 1, Math.min(2, prev - h)); }
          if (D.shade && h > 3 && Math.random() < 0.012) sparkles.push({ x: i, y: H - h - 1, ph: rnd(0, 6.28) });
          prev = h;
        }
      });
      return c;
    }

    function sprite(f, t) {
      var s = f.s, sw = Math.round(Math.sin(t * f.sp + f.ph) * f.L.sway), x0 = Math.round(f.x) + sw, y0 = Math.round(f.y);
      ctx.fillStyle = f.c;
      for (var r = 0; r < s.length; r++) for (var q = 0; q < s[r].length; q++) if (s[r].charAt(q) === '#') ctx.fillRect(x0 + q, y0 + r, 1, 1);
    }

    function frame() {
      var now = Date.now();
      if (now - last < 1000 / CFG.FPS - 4) return;
      if (now - touched < CFG.PAUSE_MS) return;            // the guide is being scrolled: leave it alone
      var dt = Math.min(0.2, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      var t = now / 1000;
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.v * dt;
        if (f.y > H) { f.y = -6; f.x = rnd(0, W); }
        ctx.globalAlpha = f.L.a; sprite(f, t);
      }
      ctx.globalAlpha = 0.85; ctx.drawImage(drift, 0, 0);
      ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff';
      for (var j = 0; j < sparkles.length; j++) if (Math.sin(t * 2 + sparkles[j].ph) > 0.8) ctx.fillRect(sparkles[j].x, sparkles[j].y, 1, 1);
    }

    return {
      start: function () { if (timer) return; layout(); canvas.className = ''; last = Date.now(); timer = setInterval(frame, 1000 / CFG.FPS); },
      stop: function () { clearInterval(timer); timer = 0; canvas.className = 'hidden'; if (W) ctx.clearRect(0, 0, W, H); },
      touch: function () { touched = Date.now(); }
    };
  }

  window.SEASONS = { list: SEASONS, cfg: CFG, current: current, snow: snow };
})();
