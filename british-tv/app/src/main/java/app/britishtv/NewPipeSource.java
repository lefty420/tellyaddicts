package app.britishtv;

import org.schabi.newpipe.extractor.MediaFormat;
import org.schabi.newpipe.extractor.NewPipe;
import org.schabi.newpipe.extractor.ServiceList;
import org.schabi.newpipe.extractor.downloader.Downloader;
import org.schabi.newpipe.extractor.downloader.Request;
import org.schabi.newpipe.extractor.downloader.Response;
import org.schabi.newpipe.extractor.exceptions.ReCaptchaException;
import org.schabi.newpipe.extractor.stream.AudioStream;
import org.schabi.newpipe.extractor.stream.DeliveryMethod;
import org.schabi.newpipe.extractor.stream.StreamInfo;
import org.schabi.newpipe.extractor.stream.VideoStream;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPInputStream;

/**
 * Asks YouTube directly, from this device's own connection, with the NewPipe extractor library (the one the NewPipe and
 * SmartTube apps use, kept up to date by its maintainers whenever YouTube changes something). It is the first source
 * YoutubeResolver tries; the public Piped and Invidious servers stay as the fall-back. Everything here is called on a
 * background thread and any failure, including the library being absent, ends up as an error text in the Result.
 */
final class NewPipeSource {
    private static boolean started = false;

    private NewPipeSource() {
    }

    /** The library asks the network through this: plain HttpURLConnection, no extra dependency. */
    private static final class Dl extends Downloader {
        @Override
        public Response execute(Request request) throws IOException, ReCaptchaException {
            HttpURLConnection c = (HttpURLConnection) new URL(request.url()).openConnection();
            c.setConnectTimeout(10000);
            c.setReadTimeout(15000);
            c.setRequestMethod(request.httpMethod());
            c.setRequestProperty("User-Agent", YoutubeResolver.UA);
            for (Map.Entry<String, List<String>> h : request.headers().entrySet()) {
                boolean first = true;
                for (String v : h.getValue()) {
                    if (first) {
                        c.setRequestProperty(h.getKey(), v);
                        first = false;
                    } else {
                        c.addRequestProperty(h.getKey(), v);
                    }
                }
            }
            byte[] data = request.dataToSend();
            if (data != null) {
                c.setDoOutput(true);
                c.getOutputStream().write(data);
            }
            int code = c.getResponseCode();
            if (code == 429) {
                throw new ReCaptchaException("reCaptcha Challenge requested", request.url());
            }
            InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
            String body = "";
            if (in != null) {
                if ("gzip".equalsIgnoreCase(c.getContentEncoding())) {
                    in = new GZIPInputStream(in);
                }
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] chunk = new byte[16384];
                int n;
                while ((n = in.read(chunk)) > 0) {
                    buf.write(chunk, 0, n);
                }
                in.close();
                body = buf.toString("UTF-8");
            }
            Map<String, List<String>> heads = new HashMap<String, List<String>>();
            for (Map.Entry<String, List<String>> e : c.getHeaderFields().entrySet()) {
                if (e.getKey() != null) {
                    heads.put(e.getKey(), e.getValue());
                }
            }
            return new Response(code, c.getResponseMessage(), heads, body, c.getURL().toString());
        }
    }

    private static synchronized void init() {
        if (!started) {
            NewPipe.init(new Dl());
            started = true;
        }
    }

    /** Blocking. Picks the same way the public servers' answers are picked: a sharper picture-only file with a separate sound file, or the best single file. */
    static YoutubeResolver.Result resolve(String id) {
        YoutubeResolver.Result r = new YoutubeResolver.Result();
        try {
            init();
            StreamInfo info = StreamInfo.getInfo(ServiceList.YouTube, "https://www.youtube.com/watch?v=" + id);
            VideoStream vid = null, mux = null;
            AudioStream aud = null;
            int vh = 0, mh = 0;
            for (VideoStream f : info.getVideoStreams()) {
                if (!plain(f.getDeliveryMethod(), f.isUrl(), f.getFormat(), "mp4")) {
                    continue;
                }
                int h = YoutubeResolver.heightOf(f.getResolution());
                if (mux == null || h > mh) {
                    mux = f;
                    mh = h;
                }
            }
            for (VideoStream f : info.getVideoOnlyStreams()) {
                if (!plain(f.getDeliveryMethod(), f.isUrl(), f.getFormat(), "mp4")) {
                    continue;
                }
                String codec = f.getCodec();
                int h = YoutubeResolver.heightOf(f.getResolution());
                if (h <= 1080 && codec != null && codec.contains("avc1") && (vid == null || h > vh)) {
                    vid = f;
                    vh = h;
                }
            }
            for (AudioStream f : info.getAudioStreams()) {
                if (!plain(f.getDeliveryMethod(), f.isUrl(), f.getFormat(), "m4a")) {
                    continue;
                }
                if (aud == null || f.getAverageBitrate() > aud.getAverageBitrate()) {
                    aud = f;
                }
            }
            if (vid != null && aud != null && (mux == null || vh > mh)) {
                r.video = vid.getContent();
                r.audio = aud.getContent();
                r.height = vh;
                r.label = "NewPipe " + vh + "p picture + sound";
            } else if (mux != null) {
                r.video = mux.getContent();
                r.height = mh;
                r.label = "NewPipe " + mh + "p single file";
            } else {
                r.error = "NewPipe: no mp4 stream (" + info.getVideoStreams().size() + " muxed, " + info.getVideoOnlyStreams().size() + " picture-only, " + info.getAudioStreams().size() + " sound)";
            }
        } catch (Throwable t) {
            r.error = "NewPipe: " + t;
        }
        return r;
    }

    /** A plain file at one address in the wanted container (not a DASH or HLS manifest). */
    private static boolean plain(DeliveryMethod how, boolean isUrl, MediaFormat fmt, String suffix) {
        return how == DeliveryMethod.PROGRESSIVE_HTTP && isUrl && fmt != null && suffix.equalsIgnoreCase(fmt.getSuffix());
    }
}
