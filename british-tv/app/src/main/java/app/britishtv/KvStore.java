package app.britishtv;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.Charset;

/**
 * Files for what the page saves in bulk (channel lists, episode guides, artwork answers).
 *
 * The page's own storage holds about 5 million characters in all, which 28 channels fill. A file has no such limit,
 * and reading one back is faster than parsing the whole of that storage at start-up. Each key is one file in the
 * app's private folder; the name is the key, URL-encoded. Writes go to a temporary file and are renamed into place,
 * so a crash or a full disk never leaves half a list behind. Nothing here is precious: everything kept is fetched
 * or built again if it goes missing.
 */
final class KvStore {

    private static final Charset UTF8 = Charset.forName("UTF-8");
    private static final String SUFFIX = ".kv";
    private final File dir;

    KvStore(File parent) {
        dir = new File(parent, "kv");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
    }

    private File file(String key) {
        try {
            String name = URLEncoder.encode(key, "UTF-8");
            if (name.length() > 180) {                       // keep clear of the file-name limit
                name = name.substring(0, 120) + "~" + Integer.toHexString(key.hashCode());
            }
            return new File(dir, name + SUFFIX);
        } catch (Exception e) {
            return new File(dir, "bad" + Integer.toHexString(String.valueOf(key).hashCode()) + SUFFIX);
        }
    }

    /** The saved text, or null if there is none. */
    String get(String key) {
        File f = file(key);
        if (!f.isFile()) {
            return null;
        }
        try (InputStream in = new FileInputStream(f)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream((int) Math.max(64, f.length()));
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
            }
            return new String(out.toByteArray(), UTF8);
        } catch (IOException e) {
            return null;
        }
    }

    boolean set(String key, String value) {
        if (key == null || value == null) {
            return false;
        }
        File f = file(key), tmp = new File(dir, f.getName() + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(value.getBytes(UTF8));
            out.getFD().sync();
        } catch (IOException e) {
            //noinspection ResultOfMethodCallIgnored
            tmp.delete();
            return false;
        }
        if (!tmp.renameTo(f)) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
            if (!tmp.renameTo(f)) {
                //noinspection ResultOfMethodCallIgnored
                tmp.delete();
                return false;
            }
        }
        return true;
    }

    void remove(String key) {
        //noinspection ResultOfMethodCallIgnored
        file(key).delete();
    }

    /** Every saved key, one per line. */
    String keys() {
        File[] all = dir.listFiles();
        if (all == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (File f : all) {
            String n = f.getName();
            if (!n.endsWith(SUFFIX)) {
                if (n.endsWith(".tmp")) {                    // left over from an interrupted write
                    //noinspection ResultOfMethodCallIgnored
                    f.delete();
                }
                continue;
            }
            try {
                String key = URLDecoder.decode(n.substring(0, n.length() - SUFFIX.length()), "UTF-8");
                if (n.indexOf('~') >= 0) {
                    continue;                                // a shortened name cannot be turned back into its key
                }
                sb.append(key).append('\n');
            } catch (Exception ignored) {
                // an odd file name: skip it
            }
        }
        return sb.toString();
    }
}
