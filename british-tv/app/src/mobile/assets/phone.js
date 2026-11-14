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

  // gestures on the rest of the screen: swipe = arrow, tap = OK, long press = Info (hold OK)
  var t0 = null, longT = 0, fired = false, tapOwn = false;
  function inRemote(e) { return e.target && e.target.closest && e.target.closest('#pr, #pr-btn, #kbd, input, textarea'); }
  document.addEventListener('touchstart', function (e) {
    if (inRemote(e) || e.touches.length !== 1) { t0 = null; return; }
    tapOwn = !!(e.target.closest && e.target.closest('[data-tap]'));
    var t = e.touches[0]; t0 = { x: t.clientX, y: t.clientY, at: Date.now() }; fired = false;
    clearTimeout(longT);
    longT = setTimeout(function () { if (t0) { fired = true; key('Info'); } }, 650);
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!t0 || fired) return;
    var t = e.touches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y;
    if (Math.abs(dx) > 14 || Math.abs(dy) > 14) clearTimeout(longT);
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    clearTimeout(longT);
    if (!t0 || fired) { t0 = null; return; }
    var t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y, ax = Math.abs(dx), ay = Math.abs(dy), min = window.innerHeight * 0.07;
    t0 = null;
    if (ax < min && ay < min) { if (tapOwn) return; if (pad.classList.contains('on')) { pad.classList.remove('on'); btn.classList.remove('on'); } else key('Enter'); return; }
    if (ax > ay) key(dx > 0 ? 'ArrowLeft' : 'ArrowRight');        // dragging the content: it follows the finger
    else key(dy > 0 ? 'ArrowUp' : 'ArrowDown');
  }, { passive: true });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
})();
