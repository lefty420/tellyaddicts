/*
 * Picture enhancement for old, low-resolution video. The <video> frame is drawn through a WebGL shader
 * at the screen's resolution:
 *   sharp  - removes comb lines from interlacing, then sharpens the upscaled picture
 *   clean  - the above plus a light noise reduction (VHS grain, compression blocks)
 *   crt    - scanlines, a soft glow and a vignette, like an old tube set
 * Needs the video to be CORS-readable (archive.org sends the header). If it is not, or WebGL is missing,
 * onFail() is called and the app goes back to the plain video.
 */
(function (root) {
  'use strict';

  var MODES = ['off', 'sharp', 'clean', 'crt'];
  var MODE_NO = { off: 0, sharp: 1, clean: 2, crt: 3 };

  var VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FS = [
    'precision highp float;',
    'uniform sampler2D tex;',
    'uniform vec2 texel;',       // 1 / video size
    'uniform vec2 res;',         // canvas size in pixels
    'uniform vec4 box;',         // where the picture sits on screen (0..1): x0, y0, x1, y1
    'uniform float mode;',
    'vec3 T(vec2 uv){ return texture2D(tex, uv).rgb; }',
    'float L(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
    'void main(){',
    '  vec2 s = vec2(gl_FragCoord.x / res.x, 1.0 - gl_FragCoord.y / res.y);',
    '  vec2 uv = (s - box.xy) / (box.zw - box.xy);',
    '  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
    '  vec3 c = T(uv);',
    // comb reduction: a line that differs from both neighbours in the same direction is an interlace artefact
    '  vec3 a = T(uv - vec2(0.0, texel.y));',
    '  vec3 b = T(uv + vec2(0.0, texel.y));',
    '  float lc = L(c), la = L(a), lb = L(b);',
    '  float comb = smoothstep(0.05, 0.16, min(abs(lc - la), abs(lc - lb))) * (1.0 - smoothstep(0.08, 0.22, abs(la - lb)));',
    '  comb *= step(0.0, (la - lc) * (lb - lc));',
    '  c = mix(c, (a + b) * 0.5, comb * 0.85);',
    '  vec3 n = T(uv + vec2(texel.x, 0.0)), w = T(uv - vec2(texel.x, 0.0));',
    '  vec3 blur = (a + b + n + w) * 0.25;',
    '  if (mode > 1.5 && mode < 2.5) {',                       // clean: pull noisy pixels toward their neighbours
    '    float d = length(c - blur);',
    '    c = mix(c, blur, (1.0 - smoothstep(0.03, 0.14, d)) * 0.6);',
    '  }',
    '  if (mode < 2.5) {',                                     // sharp and clean: unsharp mask
    '    float amt = mode < 1.5 ? 0.85 : 0.6;',
    '    c = clamp(c + (c - blur) * amt, 0.0, 1.0);',
    '  } else {',                                              // crt
    '    c = mix(c, blur, 0.35);',
    '    float line = uv.y / texel.y;',
    '    float scan = mix(0.62, 1.0, pow(max(sin(3.14159 * fract(line)), 0.0), 0.7));',
    '    float col = mod(gl_FragCoord.x, 3.0);',
    '    vec3 mask = vec3(col < 1.0 ? 1.0 : 0.88, (col >= 1.0 && col < 2.0) ? 1.0 : 0.88, col >= 2.0 ? 1.0 : 0.88);',
    '    vec2 q = s - 0.5;',
    '    float vig = 1.0 - 0.55 * dot(q, q) * 1.6;',
    '    c = c * scan * mask * vig * 1.22;',
    '    c = pow(clamp(c, 0.0, 1.0), vec3(0.95));',
    '  }',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var canvas, video, gl, prog, tex, loc = {};
  var mode = 'off', aspect = 'auto', running = false, ready = false, failed = false;
  var onFail = null, rvfcId = 0, rafId = 0;

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }

  function init(c, v, failCb) {
    canvas = c; video = v; onFail = failCb;
    try {
      gl = c.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' }) ||
           c.getContext('experimental-webgl');
      if (!gl) return false;
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var p = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(p);
      gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
      ['tex', 'texel', 'res', 'box', 'mode'].forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(loc.tex, 0);
      ready = true;
    } catch (e) { ready = false; }
    return ready;
  }

  /** Where the picture goes on a screen of the given pixel size, for the chosen picture size. */
  function pictureBox(sw, sh, vw, vh, asp) {
    var sa = sw / sh, va = vw / vh;
    var want = asp === '43' ? 4 / 3 : asp === '169' ? 16 / 9 : (asp === 'stretch' ? sa : va);
    var w, h;
    if (asp === 'zoom') { if (va > sa) { h = 1; w = va / sa; } else { w = 1; h = sa / va; } }
    else if (want > sa) { w = 1; h = sa / want; } else { h = 1; w = want / sa; }
    return [(1 - w) / 2, (1 - h) / 2, (1 + w) / 2, (1 + h) / 2];
  }

  function sizeCanvas() {
    var dpr = root.devicePixelRatio || 1;
    var W = Math.round(root.innerWidth * dpr), H = Math.round(root.innerHeight * dpr);
    var k = Math.min(1, 1920 / W, 1080 / H);
    W = Math.max(2, Math.round(W * k)); H = Math.max(2, Math.round(H * k));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  }

  function draw() {
    if (!ready || failed || !running) return;
    var vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh || video.readyState < 2) return;
    try {
      sizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);   // throws if the video is not CORS-readable
      var b = pictureBox(canvas.width, canvas.height, vw, vh, aspect);
      gl.uniform2f(loc.texel, 1 / vw, 1 / vh);
      gl.uniform2f(loc.res, canvas.width, canvas.height);
      gl.uniform4f(loc.box, b[0], b[1], b[2], b[3]);
      gl.uniform1f(loc.mode, MODE_NO[mode] || 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } catch (e) {
      failed = true; running = false;
      if (onFail) onFail(e);
    }
  }

  function loop() {
    if (!running) return;
    draw();
    if (video.requestVideoFrameCallback) rvfcId = video.requestVideoFrameCallback(loop);
    else rafId = root.requestAnimationFrame(loop);
  }

  function start() {
    if (!ready || failed || running || mode === 'off') return;
    running = true;
    loop();
  }
  function stop() {
    running = false;
    if (video && video.cancelVideoFrameCallback && rvfcId) video.cancelVideoFrameCallback(rvfcId);
    if (rafId) root.cancelAnimationFrame(rafId);
    rvfcId = rafId = 0;
  }

  root.addEventListener('resize', function () { if (running) draw(); });

  root.FX = {
    MODES: MODES,
    init: init,
    start: start,
    stop: stop,
    redraw: draw,
    reset: function () { failed = false; },
    setMode: function (m) { mode = MODES.indexOf(m) >= 0 ? m : 'off'; if (running) draw(); },
    setAspect: function (a) { aspect = a; if (running) draw(); },
    get ready() { return ready; },
    get failed() { return failed; }
  };
})(window);
