/* The video element, with a second player behind it. Everything in app.js talks to `v`, which is this object: it behaves
 * like the page's <video> element, and for a file the web view cannot play (AC3/DTS sound, some MKVs) it hands the
 * file to the app's own player (Media3 + FFmpeg, see NativePlayer.java) and mirrors that player's state back, so the
 * rest of the page cannot tell the difference. Without the native side (a browser, an older app) it is the plain element. */
(function (root) {
  'use strict';
  function makeVideo(el) {
    var L = {};                                   // listeners that hear the native player's events
    var st = { native: false, src: '', pos: 0, ts: 0, dur: NaN, playing: false, paused: true, ready: 0, err: null,
               w: 0, h: 0, muted: false, buf: 0, gen: 0 };
    var shim = { el: el, wantNative: function () { return false; } };
    function hasNative() { try { return !!(root.NativeHttp && root.NativeHttp.npOpen); } catch (e) { return false; } }
    function call(fn) { var args = Array.prototype.slice.call(arguments, 1); try { root.NativeHttp[fn].apply(root.NativeHttp, args); } catch (e) { /* the native side is gone */ } }
    function fire(type) {
      var ev = { type: type, target: shim };
      (L[type] || []).slice().forEach(function (f) { try { f.call(shim, ev); } catch (e) { /* one listener must not stop the rest */ } });
    }
    function setNative(on) {
      st.native = on;
      if (root.document && root.document.body) {
        root.document.body.classList.toggle('np', on);
        root.document.documentElement.classList.toggle('np', on);
      }
    }
    function open(url, startSec) {
      st.gen++;
      st.src = url; st.pos = startSec || 0; st.ts = Date.now(); st.dur = NaN; st.playing = false; st.paused = false;
      st.ready = 0; st.err = null; st.w = 0; st.h = 0; st.buf = 0;
      setNative(true);
      call('npOpen', url, Math.round((startSec || 0) * 1000), st.gen);
      fire('loadstart');
    }
    function closeNative() {
      if (!st.native) return;
      call('npStop');
      st.gen++;
      setNative(false);
    }
    function def(name, get, set) { Object.defineProperty(shim, name, { get: get, set: set, enumerable: true }); }

    def('src', function () { return st.native ? st.src : el.src; }, function (u) {
      if (hasNative() && u && shim.wantNative(u)) {
        el.removeAttribute('src');
        try { el.load(); } catch (e) { /* nothing loaded */ }      // let go of the last programme, or its final frame stays on screen over the app's player
        open(u, 0);
      } else {
        closeNative();
        el.src = u;
      }
    });
    def('native', function () { return st.native; });
    def('currentSrc', function () { return st.native ? st.src : el.currentSrc; });
    def('currentTime', function () { return st.native ? st.pos + (st.playing ? (Date.now() - st.ts) / 1000 : 0) : el.currentTime; },
      function (t) {
        if (!st.native) { el.currentTime = t; return; }
        st.pos = t; st.ts = Date.now();
        call('npSeek', Math.round(t * 1000));
      });
    def('duration', function () { return st.native ? st.dur : el.duration; });
    def('paused', function () { return st.native ? st.paused : el.paused; });
    def('readyState', function () { return st.native ? st.ready : el.readyState; });
    def('networkState', function () { return st.native ? 2 : el.networkState; });
    def('error', function () { return st.native ? st.err : el.error; });
    def('videoWidth', function () { return st.native ? st.w : el.videoWidth; });
    def('videoHeight', function () { return st.native ? st.h : el.videoHeight; });
    def('webkitAudioDecodedByteCount', function () { return st.native ? 1 : el.webkitAudioDecodedByteCount; });
    def('dataset', function () { return el.dataset; });
    def('muted', function () { return st.native ? st.muted : el.muted; }, function (m) {
      st.muted = !!m; el.muted = !!m;
      if (st.native) call('npMute', !!m);
    });
    def('buffered', function () {
      if (!st.native) return el.buffered;
      var end = st.buf;
      return { length: end > 0 ? 1 : 0, start: function () { return 0; }, end: function () { return end; } };
    });
    shim.getVideoPlaybackQuality = function () {
      return st.native ? { totalVideoFrames: 0, droppedVideoFrames: 0 } : el.getVideoPlaybackQuality();
    };
    shim.canPlayType = function (t) { return el.canPlayType(t); };
    shim.play = function () {
      if (!st.native) return el.play();
      st.paused = false; call('npPlay');
      return Promise.resolve();
    };
    shim.pause = function () {
      if (!st.native) { el.pause(); return; }
      st.paused = true; call('npPause');
    };
    shim.load = function () { if (!st.native) el.load(); };
    shim.addEventListener = function (type, fn) {
      (L[type] = L[type] || []).push(fn);
      el.addEventListener(type, function (e) { if (!st.native) fn.call(shim, e); });
    };
    /** The file in hand will not play in the web view: carry on from here in the app's own player. */
    shim.switchToNative = function () {
      if (st.native || !hasNative() || !el.currentSrc && !el.src) return false;
      var at = el.currentTime || 0, url = el.currentSrc || el.src;
      el.removeAttribute('src');
      try { el.load(); } catch (e) { /* nothing loaded */ }
      open(url, at > 3 ? at - 1 : 0);
      return true;
    };
    shim.canNative = hasNative;

    /** Called by the app with what the native player is doing. */
    root.__np = function (gen, type, a, b, c) {
      if (gen !== st.gen || !st.native) return;
      if (type === 'ready') {
        st.dur = a / 1000; st.w = b || 0; st.h = c || 0; st.ready = Math.max(st.ready, 3);
        fire('loadedmetadata'); fire('loadeddata'); fire('canplay');
      } else if (type === 'playing') {
        st.playing = true; st.paused = false; st.ready = 4; st.ts = Date.now();
        fire('playing');
      } else if (type === 'paused') {
        st.playing = false; st.paused = true;
        fire('pause');
      } else if (type === 'waiting') {
        st.playing = false; st.ready = 2; st.ts = Date.now();
        fire('waiting');
      } else if (type === 'time') {
        st.pos = a / 1000; st.ts = Date.now(); st.buf = (b || 0) / 1000;
        if (c === 1) st.playing = true;
        fire('timeupdate');
      } else if (type === 'seeked') {
        st.pos = a / 1000; st.ts = Date.now();
        fire('seeking'); fire('seeked');
      } else if (type === 'ended') {
        st.playing = false; st.paused = true;
        fire('ended');
      } else if (type === 'note') {
        if (root.__ytNote) root.__ytNote(String(a || ''));
      } else if (type === 'error') {
        st.playing = false; st.err = { code: 4, message: String(a || '') };
        fire('error');
      }
    };
    return shim;
  }
  root.makeVideo = makeVideo;
})(typeof window !== 'undefined' ? window : this);
