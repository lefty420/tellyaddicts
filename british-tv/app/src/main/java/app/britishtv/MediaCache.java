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
    /** What the cache has been doing, newest last: kept for the debug log the user can send. */
    private final java.util.ArrayDeque<String> notes = new java.util.ArrayDeque<>();

    void note(String text) {
        java.util.Calendar c = java.util.Calendar.getInstance();
        String at = String.format(Locale.UK, "%02d:%02d:%02d", c.get(java.util.Calendar.HOUR_OF_DAY),
                c.get(java.util.Calendar.MINUTE), c.get(java.util.Calendar.SECOND));
        synchronized (notes) {
            notes.addLast(at + " " + text);
            while (notes.size() > 200) {
                notes.removeFirst();
            }
        }
    }

    String log() {
        StringBuilder b = new StringBuilder();
        synchronized (notes) {
            for (String n : notes) {
                b.append(n).append('\n');
            }
        }
        return b.toString();
    }

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
            Session s = new Session(this, url, budget, new File(dir, "p" + (++token) + ".bin"));
            note("buffer " + (budget >> 20) + " MB for " + url);
            s.begin(0);
            live = s;
            return "http://127.0.0.1:" + port + "/" + token;
        } catch (Exception e) {
            note("could not start: " + e);
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
        /** A request this close beyond what is held is waited for; one further away restarts the download there. */
        private static final long NEAR = 4L * 1024 * 1024;
        private final MediaCache owner;
        private volatile int gen;                           // goes up each time the download restarts somewhere else
        private final String url;
        private final long budget;
        final File file;
        private volatile long base;                         // the byte the file starts at
        private volatile long have;                         // bytes written after base
        private volatile long reached;                      // furthest byte handed to the player
        private volatile long total = -1;                   // the whole file, once the server says
        private volatile boolean dead;
        private volatile String type;                       // what archive.org says the file is, handed on to the player as it is
        private Thread puller;

        Session(MediaCache owner, String url, long budget, File file) {
            this.owner = owner;
            this.url = url;
            this.budget = budget;
            this.file = file;
        }

        /** (Re)start downloading at a byte, throwing away anything already kept. */
        synchronized void begin(long at) {
            stopPulling();
            //noinspection ResultOfMethodCallIgnored
            file.delete();
            gen++;
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
                int status;
                // archive.org's servers answer 500, 502 or 503 now and then, and the same file is fine a moment later
                // (seen in the debug log: Bananaman, News 24 and others all failed in the same minutes and then
                // answered normally). Ask again a couple of times before giving up on it.
                for (int attempt = 0; ; attempt++) {
                    c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(15000);
                    c.setReadTimeout(30000);
                    c.setRequestProperty("User-Agent", "BritishTV/1.0 (Android TV)");
                    if (base > 0) {
                        c.setRequestProperty("Range", "bytes=" + base + "-");
                    }
                    status = c.getResponseCode();
                    if (status < 500 || attempt >= 2 || dead || puller != me) {
                        break;
                    }
                    owner.note("archive.org answered " + status + ", trying again (" + (attempt + 1) + " of 2)");
                    c.disconnect();
                    try {
                        Thread.sleep(1500L * (attempt + 1));
                    } catch (InterruptedException e) {
                        return;
                    }
                }
                String ct = c.getHeaderField("Content-Type");
                if (ct != null) {
                    type = ct.split(";")[0].trim().toLowerCase();
                }
                owner.note("archive.org answered " + status + " from byte " + base
                        + (c.getHeaderField("Content-Type") != null ? " (" + c.getHeaderField("Content-Type") + ")" : ""));
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
                        if (puller != me) {
                            break;                          // replaced while reading: these bytes belong to the old file
                        }
                        have += n;
                        notifyAll();
                    }
                    // stay the agreed distance ahead of the picture, no further
                    while (puller == me && !dead && base + have - reached > budget) {
                        Thread.sleep(120);
                    }
                }
            } catch (Exception e) {
                // the connection dropped, or this download was replaced: whatever is already kept still plays
                if (puller == me && !dead) {
                    owner.note("download stopped at byte " + (base + have) + ": " + e);
                }
            } finally {
                if (c != null) {
                    c.disconnect();
                }
                synchronized (this) {
                    notifyAll();
                }
            }
        }

        /**
         * Serve a byte range, waiting for the download to reach it.
         *
         * The download only runs a set distance ahead of the picture, so a request far beyond what is held would
         * wait for ever: joining a long programme part-way through, or a file whose index is at its end, both ask
         * for exactly that. Such a request restarts the download where the player wants it instead.
         */
        void send(Socket sock, long from, long to, boolean ranged) throws IOException {
            int g;
            synchronized (this) {
                if (total >= 0 && from >= total) {
                    write(sock, "HTTP/1.1 416 Range Not Satisfiable\r\nContent-Range: bytes */" + total
                            + "\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                    return;
                }
                if (from < base || from > base + have + NEAR) {
                    owner.note("player asked for byte " + from + ", held " + base + "-" + (base + have) + ": restarting there");
                    begin(from);
                }
                g = gen;
            }
            if (!await(from, g)) {
                if (gen == g) {
                    owner.note("nothing to give the player at byte " + from + " (503)");
                }
                write(sock, "HTTP/1.1 503 Service Unavailable\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                return;
            }
            long end = (to >= 0 && (total < 0 || to < total)) ? to : (total >= 0 ? total - 1 : Long.MAX_VALUE);
            StringBuilder h = new StringBuilder();
            h.append(ranged ? "HTTP/1.1 206 Partial Content\r\n" : "HTTP/1.1 200 OK\r\n");
            h.append("Content-Type: ").append(type != null && type.startsWith("video/") ? type : "video/mp4")
                    .append("\r\nAccept-Ranges: bytes\r\nConnection: close\r\n");
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
                    if (!await(at, g)) {
                        return;                             // nothing more is coming, or the download moved elsewhere
                    }
                    long pos;
                    int want;
                    synchronized (this) {
                        if (gen != g) {
                            return;
                        }
                        long ready = base + have - at;
                        if (ready <= 0) {
                            return;
                        }
                        want = (int) Math.min(buf.length, Math.min(ready, end - at + 1));
                        pos = at - base;
                    }
                    raf.seek(pos);
                    int got = raf.read(buf, 0, want);
                    if (got <= 0) {
                        return;
                    }
                    os.write(buf, 0, got);
                    at += got;
                    if (gen == g) {
                        reached = Math.max(reached, at);
                    }
                }
                os.flush();
            }
        }

        /** Wait until a byte has been downloaded. False if it never will be, or the download has moved elsewhere. */
        private synchronized boolean await(long at, int g) {
            while (!dead && gen == g && base + have <= at) {
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
            return !dead && gen == g;
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
