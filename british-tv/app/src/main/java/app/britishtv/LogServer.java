package app.britishtv;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Enumeration;

/**
 * Hands the debug log to another device on the home network.
 *
 * A TV has no keyboard and no easy way to get a file off it, so when the user chooses "Share debug log" the log
 * is served as plain text at http://<the TV's address>:8765/ for a phone or computer on the same Wi-Fi to open and
 * copy. Nothing runs until that is chosen, only the log text is ever served, and it stops when the app closes.
 * The address carries a random code (see {@link #newToken}), so only someone shown it on the TV can read the log.
 */
final class LogServer {

    private static final int PORT = 8765;
    private ServerSocket server;
    private volatile String token = "";
    private volatile String text = "";
    /** No code in the address: anyone on the home network can open it. Switched on for now so the debug log can be read without being sent; set false to bring the code back. */
    static volatile boolean open = true;   // the code is switched off for now (it is easy to turn back on): the address is the same every launch

    /** A code for an address that only someone shown it can open: 10 characters, about 49 bits, from SecureRandom. */
    static String newToken() {
        final String abc = "abcdefghjkmnpqrstuvwxyz23456789";     // no 0/o, 1/l/i: it may be typed from the screen
        java.security.SecureRandom r = new java.security.SecureRandom();
        StringBuilder b = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            b.append(abc.charAt(r.nextInt(abc.length())));
        }
        return b.toString();
    }

    /** The value of t= in a request line ("GET /?t=abc HTTP/1.1"), or "". */
    static String tokenIn(String requestLine) {
        String[] parts = requestLine.split(" ");
        if (parts.length < 2) {
            return "";
        }
        int q = parts[1].indexOf('?');
        if (q < 0) {
            return "";
        }
        for (String kv : parts[1].substring(q + 1).split("&")) {
            if (kv.startsWith("t=")) {
                return kv.substring(2);
            }
        }
        return "";
    }

    /** Serve this text from now on. Returns the address to open, or "" if it could not be set up. */
    synchronized String share(String log) {
        text = log == null ? "" : log;
        try {
            if (server == null) {
                token = newToken();
                try {
                    server = new ServerSocket(PORT);
                } catch (IOException busy) {
                    server = new ServerSocket(0);           // that port is taken: any free one will do
                }
                Thread t = new Thread(this::acceptLoop, "tv-log-server");
                t.setDaemon(true);
                t.start();
            }
            String ip = address();
            return ip.isEmpty() ? "" : "http://" + ip + ":" + server.getLocalPort() + (open ? "/" : "/?t=" + token);
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

    private void acceptLoop() {
        while (true) {
            ServerSocket ss = server;
            if (ss == null || ss.isClosed()) {
                return;
            }
            try {
                final Socket sock = ss.accept();
                // each connection on its own thread: a browser opens spare connections that send nothing, and
                // one of those must not hold up the one that is actually asking for the page
                Thread t = new Thread(new Runnable() {
                    @Override
                    public void run() {
                        serve(sock);
                    }
                }, "tv-log-serve");
                t.setDaemon(true);
                t.start();
            } catch (IOException e) {
                if (server == null) {
                    return;                                 // stopped
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
                return;                                     // a spare connection, or an https attempt (plain http only here)
            }
            int eol = head.indexOf("\r");
            boolean allowed = open || !token.isEmpty() && token.equals(tokenIn(head.substring(0, eol < 0 ? head.length() : eol)));
            byte[] body = (allowed ? text : "Open the address shown on the TV, including the part after the question mark.").getBytes("UTF-8");
            OutputStream out = sock.getOutputStream();
            out.write(((allowed ? "HTTP/1.1 200 OK" : "HTTP/1.1 403 Forbidden") + "\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: " + body.length
                    + "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
            out.write(body);
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

    /** The TV's address on the home network (192.168.x.x and the like), or "". */
    static String address() {
        try {
            Enumeration<NetworkInterface> nets = NetworkInterface.getNetworkInterfaces();
            while (nets != null && nets.hasMoreElements()) {
                NetworkInterface n = nets.nextElement();
                if (!n.isUp() || n.isLoopback()) {
                    continue;
                }
                Enumeration<InetAddress> addrs = n.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress a = addrs.nextElement();
                    if (a instanceof Inet4Address && a.isSiteLocalAddress()) {
                        return a.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {
            // no network to speak of
        }
        return "";
    }
}
