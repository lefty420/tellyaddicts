package app.britishtv;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;

/**
 * Lets a phone or computer on the same Wi-Fi hand the TV an addon link, because those links are far too long to
 * type with a remote. Only runs while the "Add from your phone" screen is open. The page asks for the 4-digit code
 * shown on the TV (so nothing else on the network can push a link in), takes one link, and the app collects it.
 */
final class AddonInbox {

    private static final int PORT = 8767;
    private ServerSocket server;
    private volatile String code = "";
    private volatile String pending = "";
    private volatile int wrong = 0;

    private static final String PAGE = "<!doctype html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
            + "<title>Telly Addicts</title><style>body{font:18px system-ui;margin:0;padding:22px;background:#0b1a4a;color:#fff}"
            + "h1{font-size:24px;margin:0 0 6px}p{color:#b9d1ff}input,textarea,button{width:100%;box-sizing:border-box;font:inherit;padding:14px;margin:8px 0;border-radius:10px;border:0}"
            + "textarea{height:130px}button{background:#ffb400;font-weight:700}#m{margin-top:12px;font-weight:700}</style></head><body>"
            + "<h1>Add an addon to your TV</h1><p>Type the 4 digits shown on the TV, then paste the addon link (it ends in manifest.json).</p>"
            + "<form id=f><input name=code inputmode=numeric maxlength=4 placeholder='Code on the TV' autocomplete=off>"
            + "<textarea name=url placeholder='Paste the addon link here' autocapitalize=off autocorrect=off spellcheck=false></textarea>"
            + "<button>Send to TV</button></form><div id=m></div><script>"
            + "var c=location.search.match(/c=(\\d+)/);if(c){f.code.value=c[1]}"
            + "f.onsubmit=function(e){e.preventDefault();var b='code='+encodeURIComponent(f.code.value)+'&url='+encodeURIComponent(f.url.value);"
            + "fetch('/add',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:b}).then(function(r){return r.text()}).then(function(t){m.textContent=t;if(t.indexOf('Sent')==0)f.url.value=''})"
            + ".catch(function(){m.textContent='Could not reach the TV'})}</script></body></html>";

    /** Start listening with this code. Returns the address to open, or "". */
    synchronized String open(String c) {
        code = c == null ? "" : c;
        pending = "";
        wrong = 0;
        try {
            if (server == null) {
                try {
                    server = new ServerSocket(PORT);
                } catch (IOException busy) {
                    server = new ServerSocket(0);
                }
                Thread t = new Thread(this::acceptLoop, "tv-addon-inbox");
                t.setDaemon(true);
                t.start();
            }
            String ip = LogServer.address();
            return ip.isEmpty() ? "" : "http://" + ip + ":" + server.getLocalPort();
        } catch (Exception e) {
            return "";
        }
    }

    /** The link a phone sent, once; "" if none. */
    String take() {
        String p = pending;
        pending = "";
        return p;
    }

    synchronized void stop() {
        code = "";
        pending = "";
        try {
            if (server != null) {
                server.close();
            }
        } catch (IOException ignored) {
            // closing anyway
        }
        server = null;
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
                }, "tv-addon-serve");
                t.setDaemon(true);
                t.start();
            } catch (IOException e) {
                if (server == null) {
                    return;
                }
            }
        }
    }

    private static String line(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        int c;
        while ((c = in.read()) >= 0 && c != '\n') {
            if (c != '\r' && sb.length() < 4096) {
                sb.append((char) c);
            }
        }
        return c < 0 && sb.length() == 0 ? null : sb.toString();
    }

    private void serve(Socket sock) {
        try {
            sock.setSoTimeout(4000);
            InputStream in = sock.getInputStream();
            String req = line(in);
            if (req == null) {
                return;
            }
            int len = 0;
            String h;
            while ((h = line(in)) != null && h.length() > 0) {
                if (h.toLowerCase().startsWith("content-length:")) {
                    try {
                        len = Integer.parseInt(h.substring(15).trim());
                    } catch (NumberFormatException ignored) {
                        len = 0;
                    }
                }
            }
            String body = "", type = "text/plain; charset=utf-8", msg;
            if (req.startsWith("POST /add") && len > 0 && len <= 8192) {
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                byte[] buf = new byte[1024];
                while (bo.size() < len) {
                    int n = in.read(buf, 0, Math.min(buf.length, len - bo.size()));
                    if (n < 0) {
                        break;
                    }
                    bo.write(buf, 0, n);
                }
                String code2 = "", url = "";
                for (String kv : bo.toString("UTF-8").split("&")) {
                    int eq = kv.indexOf('=');
                    if (eq < 0) {
                        continue;
                    }
                    String k = kv.substring(0, eq), v = URLDecoder.decode(kv.substring(eq + 1), "UTF-8").trim();
                    if (k.equals("code")) {
                        code2 = v;
                    } else if (k.equals("url")) {
                        url = v;
                    }
                }
                if (code.isEmpty() || wrong >= 5) {
                    msg = "The TV is not waiting for an addon right now";
                } else if (!code.equals(code2)) {
                    wrong++;
                    msg = "That code is not right";
                } else if (url.length() < 8) {
                    msg = "Paste the addon link first";
                } else {
                    pending = url;
                    msg = "Sent. Look at the TV.";
                }
                body = msg;
            } else {
                body = PAGE;
                type = "text/html; charset=utf-8";
            }
            byte[] b = body.getBytes("UTF-8");
            OutputStream out = sock.getOutputStream();
            out.write(("HTTP/1.1 200 OK\r\nContent-Type: " + type + "\r\nContent-Length: " + b.length
                    + "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
            out.write(b);
            out.flush();
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
}
