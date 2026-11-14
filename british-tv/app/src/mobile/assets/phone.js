/* Telly Addicts Mobile: touch controls. The app is driven by remote-control keys on every screen, so the phone sends the
   same keys: an on-screen remote (the little remote button, bottom right), swipes, a tap for OK and a long press for Info
   (the hold-OK menu). Only the mobile build contains this file. */
(function () {
  'use strict';
  var touchy = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || /[?&]phone=1/.test(location.search);
  if (!touchy) return;
  window.PHONE = true;
  document.documentElement.className += ' phone';

  function key(k) {
    try { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })); } catch (e) { /* ignore */ }
  }

  var css = document.createElement('style');
  css.textContent =
    '#pr-btn{position:fixed;right:2vh;bottom:2vh;z-index:90;width:9vh;height:9vh;border-radius:50%;border:.3vh solid rgba(255,255,255,.6);' +
    'background:rgba(10,20,70,.72);color:#fff;font:700 3.6vh/1 sans-serif;display:flex;align-items:center;justify-content:center;opacity:.55;touch-action:manipulation}' +
    '#pr-btn.on{opacity:1;background:#ffb800;color:#0a1a55}' +
    '#pr{position:fixed;right:2vh;bottom:12vh;z-index:90;width:46vh;padding:1.6vh;border-radius:2.4vh;background:rgba(8,16,60,.9);' +
    'border:.2vh solid rgba(255,255,255,.35);display:none;touch-action:manipulation;user-select:none;-webkit-user-select:none}' +
    '#pr.on{display:block}' +
    '#pr .row{display:flex;gap:1vh;margin-bottom:1vh}#pr .row:last-child{margin-bottom:0}' +
    '#pr button{flex:1;height:8vh;border:0;border-radius:1.4vh;background:rgba(255,255,255,.16);color:#fff;font:700 3vh/1 sans-serif;touch-action:manipulation}' +
    '#pr button:active{background:#ffb800;color:#0a1a55}' +
    '#pr button.ok{background:#ffb800;color:#0a1a55}#pr button.sm{font-size:2.3vh}' +
    '#pr .r{background:#c62828}#pr .g{background:#2e7d32}#pr .y{background:#f9a825;color:#222}#pr .b{background:#1565c0}';
  document.head.appendChild(css);

  var btn = document.createElement('div'); btn.id = 'pr-btn'; btn.textContent = '☰';
  var pad = document.createElement('div'); pad.id = 'pr';
  function addRow(items) {
    var row = document.createElement('div'); row.className = 'row';
    items.forEach(function (it) {
      var b = document.createElement('button'); b.textContent = it[0]; if (it[2]) b.className = it[2];
      b.addEventListener('click', function (e) { e.stopPropagation(); key(it[1]); });
      row.appendChild(b);
    });
    pad.appendChild(row);
  }
  addRow([['Back', 'GoBack', 'sm'], ['▲', 'ArrowUp'], ['Guide', 'Guide', 'sm']]);
  addRow([['◀', 'ArrowLeft'], ['OK', 'Enter', 'ok'], ['▶', 'ArrowRight']]);
  addRow([['Info', 'Info', 'sm'], ['▼', 'ArrowDown'], ['Play', 'MediaPlayPause', 'sm']]);
  addRow([['Ch +', 'ChannelUp', 'sm'], ['Ch −', 'ChannelDown', 'sm'], ['⏪', 'MediaRewind'], ['⏩', 'MediaFastForward']]);
  addRow([['', 'Red', 'r'], ['', 'Green', 'g'], ['Search', 'Yellow', 'y sm'], ['', 'Blue', 'b']]);
  btn.addEventListener('click', function (e) { e.stopPropagation(); var on = !pad.classList.contains('on'); pad.classList.toggle('on', on); btn.classList.toggle('on', on); });
  document.body.appendChild(pad); document.body.appendChild(btn);

  // ---- gestures on the rest of the screen
  // drag = scroll (the content follows the finger: a row's worth of drag moves one step), tap = OK on what was touched,
  // long press = the hold-OK menu for what was touched
  function shown(id) { var e = document.getElementById(id); return !!e && !/\bhidden\b/.test(e.className); }
  function overlay() { return shown('gmenu') || shown('odmenu') || shown('opts') || shown('rel') || shown('info') || shown('kbd') || shown('od') || shown('quit'); }
  function nth(list, el) { return Array.prototype.indexOf.call(list, el); }
  function press(k, n) { for (var i = 0; i < n; i++) key(k); }

  /** A tap on a menu row, an Options row, a category or a choice: move to it, then press OK. Returns true if it was one. */
  function listTap(e) {
    var t = e.target.closest && e.target.closest('.gmr, .odmr, .ochip, .orow, .ocat, #qbtns button');
    if (!t) {
      var bd = e.target.id;
      if (bd === 'gmenu' || bd === 'odmenu' || bd === 'quit') { key('GoBack'); return true; }
      return false;
    }
    function sibs(el, cls) { return Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains(cls); }); }
    function goto(el, cls) {
      var list = sibs(el, cls), from = -1;
      list.forEach(function (c, i) { if (c.classList.contains('sel')) from = i; });
      var to = list.indexOf(el);
      if (from < 0) { from = 0; }
      if (to > from) press('ArrowDown', to - from); else if (to < from) press('ArrowUp', from - to);
    }
    if (t.matches('.gmr')) { goto(t, 'gmr'); key('Enter'); return true; }
    if (t.matches('.odmr')) { goto(t, 'odmr'); key('Enter'); return true; }
    if (t.matches('#qbtns button')) {
      var bs = Array.prototype.slice.call(t.parentNode.children), at = 0;
      bs.forEach(function (c, i) { if (c.classList.contains('sel')) at = i; });
      var to = bs.indexOf(t); if (to > at) press('ArrowRight', to - at); else if (to < at) press('ArrowLeft', at - to);
      key('Enter'); return true;
    }
    var inZone = !!document.querySelector('#opane .orow.sel');
    if (t.matches('.ocat')) {
      if (inZone) key('GoBack');
      var cats = Array.prototype.slice.call(document.querySelectorAll('#orail .ocat')), from = 0;
      cats.forEach(function (c, i) { if (c.classList.contains('sel')) from = i; });
      var tc = cats.indexOf(t); if (tc > from) press('ArrowDown', tc - from); else if (tc < from) press('ArrowUp', from - tc);
      key('ArrowRight'); return true;
    }
    if (t.matches('.ochip')) {
      var chips = sibs(t, 'ochip'), on = 0; chips.forEach(function (c, i) { if (c.classList.contains('on')) on = i; });
      var tc2 = chips.indexOf(t); if (tc2 > on) press('ArrowRight', tc2 - on); else if (tc2 < on) press('ArrowLeft', on - tc2);
      return true;
    }
    // an Options row
    if (!inZone) key('ArrowRight');
    var rows = sibs(t, 'orow'), cur = 0; rows.forEach(function (c, i) { if (c.classList.contains('sel')) cur = i; });
    var tr = rows.indexOf(t), was = cur === tr;
    if (tr > cur) press('ArrowDown', tr - cur); else if (tr < cur) press('ArrowUp', cur - tr);
    if (was || t.classList.contains('act')) key('Enter');
    return true;
  }

  var t0 = null, longT = 0, fired = false, tapOwn = null, axis = '', accX = 0, accY = 0, lastX = 0, lastY = 0, moved = false;
  function inRemote(e) { return e.target && e.target.closest && e.target.closest('#pr, #pr-btn, input, textarea'); }
  document.addEventListener('touchstart', function (e) {
    if (inRemote(e) || e.touches.length !== 1) { t0 = null; return; }
    var t = e.touches[0]; t0 = { x: t.clientX, y: t.clientY }; lastX = t.clientX; lastY = t.clientY;
    fired = false; axis = ''; accX = 0; accY = 0; moved = false;
    tapOwn = e.target.closest ? e.target.closest('[data-tap]') : null;
    clearTimeout(longT);
    var target = e.target;
    longT = setTimeout(function () {
      if (!t0 || moved) return;
      fired = true;
      var own = target.closest && target.closest('[data-tap]');
      if (own) own.dispatchEvent(new CustomEvent('phoneselect'));
      else if (target.closest && target.closest('.gmr, .odmr, .orow')) return;
      key('Info');
    }, 600);
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!t0 || fired) return;
    var t = e.touches[0];
    if (!axis) {
      var dx = t.clientX - t0.x, dy = t.clientY - t0.y;
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      axis = Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x'; moved = true; clearTimeout(longT);
      lastX = t0.x; lastY = t0.y;
    }
    var H = window.innerHeight, W = window.innerWidth, inGuide = shown('guide') && !overlay();
    if (axis === 'y') {
      accY += t.clientY - lastY;
      var stepY = inGuide ? H * 0.15 : H * 0.12;
      while (accY <= -stepY) { key('ArrowDown'); accY += stepY; }           // finger up: the list moves up, so the next one comes
      while (accY >= stepY) { key('ArrowUp'); accY -= stepY; }
    } else {
      accX += t.clientX - lastX;
      var stepX = inGuide ? W * 0.16 : W * 0.14;
      while (accX <= -stepX) { key('ArrowRight'); accX += stepX; }
      while (accX >= stepX) { key('ArrowLeft'); accX -= stepX; }
    }
    lastX = t.clientX; lastY = t.clientY;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    clearTimeout(longT);
    var was = t0, hadMoved = moved, wasFired = fired;
    t0 = null;
    if (!was || wasFired || hadMoved) return;
    if (document.querySelector('#pr.on')) { pad.classList.remove('on'); btn.classList.remove('on'); return; }
    if (tapOwn) return;                                    // the guide handles its own taps
    if (listTap(e)) return;
    if (shown('info') || shown('rel')) { key('GoBack'); return; }
    if (!overlay() || (shown('od') && !shown('opts') && !shown('odmenu') && !shown('kbd'))) key('Enter');
  }, { passive: true });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // keep the highlighted row of a long menu in view
  var sc = 0;
  new MutationObserver(function () {
    if (sc) return;
    sc = requestAnimationFrame(function () {
      sc = 0;
      var el = document.querySelector('#gml .sel, #odml .sel');
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    });
  }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
})();
