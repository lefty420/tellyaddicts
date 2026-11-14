/* A small QR code maker for the "Add from your phone" screen: byte mode, error correction L, versions 1-6 (up to 134
 * characters). Written for this app; no outside code. QR.make(text) -> array of rows of 0/1, or null if too long. */
(function () {
  'use strict';
  var EXP = [], LOG = [];
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function gen(n) { var g = [1]; for (var i = 0; i < n; i++) { var h = new Array(g.length + 1).fill(0); for (var j = 0; j < g.length; j++) { h[j] ^= g[j]; h[j + 1] ^= mul(g[j], EXP[i]); } g = h; } return g; }
  function rs(data, n) { var g = gen(n), r = new Array(n).fill(0); data.forEach(function (d) { var f = d ^ r[0]; r.shift(); r.push(0); for (var i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f); }); return r; }
  // version -> [data codewords per block, ec codewords per block, blocks]; alignment pattern centres
  var VER = [null, [19, 7, 1], [34, 10, 1], [55, 15, 1], [80, 20, 1], [108, 26, 1], [68, 18, 2]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];
  function bch(v, poly, bits) { var d = v << bits; var top = 0, p = poly; while ((p >> (top + 1)) > 0) top++; for (var i = 14; i >= top; i--) if ((d >> i) & 1) d ^= poly << (i - top); return (v << bits) | d; }
  function make(text) {
    var bytes = []; var u = unescape(encodeURIComponent(text)); for (var i = 0; i < u.length; i++) bytes.push(u.charCodeAt(i));
    var ver = 0; for (var v = 1; v <= 6; v++) { if (bytes.length <= VER[v][0] * VER[v][2] - 2) { ver = v; break; } }
    if (!ver) return null;
    var info = VER[ver], total = info[0] * info[2], bits = [];
    function put(val, n) { for (var k = n - 1; k >= 0; k--) bits.push((val >> k) & 1); }
    put(4, 4); put(bytes.length, 8); bytes.forEach(function (b) { put(b, 8); });
    for (i = 0; i < 4 && bits.length < total * 8; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var cw = []; for (i = 0; i < bits.length; i += 8) { var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k]; cw.push(b); }
    for (var pad = 0; cw.length < total; pad++) cw.push(pad % 2 ? 0x11 : 0xec);
    var blocks = [], ecs = [];
    for (i = 0; i < info[2]; i++) { var bl = cw.slice(i * info[0], (i + 1) * info[0]); blocks.push(bl); ecs.push(rs(bl, info[1])); }
    var out = [];
    for (i = 0; i < info[0]; i++) blocks.forEach(function (bl) { out.push(bl[i]); });
    for (i = 0; i < info[1]; i++) ecs.forEach(function (e) { out.push(e[i]); });
    var n = 17 + 4 * ver, m = [], fn = [];
    for (i = 0; i < n; i++) { m.push(new Array(n).fill(0)); fn.push(new Array(n).fill(0)); }
    function set(r, c, val) { if (r >= 0 && r < n && c >= 0 && c < n) { m[r][c] = val; fn[r][c] = 1; } }
    function finder(r, c) { for (var y = -1; y <= 7; y++) for (var x = -1; x <= 7; x++) { var d = (y >= 0 && y <= 6 && (x === 0 || x === 6)) || (x >= 0 && x <= 6 && (y === 0 || y === 6)) || (y >= 2 && y <= 4 && x >= 2 && x <= 4); set(r + y, c + x, d ? 1 : 0); } }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
    for (i = 8; i < n - 8; i++) { set(6, i, i % 2 ? 0 : 1); set(i, 6, i % 2 ? 0 : 1); }
    var al = ALIGN[ver];
    al.forEach(function (r) { al.forEach(function (c) {
      if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (c === 6 && r === al[al.length - 1])) return;
      for (var y = -2; y <= 2; y++) for (var x = -2; x <= 2; x++) set(r + y, c + x, Math.max(Math.abs(x), Math.abs(y)) !== 1 ? 1 : 0);
    }); });
    set(n - 8, 8, 1);
    for (i = 0; i < 9; i++) { if (!fn[8][i]) set(8, i, 0); if (!fn[i][8]) set(i, 8, 0); }
    for (i = 0; i < 8; i++) { if (!fn[8][n - 1 - i]) set(8, n - 1 - i, 0); if (!fn[n - 1 - i][8]) set(n - 1 - i, 8, 0); }
    set(n - 8, 8, 1);
    var dbits = []; out.forEach(function (b) { for (var k = 7; k >= 0; k--) dbits.push((b >> k) & 1); });
    var MASKS = [function (r, c) { return (r + c) % 2 === 0; }, function (r) { return r % 2 === 0; }, function (r, c) { return c % 3 === 0; }, function (r, c) { return (r + c) % 3 === 0; },
      function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; }, function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
      function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; }, function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }];
    function build(mask) {
      var q = m.map(function (row) { return row.slice(); }), bi = 0, up = true;
      for (var c = n - 1; c > 0; c -= 2) {
        if (c === 6) c--;
        for (var t = 0; t < n; t++) {
          var r = up ? n - 1 - t : t;
          for (var dx = 0; dx < 2; dx++) { var cc = c - dx; if (fn[r][cc]) continue; var bit = bi < dbits.length ? dbits[bi++] : 0; if (MASKS[mask](r, cc)) bit ^= 1; q[r][cc] = bit; }
        }
        up = !up;
      }
      var f = bch((1 << 3) | mask, 0x537, 10) ^ 0x5412;          // error correction L = 01
      for (var k = 0; k < 15; k++) {
        var bit2 = (f >> k) & 1;
        if (k < 6) q[k][8] = bit2; else if (k < 8) q[k + 1][8] = bit2; else q[n - 15 + k][8] = bit2;
        if (k < 8) q[8][n - 1 - k] = bit2; else if (k === 8) q[8][7] = bit2; else q[8][14 - k] = bit2;
      }
      return q;
    }
    function penalty(q) {
      var p = 0, r, c, k;
      for (var pass = 0; pass < 2; pass++) for (r = 0; r < n; r++) {
        var run = 1;
        for (c = 1; c < n; c++) { var a = pass ? q[c][r] : q[r][c], b = pass ? q[c - 1][r] : q[r][c - 1]; if (a === b) run++; else { if (run >= 5) p += run - 2; run = 1; } }
        if (run >= 5) p += run - 2;
      }
      for (r = 0; r < n - 1; r++) for (c = 0; c < n - 1; c++) if (q[r][c] === q[r][c + 1] && q[r][c] === q[r + 1][c] && q[r][c] === q[r + 1][c + 1]) p += 3;
      var pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = pat.slice().reverse();
      for (r = 0; r < n; r++) for (c = 0; c <= n - 11; c++) {
        var h1 = true, h2 = true, v1 = true, v2 = true;
        for (k = 0; k < 11; k++) { if (q[r][c + k] !== pat[k]) h1 = false; if (q[r][c + k] !== pat2[k]) h2 = false; if (q[c + k][r] !== pat[k]) v1 = false; if (q[c + k][r] !== pat2[k]) v2 = false; }
        if (h1) p += 40; if (h2) p += 40; if (v1) p += 40; if (v2) p += 40;
      }
      var dark = 0; for (r = 0; r < n; r++) for (c = 0; c < n; c++) dark += q[r][c];
      p += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;
      return p;
    }
    var best = null, bp = 1e9;
    for (var mk = 0; mk < 8; mk++) { var q = build(mk), pn = penalty(q); if (pn < bp) { bp = pn; best = q; } }
    return best;
  }
  window.QR = { make: make };
})();
