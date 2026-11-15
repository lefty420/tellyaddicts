/* Teletext pages: the text of every page the app builds from its own guide, weather and news (the page layout itself is in teletext.js).
 * app.js hands in the few helpers these pages read from the guide; nothing here touches the screen or the keys. */
window.TTPages = function (ctx) {
  var ready = ctx.ready, channels = ctx.channels, E = ctx.E, fmtTime = ctx.fmtTime, gmName = ctx.gmName, http = ctx.http, pad2 = ctx.pad2, filmFor = ctx.filmFor, blocked = ctx.blocked;
  var TT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], TT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function ttAscii(s) { return String(s || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e]/g, '').replace(/[{}]/g, ''); }
  function ttPad(s, n) { s = ttAscii(s).slice(0, n); while (s.length < n) s += ' '; return s; }
  function ttHead(n) { var d = new Date(); return '{w}P' + n + '{y} TELLY ADDICTS {c}' + TT_DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + TT_MONTHS[d.getMonth()] + ' {y}' + fmtTime(d.getTime()); }
  function ttPages(num, title, body, fast, foot) {
    // body: lines for rows 4..22; more than fit makes sub-pages that turn over by themselves
    var per = 18, out = [], n = Math.max(1, Math.ceil(body.length / per));
    for (var i = 0; i < n; i++) {
      var part = body.slice(i * per, (i + 1) * per), acts = {};
      var ls = [ttHead(num), '', '{b}{nb}{y}{H}' + title, ''].concat(part.map(function (x, k) { if (x && x.act) acts[4 + k] = x.act; return x && x.t != null ? x.t : x; }));
      while (ls.length < 23) ls.push('');
      ls.push(n > 1 ? '{c}Page ' + (i + 1) + ' of ' + n : '');
      ls.push(foot || '{r}Index {g}On now {y}Next {c}Tonight');
      var pgo = T().page(num, ls, fast || [100, 110, 130, 120]);
      pgo.acts = acts;
      out.push(pgo);
    }
    return out;
  }
  function T() { return window.Teletext; }
  function ttChanRows(at, next) {
    var rows = [];
    ready().forEach(function (c) {
      var b = E.blockAt(c.sched, at);
      if (b && next) b = E.stepBlock(c.sched, b, 1);
      if (!b || !b.prog) return;
      rows.push({ t: '{c}' + ('0' + c.n).slice(-2) + ' ' + ttPad(c.name, 11) + '{w}' + ttPad(gmName(b.prog), 24), act: { c: c, b: b } });
    });
    return rows;
  }


  // Weather (Open-Meteo) and the dated news page (Wikipedia's "on this day" for today's date, in a year from the timeline)
  var TT_CITIES = [['London', 51.51, -0.13], ['Birmingham', 52.48, -1.9], ['Manchester', 53.48, -2.24], ['Cardiff', 51.48, -3.18], ['Glasgow', 55.86, -4.25], ['Belfast', 54.6, -5.93]];
  var TT_WX = { 0: 'Clear', 1: 'Mostly clear', 2: 'Part cloud', 3: 'Cloudy', 45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle', 56: 'Frzg drizzle', 57: 'Frzg drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Frzg rain', 67: 'Frzg rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunder', 96: 'Thunder', 99: 'Thunder' };
  var ttCache = {};
  function ttCached(key, ms, fetcher) {
    var c = ttCache[key];
    if (c && Date.now() - c.t < ms) return Promise.resolve(c.v);
    return fetcher().then(function (v) { ttCache[key] = { t: Date.now(), v: v }; return v; });
  }
  function ttTemp(x) { return (x < 0 ? '-' : '') + Math.round(Math.abs(x)) + 'C'; }
  function ttWeather() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + TT_CITIES.map(function (c) { return c[1]; }).join(',') + '&longitude=' + TT_CITIES.map(function (c) { return c[2]; }).join(',') +
      '&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=Europe%2FLondon&wind_speed_unit=mph';
    return ttCached('wx', 900000, function () { return http(url).then(function (t) { var j = JSON.parse(t); return Array.isArray(j) ? j : [j]; }); });
  }
  function ttWxPages(num, j) {
    var body = [''];
    if (num === 300) {
      body.push('{c}City         Now  Wind   Sky');
      j.forEach(function (d, i) { var cu = d.current || {}; body.push('{w}' + ttPad(TT_CITIES[i][0], 12) + ' {y}' + ttPad(ttTemp(cu.temperature_2m), 4) + '{w}' + ttPad(Math.round(cu.wind_speed_10m) + 'mph', 6) + '{c}' + ttPad(TT_WX[cu.weather_code] || '', 14)); });
      body.push(''); body.push('{w}Forecast for 3 days ............ {y}301');
      return ttPages(300, ' WEATHER NOW', body, [100, 301, 310, 120], '{r}Index {g}Forecast {y}News {c}Tonight');
    }
    var days = ['Today', 'Tomorrow', 'Day 3'];
    body.push('{c}City       ' + ' High/Low  Sky');
    j.forEach(function (d, i) {
      var dd = d.daily || {};
      body.push('{y}' + ttPad(TT_CITIES[i][0], 38));
      for (var k = 0; k < 3; k++) {
        var date = new Date(dd.time[k] + 'T12:00:00');
        body.push('{c} ' + ttPad(k < 2 ? days[k] : TT_DAYS[date.getDay()], 9) + '{w}' + ttPad(ttTemp(dd.temperature_2m_max[k]) + '/' + ttTemp(dd.temperature_2m_min[k]), 10) + '{w}' + ttPad(TT_WX[dd.weather_code[k]] || '', 17));
      }
    });
    return ttPages(301, ' WEATHER FORECAST', body, [100, 300, 310, 120], '{r}Index {g}Now {y}News {c}Tonight');
  }
  /** The year used for today's news: one from the timeline (1970-1999) that has enough events on this date, picked by the date so it is the same all day. */
  function ttNewsYear(ev) {
    var by = {};
    ev.forEach(function (e) { if (e.year >= 1970 && e.year <= 1999) (by[e.year] = by[e.year] || []).push(e); });
    var yrs = Object.keys(by).filter(function (y) { return by[y].length >= 1; }).map(Number).sort();
    if (!yrs.length) return null;
    var d = new Date(), doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    var y = yrs[(doy * 7 + d.getFullYear()) % yrs.length];
    return { year: y, items: by[y], others: yrs.filter(function (x) { return x !== y; }) };
  }
  function ttNews() {
    var d = new Date(), url = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate());
    return ttCached('news' + url, 3600000, function () { return http(url).then(function (t) { var j = JSON.parse(t); return (j.events || []).map(function (e) { return { year: e.year, text: ttAscii(e.text) }; }); }); });
  }
  function ttNewsPages(ev) {
    var pick = ttNewsYear(ev), d = new Date(), body = [''];
    var months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    if (!pick) { body.push('{w}No news is stored for this date.'); return ttPages(310, ' NEWS', body, [100, 300, 110, 120]); }
    pick.items.forEach(function (e) {
      var ln = '';
      e.text.split(' ').forEach(function (w) { if ((ln + ' ' + w).trim().length > 38) { body.push('{w}' + ln); ln = w; } else ln = (ln + ' ' + w).trim(); });
      if (ln) body.push('{w}' + ln);
      body.push('');
    });
    body.push('{c}Other years with news: ' + pick.others.slice(0, 6).join(' '));
    body.push('{w}Source: Wikipedia, On this day');
    return ttPages(310, ' NEWS ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + pick.year, body, [100, 300, 110, 120], '{r}Index {g}Weather {y}On now {c}Tonight');
  }

  // Film of the day: a film from the guide, picked by the date, with the TMDb details the app already holds (no network needed)
  function ttFilms() {
    var seen = {}, out = [];
    channels.forEach(function (c) { (c.plan || []).forEach(function (pr) {
      if (!pr.filmKey || pr.ad || seen[pr.filmKey] || blocked(pr)) return;
      var f = filmFor(pr);
      if (!f || !f.title || !f.plot || !String(f.cert || '').trim()) return;
      seen[pr.filmKey] = { f: f, chans: [] };
      out.push(seen[pr.filmKey]);
    }); });
    channels.forEach(function (c) { (c.plan || []).forEach(function (pr) { var o = pr.filmKey && seen[pr.filmKey]; if (o && o.chans.indexOf(c.n) < 0) o.chans.push(c.n); }); });
    out.sort(function (a, b) { return a.f.title < b.f.title ? -1 : 1; });
    return out;
  }
  function ttWrap(text, w, col) {
    var out = [], ln = '';
    ttAscii(text).split(' ').forEach(function (x) { if ((ln + ' ' + x).trim().length > w) { out.push(col + ln); ln = x; } else ln = (ln + ' ' + x).trim(); });
    if (ln) out.push(col + ln);
    return out;
  }
  function ttFilmPages(num) {
    var all = ttFilms(), body = [''];
    if (!all.length) { body.push('{w}No film details are stored yet.'); return ttPages(num, ' FILM OF THE DAY', body, [100, 300, 310, 120]); }
    if (num === 321) {
      all.forEach(function (o) { body.push('{c}' + ttPad((o.f.released || '').slice(0, 4), 5) + '{w}' + ttPad(o.f.title, 33)); });
      return ttPages(321, ' MORE FILMS', body, [100, 320, 300, 310], '{r}Index {g}Film {y}Weather {c}News');
    }
    var d = new Date(), doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000), o = all[(doy * 13 + d.getFullYear()) % all.length], f = o.f;
    body.push('{y}' + ttPad(String(f.title).replace(/\s*\(\d{4}\)\s*$/, ''), 38));
    body.push('{c}' + ttPad([String(f.released || '').slice(0, 4), f.cert, f.mins ? Math.floor(f.mins / 60) + 'h ' + (f.mins % 60) + 'm' : ''].filter(Boolean).join('  '), 38));
    if (f.genres) body.push('{c}' + ttPad(f.genres, 38));
    body.push('');
    body = body.concat(ttWrap(f.plot, 38, '{w}').slice(0, 7));
    body.push('');
    if (f.cast && f.cast.length) { body.push('{y}Starring'); body.push('{w}' + ttPad(f.cast.slice(0, 4).map(function (m) { return m.n; }).join(', '), 38)); }
    if (o.chans.length) { body.push(''); body.push('{c}On channel ' + o.chans.slice(0, 6).map(function (n) { return ('0' + n).slice(-2); }).join(', ')); }
    body.push(''); body.push('{w}More films ............ {y}321');
    return ttPages(320, ' FILM OF THE DAY', body, [100, 321, 300, 310], '{r}Index {g}More {y}Weather {c}News');
  }
  function ttBuild(num) {
    var now = Date.now(), body = [], i;
    if (num === 100) {
      var items = [['On now', 110], ['Tonight on TV', 120], ['Coming up next', 130], ['On this day', 140], ['Weather', 300], ['News for today', 310], ['Film of the day', 320], ['Channel schedules', 150], ['About Telly Addicts', 190]];
      body.push('');
      items.forEach(function (it) { var d = ''; for (var k = it[0].length; k < 31; k++) d += '.'; body.push('{c}' + it[0] + ' ' + d + '{w} ' + it[1]); });
      body.push('');
      var bar = '{R}{#127}{#127}{#127}{G}{#127}{#127}{#127}{Y}{#127}{#127}{#127}{B}{#127}{#127}{#127}{M}{#127}{#127}{#127}{C}{#127}{#127}{#127}{W}{#127}{#127}{#127}';
      body.push(bar); body.push(bar); body.push('');
      body.push('{w}Move with the arrows, press OK on'); body.push('{w}a page number. Hold OK to type one.');
      return ttPages(100, ' TELLY ADDICTS', body, [110, 120, 130, 140], '{r}On now {g}Tonight {y}Next {c}This day');
    }
    if (num === 110) return ttPages(110, ' ON NOW', [''].concat(ttChanRows(now, false)), [100, 120, 130, 140]);
    if (num === 130) return ttPages(130, ' COMING UP NEXT', [''].concat(ttChanRows(now, true)), [100, 110, 120, 140]);
    if (num === 120) {
      var t8 = new Date(); t8.setHours(20, 0, 0, 0); if (t8.getTime() < now - 3600000) t8.setDate(t8.getDate() + 1);
      return ttPages(120, ' TONIGHT AT 20:00', [''].concat(ttChanRows(t8.getTime(), false)), [100, 110, 130, 140]);
    }
    if (num === 140) {
      var clips = (window.OTD || []).map(function (o) { var m = /^On This Day (\d{4}):\s*(.*)$/.exec(o[1] || ''); return m ? { y: +m[1], t: ttAscii(m[2]) } : null; }).filter(Boolean);
      clips.sort(function (a, b) { return a.y - b.y; });
      var blocks = [];
      clips.forEach(function (c) {
        var ws = c.t.split(' '), cur2 = '', ls = ['{c}' + c.y];
        ws.forEach(function (w) { if ((cur2 + ' ' + w).trim().length > 38) { ls.push('{w}' + cur2); cur2 = w; } else cur2 = (cur2 + ' ' + w).trim(); });
        if (cur2) ls.push('{w}' + cur2);
        if (ls.length > 4) { ls = ls.slice(0, 4); ls[3] = ls[3].slice(0, 35).replace(/\s+$/, '') + '...'; }
        ls.push(''); blocks.push(ls);
      });
      var pg = [], per = 18, curp = [];
      blocks.forEach(function (b) { if (curp.length + b.length > per) { pg.push(curp); curp = []; } curp = curp.concat(b); });
      if (curp.length) pg.push(curp);
      var all = [];
      pg.forEach(function (p) { while (p.length < per) p.push(''); all = all.concat(p); });
      if (!all.length) all = ['', '{w}No archive clips are loaded.'];
      all.unshift('');
      return ttPages(140, ' ON THIS DAY', all, [100, 110, 130, 120], '{r}Index {g}On now {y}Next {c}Tonight');
    }
    if (num === 320 || num === 321) return ttFilmPages(num);
    if (num === 150) {
      body = [''];
      ready().forEach(function (c) { if (c.n < 100) body.push('{c}' + ttPad(c.name, 30) + '{w}' + (200 + c.n)); });
      return ttPages(150, ' CHANNELS', body, [100, 110, 130, 120]);
    }
    if (num >= 200 && num < 300) {
      var ch = ready().filter(function (c) { return c.n === num - 200; })[0];
      if (!ch) return null;
      body = ['{y}' + ttPad(ch.name, 38)];
      var bl = E.blockAt(ch.sched, now), k = 0;
      while (bl && bl.prog && k < 40) { body.push({ t: '{c}' + fmtTime(bl.startMs) + ' {w}' + ttPad(gmName(bl.prog), 33), act: { c: ch, b: bl } }); bl = E.stepBlock(ch.sched, bl, 1); k++; }
      return ttPages(num, ' ' + ttAscii(ch.name).toUpperCase().slice(0, 30), body, [150, 110, 130, 120]);
    }
    if (num === 190) {
      body = ['', '{w}Telly Addicts is a free hobby project.', '{w}Every page here is built by the app', '{w}from your own guide, on this TV.', '', '{c}Arrows move between page numbers and', '{c}the four links on the bottom row.', '{c}OK opens one.', '', '{y}Hold OK to type a page number.', '{y}Back goes to the page before.'];
      return ttPages(190, ' ABOUT', body, [100, 110, 130, 120]);
    }
    return null;
  }
  return { T: T, ttAscii: ttAscii, ttPad: ttPad, ttPages: ttPages, ttBuild: ttBuild, ttWeather: ttWeather, ttWxPages: ttWxPages, ttNews: ttNews, ttNewsPages: ttNewsPages };
};
