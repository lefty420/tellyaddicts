package app.britishtv;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletionService;
import java.util.concurrent.ExecutorCompletionService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * Turns a YouTube video id into a stream the player can open, by asking public Piped and Invidious servers
 * (community-run YouTube front-ends with an open API). They fetch the video from YouTube themselves and answer with a
 * plain stream address: no adverts, no sign-in, nothing tied to an account, and keeping up with YouTube's changes is
 * their job. This app does not talk to YouTube's player directly.
 *
 * Public servers come and go, so several are asked at once and the first good answer wins; the one that answered last
 * time is asked first next time. When every one fails, the reasons are collected into the error, which ends up in the
 * debug log. Up to 1080p comes as a picture-only file plus a sound-only file, which the player joins; otherwise the
 * single combined file is used.
 */
final class YoutubeResolver {
    static final String UA = "Mozilla/5.0 (Linux; Android 12; Google TV Streamer) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

    /** Piped API addresses, then Invidious bases. The list is the TeamPiped and Invidious projects' own public lists. */
    private static final String[] PIPED = {
        "https://pipedapi.kavin.rocks", "https://pipedapi.leptons.xyz", "https://pipedapi.adminforge.de",
        "https://api.piped.private.coffee", "https://pipedapi.drgns.space", "https://pipedapi.nosebs.ru"
    };
    private static final String[] INVIDIOUS = {
        "https://inv.nadeko.net", "https://invidious.nerdvpn.de", "https://yt.chocolatemoo53.com", "https://invidious.tiekoetter.com"
    };

    private static volatile String lastGood = "";

    /** Servers taken from the projects' own live lists ("P<address>" or "I<address>"), and when they were fetched. Public servers come and go,
     *  so the built-in lists above are only the fall-back for when these cannot be fetched. */
    private static volatile List<String> live = null;
    private static volatile long liveAt = 0;
    private static final long LIVE_TTL_MS = 6L * 3600000L;
    private static final int LIVE_EACH = 8;
    private static final Object LIVE_LOCK = new Object();

    private static String getText(String url, int ms) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(ms);
        c.setReadTimeout(ms);
        c.setRequestProperty("User-Agent", UA);
        c.setRequestProperty("Accept", "application/json");
        int code = c.getResponseCode();
        if (code != 200) {
            throw new Exception("HTTP " + code);
        }
        InputStream in = c.getInputStream();
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        byte[] chunk = new byte[16384];
        int n;
        while ((n = in.read(chunk)) > 0) {
            buf.write(chunk, 0, n);
        }
        in.close();
        return buf.toString("UTF-8");
    }

    /** Fetch the current Piped and Invidious server lists (at most every few hours). Never throws; on any failure the old list, or none, stays. */
    private static void refreshLive() {
        synchronized (LIVE_LOCK) {
            if (live != null && System.currentTimeMillis() - liveAt < LIVE_TTL_MS) {
                return;
            }
            liveAt = System.currentTimeMillis();            // also when it fails: not tried again for a while at every play
            List<String> found = new ArrayList<String>();
            try {
                JSONArray pa = new JSONArray(getText("https://piped-instances.kavin.rocks/", 5000));
                int k = 0;
                for (int i = 0; i < pa.length() && k < LIVE_EACH; i++) {
                    JSONObject o = pa.optJSONObject(i);
                    String u = o == null ? "" : o.optString("api_url", "");
                    if (u.startsWith("https://")) {
                        found.add("P" + u.replaceAll("/+$", ""));
                        k++;
                    }
                }
            } catch (Throwable t) {
                // the list could not be fetched: the built-in servers are used
            }
            try {
                JSONArray ia = new JSONArray(getText("https://api.invidious.io/instances.json?sort_by=health", 5000));
                int k = 0;
                for (int i = 0; i < ia.length() && k < LIVE_EACH; i++) {
                    JSONArray row = ia.optJSONArray(i);
                    JSONObject o = row == null ? null : row.optJSONObject(1);
                    if (o != null && o.optBoolean("api", false) && "https".equals(o.optString("type", ""))) {
                        String u = o.optString("uri", "");
                        if (u.startsWith("https://")) {
                            found.add("I" + u.replaceAll("/+$", ""));
                            k++;
                        }
                    }
                }
            } catch (Throwable t) {
                // as above
            }
            if (!found.isEmpty()) {
                live = found;
            } else if (live == null) {
                live = new ArrayList<String>();
            }
        }
    }
    /** An answer at least this sharp is used at once; a softer one waits GRACE_MS for a better one (and is used if none comes). */
    private static final int GOOD_HEIGHT = 720;
    private static final long GRACE_MS = 3000;

    static final class Result {
        String video;      // picture (and sound too when audio is null)
        String audio;      // sound-only stream to join with the picture, or null
        String label;      // what was chosen and where from, for the log
        String error;      // set when nothing could be found
        String server;     // the server that answered, as "P<address>" or "I<address>", so a stream that never starts can be skipped
        int height;        // picture height of what was chosen (0 when unknown), so a better answer can be preferred
    }

    private YoutubeResolver() {
    }

    /** Blocking: call from a background thread. */
    static Result resolve(final String id) {
        return resolve(id, null);
    }

    /** A server whose stream never started: it is not asked first next time. */
    static void markBad(String server) {
        if (server != null && server.equals(lastGood)) {
            lastGood = "";
        }
    }

    /** Blocking: call from a background thread. The servers in skip (ones whose stream already failed this time) are not asked. */
    static Result resolve(final String id, Set<String> skip) {
        refreshLive();
        List<String> servers = new ArrayList<String>();
        List<String> fresh = live;
        if (fresh != null) {
            servers.addAll(fresh);
        }
        for (String s : PIPED) {
            if (!servers.contains("P" + s)) {
                servers.add("P" + s);
            }
        }
        for (String s : INVIDIOUS) {
            if (!servers.contains("I" + s)) {
                servers.add("I" + s);
            }
        }
        if (skip != null) {
            servers.removeAll(skip);
        }
        if (servers.isEmpty()) {
            Result none = new Result();
            none.error = "every server has been tried";
            return none;
        }
        if (lastGood.length() > 0 && servers.remove(lastGood)) {
            servers.add(0, lastGood);
        }
        ExecutorService pool = Executors.newFixedThreadPool(servers.size());
        CompletionService<Result> done = new ExecutorCompletionService<Result>(pool);
        List<Future<Result>> all = new ArrayList<Future<Result>>();
        for (final String s : servers) {
            all.add(done.submit(new Callable<Result>() {
                @Override
                public Result call() {
                    Result r = s.charAt(0) == 'P' ? askPiped(s.substring(1), id) : askInvidious(s.substring(1), id);
                    r.server = s;
                    if (r.error == null) {
                        lastGood = s;
                    }
                    return r;
                }
            }));
        }
        StringBuilder why = new StringBuilder();
        long end = System.currentTimeMillis() + 20000;
        Result best = null;
        try {
            for (int i = 0; i < servers.size(); i++) {
                long left = end - System.currentTimeMillis();
                if (left <= 0) {
                    break;
                }
                Future<Result> f = done.poll(left, TimeUnit.MILLISECONDS);
                if (f == null) {
                    break;
                }
                Result r = f.get();
                if (r.error == null) {
                    if (best == null || r.height > best.height) {
                        best = r;
                    }
                    if (best.height >= GOOD_HEIGHT) {
                        lastGood = best.server;
                        return best;                       // good enough: no need to wait for the others
                    }
                    // a low-quality answer came first: give the other servers a few seconds to offer a sharper one, and use it if none does
                    long grace = System.currentTimeMillis() + GRACE_MS;
                    if (grace < end) {
                        end = grace;
                    }
                    continue;
                }
                if (why.length() < 600) {
                    why.append(why.length() > 0 ? "; " : "").append(r.error);
                }
            }
            if (best != null) {
                lastGood = best.server;
                return best;
            }
        } catch (Throwable t) {
            if (best != null) {
                lastGood = best.server;
                return best;
            }
            why.append("; ").append(t);
        } finally {
            for (Future<Result> f : all) {
                f.cancel(true);
            }
            pool.shutdownNow();
        }
        Result none = new Result();
        none.error = "no server gave a stream (" + why + ")";
        return none;
    }

    private static String host(String base) {
        return base.replace("https://", "");
    }

    private static JSONObject get(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(8000);
        c.setReadTimeout(12000);
        c.setRequestProperty("User-Agent", UA);
        c.setRequestProperty("Accept", "application/json");
        int code = c.getResponseCode();
        if (code != 200) {
            throw new Exception("HTTP " + code);
        }
        InputStream in = c.getInputStream();
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        byte[] chunk = new byte[16384];
        int n;
        while ((n = in.read(chunk)) > 0) {
            buf.write(chunk, 0, n);
        }
        in.close();
        return new JSONObject(buf.toString("UTF-8"));
    }

    /** "1080p", "720p60" or "1080p (HD)" -> 1080 etc.; 0 when there is no number. */
    private static int heightOf(String label) {
        if (label == null) {
            return 0;
        }
        int v = 0;
        boolean any = false;
        for (int i = 0; i < label.length(); i++) {
            char ch = label.charAt(i);
            if (ch >= '0' && ch <= '9') {
                v = v * 10 + (ch - '0');
                any = true;
            } else if (any) {
                break;
            }
        }
        return v;
    }

    private static Result askPiped(String base, String id) {
        Result r = new Result();
        try {
            JSONObject j = get(base + "/streams/" + id);
            if (j.has("error")) {
                r.error = host(base) + ": " + j.optString("message", j.optString("error"));
                return r;
            }
            JSONObject vid = null, aud = null, mux = null;
            JSONArray vs = j.optJSONArray("videoStreams");
            for (int i = 0; vs != null && i < vs.length(); i++) {
                JSONObject f = vs.optJSONObject(i);
                if (f == null || f.optString("url").length() == 0) {
                    continue;
                }
                String mt = f.optString("mimeType", "");
                int h = f.optInt("height", heightOf(f.optString("quality")));
                if (!mt.startsWith("video/mp4")) {
                    continue;
                }
                if (f.optBoolean("videoOnly")) {
                    if (h <= 1080 && f.optString("codec", "avc1").contains("avc1") && (vid == null || h > vid.optInt("height", 0))) {
                        vid = f;
                        vid.put("height", h);
                    }
                } else if (mux == null || h > mux.optInt("height", 0)) {
                    mux = f;
                    mux.put("height", h);
                }
            }
            JSONArray as = j.optJSONArray("audioStreams");
            for (int i = 0; as != null && i < as.length(); i++) {
                JSONObject f = as.optJSONObject(i);
                if (f == null || f.optString("url").length() == 0 || !f.optString("mimeType", "").startsWith("audio/mp4")) {
                    continue;
                }
                if (aud == null || f.optInt("bitrate", 0) > aud.optInt("bitrate", 0)) {
                    aud = f;
                }
            }
            return pick(r, host(base), vid, aud, mux);
        } catch (Throwable t) {
            r.error = host(base) + ": " + t.getMessage();
            return r;
        }
    }

    private static Result askInvidious(String base, String id) {
        Result r = new Result();
        try {
            JSONObject j = get(base + "/api/v1/videos/" + id + "?local=true");
            if (j.has("error")) {
                r.error = host(base) + ": " + j.optString("error");
                return r;
            }
            JSONObject vid = null, aud = null, mux = null;
            JSONArray fs = j.optJSONArray("formatStreams");
            for (int i = 0; fs != null && i < fs.length(); i++) {
                JSONObject f = fs.optJSONObject(i);
                if (f == null || f.optString("url").length() == 0 || !f.optString("type", "").startsWith("video/mp4")) {
                    continue;
                }
                int h = heightOf(f.optString("qualityLabel", f.optString("resolution")));
                if (mux == null || h > mux.optInt("height", 0)) {
                    mux = f;
                    mux.put("height", h);
                }
            }
            JSONArray af = j.optJSONArray("adaptiveFormats");
            for (int i = 0; af != null && i < af.length(); i++) {
                JSONObject f = af.optJSONObject(i);
                if (f == null || f.optString("url").length() == 0) {
                    continue;
                }
                String t = f.optString("type", "");
                if (t.startsWith("video/mp4") && t.contains("avc1")) {
                    int h = heightOf(f.optString("qualityLabel", f.optString("resolution")));
                    if (h <= 1080 && (vid == null || h > vid.optInt("height", 0))) {
                        vid = f;
                        vid.put("height", h);
                    }
                } else if (t.startsWith("audio/mp4")) {
                    if (aud == null || f.optInt("bitrate", 0) > aud.optInt("bitrate", 0)) {
                        aud = f;
                    }
                }
            }
            return pick(r, host(base), vid, aud, mux);
        } catch (Throwable t) {
            r.error = host(base) + ": " + t.getMessage();
            return r;
        }
    }

    private static Result pick(Result r, String from, JSONObject vid, JSONObject aud, JSONObject mux) throws Exception {
        if (vid != null && aud != null && (mux == null || vid.optInt("height", 0) > mux.optInt("height", 0))) {
            r.video = vid.getString("url");
            r.audio = aud.getString("url");
            r.height = vid.optInt("height", 0);
            r.label = from + " " + vid.optInt("height", 0) + "p picture + sound";
        } else if (mux != null) {
            r.video = mux.getString("url");
            r.height = mux.optInt("height", 0);
            r.label = from + " " + mux.optInt("height", 0) + "p single file";
        } else {
            r.error = from + ": no mp4 stream";
        }
        return r;
    }
}
