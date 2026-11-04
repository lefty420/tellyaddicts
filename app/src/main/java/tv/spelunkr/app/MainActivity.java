package tv.spelunkr.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.UiModeManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

/**
 * Full-screen WebView host for https://spelunkr.tv.
 *
 * The site has its own TV layout (programme guide, full-screen playback, remote navigation).
 * It is switched on by:
 *   - loading the site with the "?tv" query on a TV device,
 *   - the "SpelunkrApp/<versionCode>" user-agent suffix,
 *   - the "SpelunkrApp" JavaScript bridge (version(), leave()),
 *   - remote keys (channel, media, back) delivered to the page as KeyboardEvents.
 */
public class MainActivity extends Activity {

    private static final String SITE = "https://spelunkr.tv/";
    private static final long RETRY_DELAY_MS = 15000;

    private static final String JS_SEND_KEY =
            "(function(k,r){var t=document.activeElement||document.body;if(!t)return;"
                    + "['keydown','keyup'].forEach(function(y){t.dispatchEvent(new KeyboardEvent(y,"
                    + "{key:k,repeat:r&&y==='keydown',bubbles:true,cancelable:true}));});})('";

    private static final String JS_MUTE_AND_PAUSE =
            "document.querySelectorAll('video,audio').forEach(function(m){"
                    + "try{m.muted=true;m.pause();}catch(e){}})";

    private final Handler main = new Handler(Looper.getMainLooper());

    private FrameLayout root;
    private WebView web;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCallback;
    private boolean onTv;
    private boolean offline;

    // ---------------------------------------------------------------- lifecycle

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        onTv = isTv();

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);
        immersive();

        boolean debuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        WebView.setWebContentsDebuggingEnabled(debuggable);

        buildWeb();
        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(startUrl());
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
            // Leaving the app on a TV (Home button): stop playback and close, so audio
            // never keeps playing from a hidden screen.
            web.evaluateJavascript(JS_MUTE_AND_PAUSE, null);
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
        super.onDestroy();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) {
            web.saveState(outState);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            immersive();
        }
    }

    // ---------------------------------------------------------------- web view

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    private void buildWeb() {
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setUserAgentString(s.getUserAgentString() + " SpelunkrApp/" + versionCode());

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        web.addJavascriptInterface(new Bridge(), "SpelunkrApp");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);

        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        web.requestFocus();
    }

    private String startUrl() {
        return onTv ? SITE + "?tv" : SITE;
    }

    private boolean isTv() {
        UiModeManager ui = (UiModeManager) getSystemService(UI_MODE_SERVICE);
        if (ui != null && ui.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
            return true;
        }
        PackageManager pm = getPackageManager();
        return pm.hasSystemFeature("android.software.leanback")
                || pm.hasSystemFeature("amazon.hardware.fire_tv");
    }

    @SuppressWarnings("deprecation")
    private int versionCode() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            return 0;
        }
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

    /** Non-web links (mailto:, market:, ...) open in other apps; web links stay in the app. */
    private boolean leaveForUrl(String url) {
        if (url == null || url.startsWith("http://") || url.startsWith("https://")) {
            return false;
        }
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException ignored) {
            // nothing can open it; swallow the navigation anyway
        }
        return true;
    }

    // ---------------------------------------------------------------- offline page

    private void noSignal(String detail, boolean clockHint) {
        if (offline) {
            return;
        }
        offline = true;
        String safe = detail == null ? ""
                : detail.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        String html = "<html><body style=\"margin:0;background:#000;color:#fff;"
                + "font-family:monospace;display:flex;align-items:center;"
                + "justify-content:center;height:100vh;text-align:center\"><div>"
                + "<div style=\"font-size:48px;letter-spacing:4px\">NO SIGNAL</div>"
                + "<div style=\"font-size:20px;margin-top:16px;opacity:.7\">"
                + (clockHint ? "Check the TV's date and time." : "Check the connection.")
                + " Trying again&hellip;</div>"
                + "<div style=\"font-size:14px;margin-top:24px;opacity:.45\">"
                + safe + "</div></div></body></html>";
        web.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
        retryLater();
    }

    private void retryLater() {
        main.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!offline || web == null) {
                    return;
                }
                offline = false;
                web.loadUrl(startUrl());
            }
        }, RETRY_DELAY_MS);
    }

    // ---------------------------------------------------------------- remote keys

    /** Maps remote keys the WebView does not forward to the page's own key names. */
    private static String pageKey(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_BACK:
                return "GoBack";
            case KeyEvent.KEYCODE_HEADSETHOOK:
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                return "MediaPlayPause";
            case KeyEvent.KEYCODE_MEDIA_REWIND:
                return "MediaRewind";
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                return "MediaFastForward";
            case KeyEvent.KEYCODE_PAGE_UP:
            case KeyEvent.KEYCODE_CHANNEL_UP:
                return "ChannelUp";
            case KeyEvent.KEYCODE_PAGE_DOWN:
            case KeyEvent.KEYCODE_CHANNEL_DOWN:
                return "ChannelDown";
            case KeyEvent.KEYCODE_MEDIA_PLAY:
                return "MediaPlay";
            case KeyEvent.KEYCODE_MEDIA_PAUSE:
                return "MediaPause";
            default:
                return null;
        }
    }

    private void sendKey(String key, boolean repeat) {
        web.evaluateJavascript(JS_SEND_KEY + key + "'," + repeat + ")", null);
    }

    private void hideFull() {
        if (fullView == null) {
            return;
        }
        root.removeView(fullView);
        fullView = null;
        if (fullCallback != null) {
            fullCallback.onCustomViewHidden();
            fullCallback = null;
        }
        web.requestFocus();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();

        if (code == KeyEvent.KEYCODE_BACK) {
            if (fullView != null) {
                if (event.getAction() == KeyEvent.ACTION_UP) {
                    hideFull();
                }
                return true;
            }
            // Off TV, or while the offline page is showing, Back works like a normal app.
            if (offline || !onTv) {
                if (event.getAction() == KeyEvent.ACTION_UP) {
                    if (!offline && web.canGoBack()) {
                        web.goBack();
                    } else {
                        finish();
                    }
                }
                return true;
            }
            // On TV the page decides what Back does (close a menu, go up a level, or
            // call SpelunkrApp.leave() to exit).
        }

        String key = pageKey(code);
        if (key == null) {
            return super.dispatchKeyEvent(event);
        }
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            sendKey(key, event.getRepeatCount() > 0);
        }
        return true;
    }

    // ---------------------------------------------------------------- inner classes

    /** Exposed to the page as window.SpelunkrApp. */
    private class Bridge {
        @JavascriptInterface
        public int version() {
            return versionCode();
        }

        @JavascriptInterface
        public void leave() {
            main.post(new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            });
        }
    }

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return leaveForUrl(request.getUrl().toString());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return leaveForUrl(url);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (url != null && !url.startsWith("data:")) {
                offline = false;
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request,
                                    WebResourceError error) {
            if (request.isForMainFrame()) {
                noSignal(error.getDescription() + " (" + error.getErrorCode() + ")", false);
            }
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int errorCode, String description,
                                    String failingUrl) {
            noSignal(description + " (" + errorCode + ")", false);
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.cancel();
            String url = error.getUrl();
            if (url != null && url.startsWith(SITE)) {
                int primary = error.getPrimaryError();
                boolean clock = primary == SslError.SSL_NOTYETVALID
                        || primary == SslError.SSL_EXPIRED
                        || primary == SslError.SSL_DATE_INVALID;
                noSignal("certificate refused (" + primary + ")", clock);
            }
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            root.removeView(web);
            web.destroy();
            buildWeb();
            web.loadUrl(startUrl());
            return true;
        }
    }

    private class Chrome extends WebChromeClient {
        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (fullView != null) {
                callback.onCustomViewHidden();
                return;
            }
            fullView = view;
            fullCallback = callback;
            root.addView(view, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT));
            immersive();
        }

        @Override
        public void onHideCustomView() {
            hideFull();
        }
    }
}
