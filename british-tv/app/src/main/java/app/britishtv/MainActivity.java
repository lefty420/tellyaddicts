package app.britishtv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.UiModeManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

import android.util.JsonReader;
import android.util.JsonToken;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;

/**
 * Hosts the bundled British TV guide/player (assets/index.html) full screen.
 * Remote keys are forwarded to the page as KeyboardEvents; archive.org requests
 * are made natively (the page cannot fetch cross-origin from a local file).
 */
public class MainActivity extends Activity {

    private static final String PAGE = "file:///android_asset/index.html";
    private static final String ALLOWED_PREFIX = "https://archive.org/";
    private static final String ALLOWED_PREFIX_2 = "https://api.tvmaze.com/";   // episode names
    private static final int MAX_BODY_BYTES = 4 * 1024 * 1024;  // searches and episode lists; item metadata is trimmed as it is read
    private static final int HTTP_THREADS = 6;                  // archive.org is happier with a few connections than with hundreds

    private final Handler main = new Handler(Looper.getMainLooper());
    /** All requests share a small pool: one thread per request used to leave 50+ threads competing during start-up. */
    private final ExecutorService http = Executors.newFixedThreadPool(HTTP_THREADS, new ThreadFactory() {
        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "tv-http");
            t.setDaemon(true);
            t.setPriority(Thread.NORM_PRIORITY - 1);   // never ahead of the thread drawing the guide
            return t;
        }
    });
    private FrameLayout root;
    private WebView web;
    private boolean onTv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        onTv = isTv();

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);
        immersive();
        buildWeb();
        web.loadUrl(PAGE);
    }

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    private void buildWeb() {
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        web.addJavascriptInterface(new Bridge(), "NativeHttp");
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public Bitmap getDefaultVideoPoster() {
                // WebView's built-in grey "play" picture would show before each video starts: use a blank one
                Bitmap b = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
                b.eraseColor(Color.TRANSPARENT);
                return b;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                root.removeView(web);
                web.destroy();
                buildWeb();
                web.loadUrl(PAGE);
                return true;
            }
        });
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        web.requestFocus();
    }

    private boolean isTv() {
        UiModeManager ui = (UiModeManager) getSystemService(UI_MODE_SERVICE);
        if (ui != null && ui.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
            return true;
        }
        return getPackageManager().hasSystemFeature("android.software.leanback")
                || getPackageManager().hasSystemFeature("amazon.hardware.fire_tv");
    }

    @SuppressWarnings("deprecation")
    private void immersive() {
        root.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    // ---------------------------------------------------------------- keys

    private static String pageKey(int code) {
        switch (code) {
            case KeyEvent.KEYCODE_DPAD_UP: return "ArrowUp";
            case KeyEvent.KEYCODE_DPAD_DOWN: return "ArrowDown";
            case KeyEvent.KEYCODE_DPAD_LEFT: return "ArrowLeft";
            case KeyEvent.KEYCODE_DPAD_RIGHT: return "ArrowRight";
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_NUMPAD_ENTER: return "Enter";
            case KeyEvent.KEYCODE_BACK: return "GoBack";
            case KeyEvent.KEYCODE_GUIDE: return "Guide";
            case KeyEvent.KEYCODE_INFO: return "Info";
            case KeyEvent.KEYCODE_PROG_RED: return "Red";
            case KeyEvent.KEYCODE_PROG_GREEN: return "Green";
            case KeyEvent.KEYCODE_PROG_YELLOW: return "Yellow";
            case KeyEvent.KEYCODE_PROG_BLUE: return "Blue";
            case KeyEvent.KEYCODE_CHANNEL_UP:
            case KeyEvent.KEYCODE_PAGE_UP: return "ChannelUp";
            case KeyEvent.KEYCODE_CHANNEL_DOWN:
            case KeyEvent.KEYCODE_PAGE_DOWN: return "ChannelDown";
            case KeyEvent.KEYCODE_HEADSETHOOK:
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: return "MediaPlayPause";
            case KeyEvent.KEYCODE_MEDIA_PLAY: return "MediaPlay";
            case KeyEvent.KEYCODE_MEDIA_PAUSE: return "MediaPause";
            case KeyEvent.KEYCODE_MEDIA_REWIND: return "MediaRewind";
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD: return "MediaFastForward";
            case KeyEvent.KEYCODE_MEDIA_NEXT:
            case KeyEvent.KEYCODE_MEDIA_SKIP_FORWARD: return "MediaNext";
            default:
                if (code >= KeyEvent.KEYCODE_0 && code <= KeyEvent.KEYCODE_9) {
                    return String.valueOf(code - KeyEvent.KEYCODE_0);
                }
                if (code >= KeyEvent.KEYCODE_NUMPAD_0 && code <= KeyEvent.KEYCODE_NUMPAD_9) {
                    return String.valueOf(code - KeyEvent.KEYCODE_NUMPAD_0);
                }
                return null;
        }
    }

    // OK / Select: a short press sends "Enter" when released; holding it for about half a second sends "Info"
    // instead (for remotes with no Info button). Everything else is forwarded straight away.
    private static final long LONG_PRESS_MS = 550;
    private boolean centerDown = false;
    private boolean centerLong = false;
    private final Runnable centerLongPress = new Runnable() {
        @Override
        public void run() {
            if (centerDown && !centerLong) {
                centerLong = true;
                sendKey("Info", false);
            }
        }
    };

    private void sendKey(String key, boolean repeat) {
        if (web == null) {
            return;
        }
        web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'" + key
                + "',repeat:" + repeat + ",bubbles:true,cancelable:true}));", null);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        String key = pageKey(code);
        if (key == null || web == null) {
            return super.dispatchKeyEvent(event);
        }
        if ("Enter".equals(key)) {
            if (event.getAction() == KeyEvent.ACTION_DOWN) {
                if (event.getRepeatCount() == 0) {
                    centerDown = true;
                    centerLong = false;
                    main.removeCallbacks(centerLongPress);
                    main.postDelayed(centerLongPress, LONG_PRESS_MS);
                }
            } else if (event.getAction() == KeyEvent.ACTION_UP) {
                main.removeCallbacks(centerLongPress);
                if (centerDown && !centerLong) {
                    sendKey("Enter", false);
                }
                centerDown = false;
                centerLong = false;
            }
            return true;
        }
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            sendKey(key, event.getRepeatCount() > 0);
        }
        return true;
    }

    // ---------------------------------------------------------------- lifecycle

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            immersive();
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (web != null) {
            web.onResume();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (web == null) {
            return;
        }
        if (onTv && !isChangingConfigurations()) {
            // Home pressed on a TV: stop playback and close so audio never plays from a hidden screen.
            web.evaluateJavascript(
                    "document.querySelectorAll('video').forEach(function(m){try{m.pause();}catch(e){}})", null);
            finish();
        } else {
            web.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            root.removeView(web);
            web.destroy();
            web = null;
        }
        http.shutdownNow();
        super.onDestroy();
    }

    // ---------------------------------------------------------------- bridge

    /** window.NativeHttp, used by the page. */
    private class Bridge {
        @JavascriptInterface
        public void get(final int id, final String url) {
            http.execute(new Runnable() {
                @Override
                public void run() {
                    int status = 0;
                    String body = "";
                    HttpURLConnection c = null;
                    try {
                        if (url == null || !(url.startsWith(ALLOWED_PREFIX) || url.startsWith(ALLOWED_PREFIX_2))) {
                            throw new SecurityException("blocked url");
                        }
                        c = (HttpURLConnection) new URL(url).openConnection();
                        c.setConnectTimeout(15000);
                        c.setReadTimeout(30000);
                        c.setRequestProperty("User-Agent", "BritishTV/1.0 (Android TV)");
                        status = c.getResponseCode();
                        InputStream in = status >= 200 && status < 300 ? c.getInputStream() : c.getErrorStream();
                        if (in != null) {
                            boolean ok = status >= 200 && status < 300;
                            // An item's metadata lists every file with its checksums: megabytes of fields the page never
                            // reads. Keep only what it uses, as the response is read, so the big string is never built.
                            body = ok && url.contains("/metadata/") ? trimMetadata(in) : readAll(in);
                            in.close();
                        }
                    } catch (Exception e) {
                        status = 0;
                        body = "";
                    } finally {
                        if (c != null) {
                            c.disconnect();
                        }
                    }
                    final String js = "window.__http(" + id + "," + status + "," + JSONObject.quote(body) + ")";
                    main.post(new Runnable() {
                        @Override
                        public void run() {
                            if (web != null) {
                                web.evaluateJavascript(js, null);
                            }
                        }
                    });
                }
            });
        }

        @JavascriptInterface
        public void exit() {
            main.post(new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            });
        }
    }

    private static String readAll(InputStream in) throws java.io.IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) {
            out.write(buf, 0, n);
            if (out.size() > MAX_BODY_BYTES) {
                throw new java.io.IOException("response too large");
            }
        }
        return out.toString("UTF-8");
    }

    /**
     * Reads an archive.org item metadata response and writes back only the fields the page uses:
     * is_dark, metadata.title, metadata["access-restricted-item"], and name/size/length/format per file.
     * Streamed, so a box set listing thousands of files never becomes a multi-megabyte string.
     */
    private static String trimMetadata(InputStream in) throws java.io.IOException {
        JsonReader r = new JsonReader(new InputStreamReader(in, "UTF-8"));
        StringBuilder files = new StringBuilder("[");
        String title = null, restricted = null;
        boolean dark = false;
        int kept = 0;
        r.beginObject();
        while (r.hasNext()) {
            String top = r.nextName();
            if ("is_dark".equals(top)) {
                // the page treats any value here as "unavailable", so only a real yes is passed on
                String d = str(r);
                dark = d != null && !"false".equalsIgnoreCase(d) && !"0".equals(d);
            } else if ("metadata".equals(top) && r.peek() == JsonToken.BEGIN_OBJECT) {
                r.beginObject();
                while (r.hasNext()) {
                    String k = r.nextName();
                    if ("title".equals(k)) {
                        title = str(r);
                    } else if ("access-restricted-item".equals(k)) {
                        restricted = str(r);
                    } else {
                        r.skipValue();
                    }
                }
                r.endObject();
            } else if ("files".equals(top) && r.peek() == JsonToken.BEGIN_ARRAY) {
                r.beginArray();
                while (r.hasNext()) {
                    r.beginObject();
                    String name = null, size = null, len = null, format = null;
                    while (r.hasNext()) {
                        String k = r.nextName();
                        if ("name".equals(k)) {
                            name = str(r);
                        } else if ("size".equals(k)) {
                            size = str(r);
                        } else if ("length".equals(k)) {
                            len = str(r);
                        } else if ("format".equals(k)) {
                            format = str(r);
                        } else {
                            r.skipValue();
                        }
                    }
                    r.endObject();
                    if (name == null) {
                        continue;
                    }
                    if (kept++ > 0) {
                        files.append(',');
                    }
                    files.append('{').append("\"name\":").append(JSONObject.quote(name));
                    if (size != null) {
                        files.append(",\"size\":").append(JSONObject.quote(size));
                    }
                    if (len != null) {
                        files.append(",\"length\":").append(JSONObject.quote(len));
                    }
                    if (format != null) {
                        files.append(",\"format\":").append(JSONObject.quote(format));
                    }
                    files.append('}');
                }
                r.endArray();
            } else {
                r.skipValue();
            }
        }
        r.endObject();
        files.append(']');
        StringBuilder out = new StringBuilder("{\"metadata\":{");
        out.append("\"title\":").append(title == null ? "\"\"" : JSONObject.quote(title));
        if (restricted != null) {
            out.append(",\"access-restricted-item\":").append(JSONObject.quote(restricted));
        }
        out.append('}');
        if (dark) {
            out.append(",\"is_dark\":true");
        }
        out.append(",\"files\":").append(files).append('}');
        return out.toString();
    }

    /** Any scalar as a string (archive.org writes numbers and booleans both ways). */
    private static String str(JsonReader r) throws java.io.IOException {
        JsonToken t = r.peek();
        if (t == JsonToken.NULL) {
            r.nextNull();
            return null;
        }
        if (t == JsonToken.BOOLEAN) {
            return String.valueOf(r.nextBoolean());
        }
        if (t == JsonToken.BEGIN_ARRAY || t == JsonToken.BEGIN_OBJECT) {
            r.skipValue();
            return null;
        }
        return r.nextString();
    }
}
