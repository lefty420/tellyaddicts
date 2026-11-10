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
 */
final class LogServer {

    private static final int PORT = 8765;
    private ServerSocket server;
    private volatile String text = "";

    /** Serve this text from now on. Returns the address to open, or "" if it could not be set up. */
    synchronized String share(String log) {
        text = log == null ? "" : log;
        try {
            if (server == null) {
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
            return ip.isEmpty() ? "" : "http://" + ip + ":" + server.getLocalPort();
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
            try (Socket sock = ss.accept()) {
                sock.setSoTimeout(5000);
                InputStream in = sock.getInputStream();
                int c, run = 0, read = 0;
                while (run < 4 && read < 8192 && (c = in.read()) >= 0) {      // the request itself is not needed
                    read++;
                    run = (c == '\r' || c == '\n') ? run + 1 : 0;
                }
                byte[] body = text.getBytes("UTF-8");
                OutputStream out = sock.getOutputStream();
                out.write(("HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: " + body.length
                        + "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
                out.write(body);
                out.flush();
            } catch (IOException e) {
                if (server == null) {
                    return;                                 // stopped
                }
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
