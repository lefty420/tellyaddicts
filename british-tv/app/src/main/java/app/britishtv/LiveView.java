package app.britishtv;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.view.PixelCopy;
import android.view.View;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Random;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Debug "Live view": shows what the TV is showing, and lets keys be sent to it, from a browser on the home network.
 *
 * Off until it is switched on in Options, and off again when the app closes. Every address carries a random code
 * made when it is switched on, so only someone who has been shown the address can use it. It only ever sends back a
 * picture of the screen, the app's own debug text, and presses of the remote's buttons: nothing a page sends can run
 * code in the app.
 */
final class LiveView {

    /** Something that can press a remote button in the app. */
    interface Keys {
        void press(String key);
    }

    private static final int PORT = 8766;
    private static final String[] ALLOWED = {"ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "GoBack", "Guide",
            "Info", "Red", "Green", "Yellow", "Blue", "ChannelUp", "ChannelDown", "MediaPlayPause"};

    private final Activity activity;
    private final View root;
    private final Keys keys;
    private final Handler main = new Handler(Looper.getMainLooper());
    private ServerSocket server;
    private String token = "";
    private volatile String state = "";

    LiveView(Activity activity, View root, Keys keys) {
        this.activity = activity;
        this.root = root;
        this.keys = keys;
    }

    /** Start serving. Returns the address to open (with its code), or "" if it could not be set up. */
    synchronized String start() {
        try {
            if (server == null) {
                token = String.valueOf(1000 + new Random().nextInt(9000));
                try {
                    server = new ServerSocket(PORT);
                } catch (IOException busy) {
                    server = new ServerSocket(0);
                }
                Thread t = new Thread(new Runnable() {
                    @Override
                    public void run() {
                        acceptLoop();
                    }
                }, "tv-live-server");
                t.setDaemon(true);
                t.start();
            }
            String ip = LogServer.address();
            return ip.isEmpty() ? "" : "http://" + ip + ":" + server.getLocalPort() + "/?t=" + token;
        } catch (Exception e) {
            return "";
        }
    }

    synchronized void stop() {
        try {
            if (server != null) {
                server.close();
            }
        } catch (IOException ignored) {
            // closing anyway
        }
        server = null;
    }

    synchronized boolean running() {
        return server != null;
    }

    void setState(String text) {
        state = text == null ? "" : text;
    }

    private void acceptLoop() {
        while (true) {
            ServerSocket ss = server;
            if (ss == null || ss.isClosed()) {
                return;
            }
            try {
                final Socket sock = ss.accept();
                Thread t = new Thread(new Runnable() {
                    @Override
                    public void run() {
                        serve(sock);
                    }
                }, "tv-live-serve");
                t.setDaemon(true);
                t.start();
            } catch (IOException e) {
                if (server == null) {
                    return;
                }
            }
        }
    }

    private void serve(Socket sock) {
        try {
            sock.setSoTimeout(4000);
            InputStream in = sock.getInputStream();
            StringBuilder head = new StringBuilder();
            int c, run = 0;
            while (run < 4 && head.length() < 8192 && (c = in.read()) >= 0) {
                head.append((char) c);
                run = (c == '\r' || c == '\n') ? run + 1 : 0;
            }
            if (head.length() == 0 || head.charAt(0) == 0x16) {
                return;                                     // a spare connection, or an https attempt
            }
            String line = head.substring(0, Math.max(0, head.indexOf("\r\n")));
            String[] parts = line.split(" ");
            if (parts.length < 2) {
                return;
            }
            String target = parts[1], path = target, query = "";
            int q = target.indexOf('?');
            if (q >= 0) {
                path = target.substring(0, q);
                query = target.substring(q + 1);
            }
            if (!token.equals(param(query, "t"))) {
                reply(sock, "403 Forbidden", "text/plain; charset=utf-8", "Open the address shown on the TV, including the part after the question mark.".getBytes("UTF-8"));
                return;
            }
            if (path.equals("/screen.jpg")) {
                byte[] jpg = capture();
                if (jpg == null) {
                    reply(sock, "503 Service Unavailable", "text/plain; charset=utf-8", "no picture".getBytes("UTF-8"));
                } else {
                    reply(sock, "200 OK", "image/jpeg", jpg);
                }
            } else if (path.equals("/state")) {
                reply(sock, "200 OK", "text/plain; charset=utf-8", state.getBytes("UTF-8"));
            } else if (path.equals("/key")) {
                String k = param(query, "k");
                boolean ok = false;
                for (String a : ALLOWED) {
                    if (a.equals(k)) {
                        ok = true;
                    }
                }
                if (ok) {
                    final String key = k;
                    main.post(new Runnable() {
                        @Override
                        public void run() {
                            keys.press(key);
                        }
                    });
                }
                reply(sock, ok ? "200 OK" : "400 Bad Request", "text/plain; charset=utf-8", (ok ? "ok" : "unknown key").getBytes("UTF-8"));
            } else {
                reply(sock, "200 OK", "text/html; charset=utf-8", page().getBytes("UTF-8"));
            }
        } catch (IOException ignored) {
            // the browser went away
        } finally {
            try {
                sock.close();
            } catch (IOException ignored) {
                // nothing to do
            }
        }
    }

    private static String param(String query, String name) {
        for (String kv : query.split("&")) {
            int e = kv.indexOf('=');
            if (e > 0 && kv.substring(0, e).equals(name)) {
                return kv.substring(e + 1);
            }
        }
        return "";
    }

    private static void reply(Socket sock, String status, String type, byte[] body) throws IOException {
        OutputStream out = sock.getOutputStream();
        out.write(("HTTP/1.1 " + status + "\r\nContent-Type: " + type + "\r\nContent-Length: " + body.length
                + "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
        out.write(body);
        out.flush();
    }

    /** A picture of what is on the screen now (the page and any video behind it), as a JPEG, or null. */
    private synchronized byte[] capture() {
        final int w = root.getWidth(), h = root.getHeight();
        if (w <= 0 || h <= 0) {
            return null;
        }
        final int sw = 960, sh = Math.max(1, h * sw / w);
        final Bitmap bmp = Bitmap.createBitmap(sw, sh, Bitmap.Config.ARGB_8888);
        final CountDownLatch done = new CountDownLatch(1);
        final boolean[] ok = {false};
        main.post(new Runnable() {
            @Override
            public void run() {
                if (Build.VERSION.SDK_INT >= 26) {
                    try {
                        int[] at = new int[2];
                        root.getLocationInWindow(at);
                        PixelCopy.request(activity.getWindow(), new Rect(at[0], at[1], at[0] + w, at[1] + h), bmp,
                                new PixelCopy.OnPixelCopyFinishedListener() {
                                    @Override
                                    public void onPixelCopyFinished(int result) {
                                        ok[0] = result == PixelCopy.SUCCESS;
                                        done.countDown();
                                    }
                                }, main);
                        return;
                    } catch (Throwable ignored) {
                        // fall back to drawing the view
                    }
                }
                try {
                    Canvas cv = new Canvas(bmp);
                    float f = sw / (float) w;
                    cv.scale(f, f);
                    root.draw(cv);
                    ok[0] = true;
                } catch (Throwable ignored) {
                    ok[0] = false;
                }
                done.countDown();
            }
        });
        try {
            if (!done.await(3, TimeUnit.SECONDS) || !ok[0]) {
                bmp.recycle();
                return null;
            }
        } catch (InterruptedException e) {
            bmp.recycle();
            return null;
        }
        ByteArrayOutputStream bo = new ByteArrayOutputStream(80 * 1024);
        bmp.compress(Bitmap.CompressFormat.JPEG, 62, bo);
        bmp.recycle();
        return bo.toByteArray();
    }

    /** The page a browser is given: the picture, buttons for the remote (and the keyboard's arrows), and the debug text. */
    private String page() {
        String t = token;
        return "<!doctype html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
                + "<title>Telly Addicts live view</title><style>body{margin:0;background:#111;color:#ddd;font:14px sans-serif}"
                + "#s{display:block;width:100%;max-width:1280px;background:#000}"
                + ".k{display:inline-block;margin:3px;padding:10px 16px;background:#333;color:#fff;border:0;border-radius:6px;font-size:16px}"
                + "pre{white-space:pre-wrap;word-break:break-word;padding:8px;font-size:12px}</style></head><body>"
                + "<img id=s alt=''><div id=b></div><pre id=p></pre><script>"
                + "var T='" + t + "',S=document.getElementById('s');"
                + "function nx(){var i=new Image();i.onload=function(){S.src=i.src;setTimeout(nx,120)};i.onerror=function(){setTimeout(nx,1000)};i.src='/screen.jpg?t='+T+'&n='+Date.now()}nx();"
                + "function K(k){fetch('/key?t='+T+'&k='+k)}"
                + "var L=[['Up','ArrowUp'],['Down','ArrowDown'],['Left','ArrowLeft'],['Right','ArrowRight'],['OK','Enter'],['Back','GoBack'],['Guide','Guide'],['Info','Info'],['Red','Red'],['Green','Green'],['Yellow','Yellow'],['Blue','Blue'],['Ch +','ChannelUp'],['Ch -','ChannelDown'],['Play/Pause','MediaPlayPause']];"
                + "L.forEach(function(x){var b=document.createElement('button');b.className='k';b.textContent=x[0];b.onclick=function(){K(x[1])};document.getElementById('b').appendChild(b)});"
                + "var M={ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',Enter:'Enter',Escape:'GoBack',Backspace:'GoBack'};"
                + "document.addEventListener('keydown',function(e){if(M[e.key]){K(M[e.key]);e.preventDefault()}});"
                + "function st(){fetch('/state?t='+T).then(function(r){return r.text()}).then(function(x){document.getElementById('p').textContent=x}).catch(function(){});setTimeout(st,2000)}st();"
                + "</script></body></html>";
    }
}
