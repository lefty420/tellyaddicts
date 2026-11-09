package app.britishtv;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.util.Locale;

/**
 * Keeps the programme being watched a little ahead of the picture.
 *
 * The file is downloaded into the app's cache and served to the WebView from 127.0.0.1, so a slow spell at
 * archive.org empties the buffer instead of stopping the picture. One programme is held at a time and the file is
 * deleted as soon as something else starts, so nothing is kept after watching.
 *
 * Everything here fails safe: if the server cannot start, or the download cannot, {@link #start} returns null and
 * the page is given the archive.org address to play directly, exactly as before.
 */
final class MediaCache {

    private final File dir;
    private ServerSocket server;
    private int port;
    private volatile Session live;
    private long token;

    MediaCache(File cacheDir) {
        dir = new File(cacheDir, "media");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        clean();
    }

    /** Start buffering a programme. Returns the address for the page to play, or null to play the original. */
    synchronized String start(String url, long budget) {
        release();
        if (url == null || budget <= 0) {
            return null;
        }
        try {
            if (server == null) {
                server = new ServerSocket(0, 4, InetAddress.getByName("127.0.0.1"));
                port = server.getLocalPort();
                Thread accept = new Thread(this::acceptLoop, "tv-cache-accept");
                accept.setDaemon(true);
                accept.start();
            }
            Session s = new Session(url, budget, new File(dir, "p" + (++token) + ".bin"));
            s.begin(0);
            live = s;
            return "http://127.0.0.1:" + port + "/" + token;
        } catch (Exception e) {
            release();
            return null;                                    // play the original instead
        }
    }

    /** Stop buffering and delete what was kept. */
    synchronized void release() {
        Session s = live;
        live = null;
        if (s != null) {
            s.close();
        }
        clean();
    }

    synchronized void shutdown() {
        release();
        try {
            if (server != null) {
                server.close();
            }
        } catch (IOException ignored) {
            // closing anyway
        }
        server = null;
    }

    private void clean() {
        File[] old = dir.listFiles();
        if (old == null) {
            return;
        }
        Session s = live;
        for (File f : old) {
            if (s == null || !f.equals(s.file)) {
                //noinspection ResultOfMethodCallIgnored
                f.delete();
            }
        }
    }

    // ------------------------------------------------------------------ serving

    private void acceptLoop() {
        while (true) {
            ServerSocket ss = server;
            if (ss == null || ss.isClosed()) {
                return;
            }
            try {
                Socket sock = ss.accept();
                Thread t = new Thread(() -> serve(sock), "tv-cache-serve");
                t.setDaemon(true);
                t.start();
            } catch (IOException e) {
                return;                                     // the server was closed
            }
        }
    }

    private void serve(Socket sock) {
        try {
            sock.setTcpNoDelay(true);
            StringBuilder head = new StringBuilder();
            InputStream in = sock.getInputStream();
            int c, run = 0;
            while (run < 4 && head.length() < 8192 && (c = in.read()) >= 0) {
                head.append((char) c);
                run = (c == '\r' || c == '\n') ? run + 1 : 0;
            }
            String request = head.toString();
            Session s = live;
            if (s == null || !request.startsWith("GET ")) {
                write(sock, "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                return;
            }
            long from = 0, to = -1;
            int r = request.toLowerCase(Locale.UK).indexOf("range: bytes=");
            if (r >= 0) {
                String spec = request.substring(r + 13, request.indexOf('\r', r)).trim();
                int dash = spec.indexOf('-');
                if (dash > 0) {
                    from = parse(spec.substring(0, dash), 0);
                }
                if (dash >= 0 && dash + 1 < spec.length()) {
                    to = parse(spec.substring(dash + 1), -1);
                }
            }
            s.send(sock, from, to, r >= 0);
        } catch (Exception ignored) {
            // the player closed the connection, or we are being torn down
        } finally {
            try {
                sock.close();
            } catch (IOException ignored) {
                // nothing to do
            }
        }
    }

    private static long parse(String s, long fallback) {
        try {
            return Long.parseLong(s.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private static void write(Socket sock, String text) throws IOException {
        sock.getOutputStream().write(text.getBytes("UTF-8"));
        sock.getOutputStream().flush();
    }

    // ------------------------------------------------------------------ one programme

    private static final class Session {
        private final String url;
        private final long budget;
        final File file;
        private volatile long base;                         // the byte the file starts at
        private volatile long have;                         // bytes written after base
        private volatile long reached;                      // furthest byte handed to the player
        private volatile long total = -1;                   // the whole file, once the server says
        private volatile boolean dead;
        private Thread puller;

        Session(String url, long budget, File file) {
            this.url = url;
            this.budget = budget;
            this.file = file;
        }

        /** (Re)start downloading at a byte, throwing away anything already kept. */
        synchronized void begin(long at) {
            stopPulling();
            //noinspection ResultOfMethodCallIgnored
            file.delete();
            base = at;
            have = 0;
            reached = at;
            puller = new Thread(this::pull, "tv-cache-pull");
            puller.setDaemon(true);
            puller.start();
        }

        private void stopPulling() {
            Thread t = puller;
            puller = null;
            if (t != null) {
                t.interrupt();
            }
        }

        private void pull() {
            Thread me = Thread.currentThread();
            HttpURLConnection c = null;
            try (FileOutputStream out = new FileOutputStream(file)) {
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(30000);
                c.setRequestProperty("User-Agent", "BritishTV/1.0 (Android TV)");
                if (base > 0) {
                    c.setRequestProperty("Range", "bytes=" + base + "-");
                }
                int status = c.getResponseCode();
                if (status != 200 && status != 206) {
                    return;
                }
                long len = c.getHeaderFieldLong("Content-Length", -1);
                String cr = c.getHeaderField("Content-Range");
                if (cr != null && cr.contains("/")) {
                    total = parse(cr.substring(cr.indexOf('/') + 1), -1);
                } else if (len >= 0 && base == 0) {
                    total = len;
                }
                InputStream in = c.getInputStream();
                byte[] buf = new byte[64 * 1024];
                int n;
                while (puller == me && !dead && (n = in.read(buf)) > 0) {
                    out.write(buf, 0, n);
                    out.flush();
                    synchronized (this) {
                        have += n;
                        notifyAll();
                    }
                    // stay the agreed distance ahead of the picture, no further
                    while (puller == me && !dead && base + have - reached > budget) {
                        Thread.sleep(120);
                    }
                }
            } catch (Exception ignored) {
                // the connection dropped, or this download was replaced: whatever is already kept still plays
            } finally {
                if (c != null) {
                    c.disconnect();
                }
                synchronized (this) {
                    notifyAll();
                }
            }
        }

        /** Serve a byte range, waiting for the download to reach it. */
        void send(Socket sock, long from, long to, boolean ranged) throws IOException {
            if (from < base || (total >= 0 && from >= total)) {
                begin(from);                                // a seek outside what we hold: fetch from there
            }
            if (!await(from)) {
                write(sock, "HTTP/1.1 503 Service Unavailable\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                return;
            }
            long end = (to >= 0 && (total < 0 || to < total)) ? to : (total >= 0 ? total - 1 : Long.MAX_VALUE);
            StringBuilder h = new StringBuilder();
            h.append(ranged ? "HTTP/1.1 206 Partial Content\r\n" : "HTTP/1.1 200 OK\r\n");
            h.append("Content-Type: video/mp4\r\nAccept-Ranges: bytes\r\nConnection: close\r\n");
            if (total >= 0) {
                h.append("Content-Length: ").append(end - from + 1).append("\r\n");
                if (ranged) {
                    h.append("Content-Range: bytes ").append(from).append('-').append(end)
                            .append('/').append(total).append("\r\n");
                }
            }
            h.append("\r\n");
            write(sock, h.toString());

            OutputStream os = sock.getOutputStream();
            try (RandomAccessFile raf = new RandomAccessFile(file, "r")) {
                byte[] buf = new byte[64 * 1024];
                long at = from;
                while (!dead && at <= end) {
                    if (!await(at)) {
                        return;                             // nothing more is coming
                    }
                    long ready = base + have - at;
                    if (ready <= 0) {
                        return;
                    }
                    int want = (int) Math.min(buf.length, Math.min(ready, end - at + 1));
                    raf.seek(at - base);
                    int got = raf.read(buf, 0, want);
                    if (got <= 0) {
                        return;
                    }
                    os.write(buf, 0, got);
                    at += got;
                    reached = Math.max(reached, at);
                }
                os.flush();
            }
        }

        /** Wait until a byte has been downloaded. False if it never will be. */
        private synchronized boolean await(long at) {
            while (!dead && base + have <= at) {
                if (puller == null || !puller.isAlive()) {
                    return base + have > at;
                }
                try {
                    wait(250);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return false;
                }
            }
            return !dead;
        }

        void close() {
            dead = true;
            stopPulling();
            synchronized (this) {
                notifyAll();
            }
            //noinspection ResultOfMethodCallIgnored
            file.delete();
        }
    }
}
