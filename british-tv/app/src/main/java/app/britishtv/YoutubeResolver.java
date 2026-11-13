package app.britishtv;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Turns a YouTube video id into a stream the player can open, without an account and without adverts.
 *
 * It asks YouTube's own player API the way the YouTube app for a headset does (client "ANDROID_VR"): a signed-out
 * request gets the stream addresses straight back, with no adverts in the answer and nothing tied to a Google account.
 * Up to 1080p comes as a picture-only file plus a sound-only file, which the player joins; if there is no such pair the
 * single combined file (360p) is used. The addresses expire after some hours, so this is done when you press play, never
 * stored. YouTube changes this API from time to time; when it does, the error says so and is written to the debug log.
 */
final class YoutubeResolver {
    static final String CLIENT_VERSION = "1.60.19";
    static final String UA = "com.google.android.apps.youtube.vr.oculus/" + CLIENT_VERSION
            + " (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip";

    static final class Result {
        String video;      // picture (and sound too when audio is null)
        String audio;      // sound-only stream to join with the picture, or null
        String label;      // what was chosen, for the log
        String error;      // set when nothing could be found
    }

    private YoutubeResolver() {
    }

    /** Blocking: call from a background thread. */
    static Result resolve(String id) {
        Result r = new Result();
        try {
            JSONObject client = new JSONObject()
                    .put("clientName", "ANDROID_VR")
                    .put("clientVersion", CLIENT_VERSION)
                    .put("deviceMake", "Oculus")
                    .put("deviceModel", "Quest 3")
                    .put("osName", "Android")
                    .put("osVersion", "12L")
                    .put("androidSdkVersion", 32)
                    .put("hl", "en")
                    .put("gl", "GB");
            JSONObject body = new JSONObject()
                    .put("context", new JSONObject().put("client", client))
                    .put("videoId", id)
                    .put("contentCheckOk", true)
                    .put("racyCheckOk", true);
            HttpURLConnection c = (HttpURLConnection) new URL("https://www.youtube.com/youtubei/v1/player?prettyPrint=false").openConnection();
            c.setRequestMethod("POST");
            c.setConnectTimeout(15000);
            c.setReadTimeout(20000);
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json");
            c.setRequestProperty("User-Agent", UA);
            c.setRequestProperty("X-YouTube-Client-Name", "28");
            c.setRequestProperty("X-YouTube-Client-Version", CLIENT_VERSION);
            c.setRequestProperty("Origin", "https://www.youtube.com");
            OutputStream out = c.getOutputStream();
            out.write(body.toString().getBytes("UTF-8"));
            out.close();
            int code = c.getResponseCode();
            if (code != 200) {
                r.error = "YouTube answered HTTP " + code;
                return r;
            }
            InputStream in = c.getInputStream();
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[16384];
            int n;
            while ((n = in.read(chunk)) > 0) {
                buf.write(chunk, 0, n);
            }
            in.close();
            JSONObject j = new JSONObject(buf.toString("UTF-8"));
            JSONObject status = j.optJSONObject("playabilityStatus");
            String st = status == null ? "?" : status.optString("status", "?");
            if (!"OK".equals(st)) {
                String why = status == null ? "" : status.optString("reason", "");
                r.error = "YouTube says " + st + (why.length() > 0 ? ": " + why : "");
                return r;
            }
            JSONObject sd = j.optJSONObject("streamingData");
            if (sd == null) {
                r.error = "YouTube sent no streams";
                return r;
            }
            JSONObject vid = null, aud = null, mux = null;
            JSONArray ad = sd.optJSONArray("adaptiveFormats");
            for (int i = 0; ad != null && i < ad.length(); i++) {
                JSONObject f = ad.optJSONObject(i);
                if (f == null || !f.has("url")) {
                    continue;
                }
                String mt = f.optString("mimeType", "");
                if (mt.startsWith("video/mp4") && mt.contains("avc1") && f.optInt("height", 0) <= 1080) {
                    if (vid == null || f.optInt("height", 0) > vid.optInt("height", 0)
                            || (f.optInt("height", 0) == vid.optInt("height", 0) && f.optInt("bitrate", 0) > vid.optInt("bitrate", 0))) {
                        vid = f;
                    }
                } else if (mt.startsWith("audio/mp4")) {
                    if (aud == null || f.optInt("bitrate", 0) > aud.optInt("bitrate", 0)) {
                        aud = f;
                    }
                }
            }
            JSONArray fm = sd.optJSONArray("formats");
            for (int i = 0; fm != null && i < fm.length(); i++) {
                JSONObject f = fm.optJSONObject(i);
                if (f == null || !f.has("url")) {
                    continue;
                }
                if (mux == null || f.optInt("height", 0) > mux.optInt("height", 0)) {
                    mux = f;
                }
            }
            if (vid != null && aud != null && (mux == null || vid.optInt("height", 0) > mux.optInt("height", 0))) {
                r.video = vid.getString("url");
                r.audio = aud.getString("url");
                r.label = vid.optInt("height", 0) + "p picture + sound";
            } else if (mux != null) {
                r.video = mux.getString("url");
                r.label = mux.optInt("height", 0) + "p single file";
            } else {
                r.error = "YouTube sent no playable address (it may want a sign-in or a proof-of-origin token)";
            }
        } catch (Throwable t) {
            r.error = "lookup failed: " + t;
        }
        return r;
    }
}
