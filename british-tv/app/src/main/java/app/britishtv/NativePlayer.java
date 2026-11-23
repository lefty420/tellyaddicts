package app.britishtv;

import android.content.Context;
import android.graphics.Bitmap;
import android.util.Base64;
import android.os.Handler;
import android.os.Looper;
import android.view.SurfaceView;
import android.view.View;

import androidx.media3.common.C;
import androidx.media3.common.Format;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.TrackSelectionOverride;
import androidx.media3.common.TrackSelectionParameters;
import androidx.media3.common.Tracks;
import androidx.media3.common.VideoSize;
import androidx.media3.common.text.Cue;
import androidx.media3.common.text.CueGroup;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.DefaultRenderersFactory;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.exoplayer.source.MediaSource;
import androidx.media3.exoplayer.source.MergingMediaSource;
import androidx.media3.exoplayer.source.ProgressiveMediaSource;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.Locale;

/**
 * The backup player. The page plays video in the web view's own player; a file with sound that player cannot decode
 * (AC3, E-AC3, DTS, TrueHD, mostly in .mkv) or that it will not open is handed here instead. This is Media3's ExoPlayer
 * with the FFmpeg audio decoders added, drawing on a surface behind the (transparent) web page. The page keeps talking
 * to it through player.js, which makes it look like the ordinary video element: state flows back as small calls to
 * window.__np(generation, type, a, b, c).
 *
 * Everything here runs on the main thread; the bridge methods post to it.
 */
final class NativePlayer {
    interface Sink {
        void js(String script);
    }

    private static final int TICK_MS = 250;
    /** A YouTube stream that has not started by then is given up on and the next server is tried. */
    private static final long YT_START_MS = 12000;
    /** How many servers are tried for one YouTube video before giving up. Raise this if too many fail. */
    private static final int YT_TRIES = 5;

    private final Context ctx;
    private final SurfaceView surface;
    private final Sink sink;
    private final Handler main = new Handler(Looper.getMainLooper());
    private ExoPlayer player;
    private int gen;
    private boolean readySent;
    private boolean muted;
    private int width, height;
    // YouTube: the video being looked up, the attempts so far, the servers whose stream never started, and the server in use
    private String ytId;
    private long ytStartMs;
    private int ytTry;
    private String ytServer;
    private final java.util.HashSet<String> ytFailed = new java.util.HashSet<String>();
    private final Runnable ytWatch = new Runnable() {
        @Override
        public void run() {
            // the stream did not start in time: this server is skipped, and the next one is tried
            if (ytServer == null || readySent || player == null) {
                return;
            }
            final String bad = ytServer;
            ytServer = null;
            YoutubeResolver.markBad(bad);
            ytFailed.add(bad);
            release();
            if (ytTry >= YT_TRIES) {
                send("error", "YouTube " + ytId + ": none of " + YT_TRIES + " servers started it (" + ytFailed + ")");
                return;
            }
            send("note", "YouTube " + ytId + ": " + bad + " did not start in " + (YT_START_MS / 1000) + " s, trying another server");
            ytAttempt(gen);
        }
    };
    // the viewer's choices, kept from programme to programme: a sound language (null = the file's own choice) and a
    // subtitle language ("" = only the file's forced/default ones, "off" = none, "any" = whichever there is)
    // English unless the viewer has picked another sound language: a file that lists Turkish or Portuguese first otherwise plays that
    private String prefAudio = "en", prefText = "";

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (player == null) {
                return;
            }
            send("time", player.getCurrentPosition(), player.getBufferedPosition(), player.isPlaying() ? 1 : 0);
            main.postDelayed(this, TICK_MS);
        }
    };

    NativePlayer(Context ctx, SurfaceView surface, Sink sink) {
        this.ctx = ctx;
        this.surface = surface;
        this.sink = sink;
    }

    // ---------------------------------------------------------------- called from the bridge (any thread)

    void open(final String url, final long startMs, final int generation) {
        main.post(new Runnable() {
            @Override
            public void run() {
                start(url, startMs, generation);
            }
        });
    }

    void play() {
        main.post(new Runnable() {
            @Override
            public void run() {
                if (player != null) {
                    player.setPlayWhenReady(true);
                }
            }
        });
    }

    void pause() {
        main.post(new Runnable() {
            @Override
            public void run() {
                if (player != null) {
                    player.setPlayWhenReady(false);
                }
            }
        });
    }

    void seek(final long ms) {
        main.post(new Runnable() {
            @Override
            public void run() {
                if (player != null) {
                    player.seekTo(Math.max(0, ms));
                }
            }
        });
    }

    void mute(final boolean m) {
        main.post(new Runnable() {
            @Override
            public void run() {
                muted = m;
                if (player != null) {
                    player.setVolume(m ? 0f : 1f);
                }
            }
        });
    }

    void prefs(final String audioLang, final String textLang) {
        main.post(new Runnable() {
            @Override
            public void run() {
                prefAudio = audioLang == null || audioLang.isEmpty() ? "en" : audioLang;
                prefText = textLang == null ? "" : textLang;
            }
        });
    }

    /**
     * Picks one sound or subtitle track, by its place in the list sent with "tracks". kind is "audio" or "text";
     * group -1 turns subtitles off.
     */
    void select(final String kind, final int group, final int track) {
        main.post(new Runnable() {
            @Override
            public void run() {
                if (player == null) {
                    return;
                }
                int type = "audio".equals(kind) ? C.TRACK_TYPE_AUDIO : C.TRACK_TYPE_TEXT;
                TrackSelectionParameters.Builder b = player.getTrackSelectionParameters().buildUpon();
                if (group < 0) {
                    b.clearOverridesOfType(type).setTrackTypeDisabled(type, true);
                } else {
                    java.util.List<Tracks.Group> gs = player.getCurrentTracks().getGroups();
                    if (group >= gs.size() || track >= gs.get(group).length || gs.get(group).getType() != type) {
                        return;      // the tracks changed under the menu
                    }
                    b.setTrackTypeDisabled(type, false)
                            .setOverrideForType(new TrackSelectionOverride(gs.get(group).getMediaTrackGroup(), track));
                }
                player.setTrackSelectionParameters(b.build());
                if (type == C.TRACK_TYPE_TEXT) {
                    send("cues", "[]");
                }
            }
        });
    }

    void stop() {
        main.post(new Runnable() {
            @Override
            public void run() {
                gen = -1;      // a YouTube lookup still under way must not start playing after this
                release();
            }
        });
    }

    // ---------------------------------------------------------------- main thread

    private void start(final String url, final long startMs, final int generation) {
        release();
        gen = generation;
        readySent = false;
        width = 0;
        height = 0;
        ytId = null;
        ytServer = null;
        if (url.startsWith("yt:")) {
            // a YouTube video: look the stream up first (off the main thread), then play it
            ytId = url.substring(3);
            ytStartMs = startMs;
            ytTry = 0;
            ytServer = null;
            ytFailed.clear();
            ytAttempt(generation);
            return;
        }
        begin(url, null, "TellyAddicts", startMs, generation);
    }

    /** One try at a YouTube video: ask the servers that have not failed yet, then play the first stream that answers. */
    private void ytAttempt(final int generation) {
        ytTry++;
        final String id = ytId;
        final long startMs = ytStartMs;
        final java.util.HashSet<String> skip = new java.util.HashSet<String>(ytFailed);
        new Thread(new Runnable() {
            @Override
            public void run() {
                final YoutubeResolver.Result r = YoutubeResolver.resolve(id, skip);
                main.post(new Runnable() {
                    @Override
                    public void run() {
                        if (generation != gen) {
                            return;      // another programme was chosen while this was being looked up
                        }
                        if (r.error != null) {
                            send("error", "YouTube " + id + ": " + r.error + " (try " + ytTry + " of " + YT_TRIES + ")");
                            return;
                        }
                        ytServer = r.server;
                        readySent = false;
                        width = 0;
                        height = 0;
                        send("note", r.label + " (try " + ytTry + " of " + YT_TRIES + ")");
                        begin(r.video, r.audio, YoutubeResolver.UA, startMs, generation);
                        main.removeCallbacks(ytWatch);
                        main.postDelayed(ytWatch, YT_START_MS);
                    }
                });
            }
        }, "yt-resolve").start();
    }

    /** Opens a stream: one address, or a picture file and a sound file joined together (audioUrl may be null). */
    private void begin(String url, String audioUrl, String userAgent, long startMs, int generation) {
        try {
            DefaultRenderersFactory renderers = new DefaultRenderersFactory(ctx)
                    .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_ON);
            DefaultHttpDataSource.Factory http = new DefaultHttpDataSource.Factory()
                    .setUserAgent(userAgent)
                    .setConnectTimeoutMs(20000)
                    .setReadTimeoutMs(30000)
                    .setAllowCrossProtocolRedirects(true);
            player = new ExoPlayer.Builder(ctx, renderers)
                    .setMediaSourceFactory(new DefaultMediaSourceFactory(http))
                    .build();
            player.setVideoSurfaceView(surface);
            TrackSelectionParameters.Builder tp = player.getTrackSelectionParameters().buildUpon()
                    .setPreferredAudioLanguage(prefAudio)
                    .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, "off".equals(prefText));
            if ("any".equals(prefText)) {
                tp.setPreferredTextLanguage(Locale.getDefault().getLanguage()).setSelectUndeterminedTextLanguage(true);
            } else if (!prefText.isEmpty() && !"off".equals(prefText)) {
                tp.setPreferredTextLanguage(prefText);
            }
            player.setTrackSelectionParameters(tp.build());
            player.setVolume(muted ? 0f : 1f);
            player.addListener(new Listener(generation));
            if (audioUrl != null) {
                ProgressiveMediaSource.Factory pf = new ProgressiveMediaSource.Factory(http);
                MediaSource pic = pf.createMediaSource(MediaItem.fromUri(url));
                MediaSource snd = pf.createMediaSource(MediaItem.fromUri(audioUrl));
                player.setMediaSource(new MergingMediaSource(pic, snd), Math.max(0, startMs));
            } else {
                player.setMediaItem(MediaItem.fromUri(url), Math.max(0, startMs));
            }
            player.setPlayWhenReady(true);
            player.prepare();
            surface.setVisibility(View.VISIBLE);
            main.removeCallbacks(tick);
            main.postDelayed(tick, TICK_MS);
        } catch (Throwable t) {
            release();
            send("error", "backup player: " + t);
        }
    }

    private void release() {
        main.removeCallbacks(tick);
        main.removeCallbacks(ytWatch);
        if (player != null) {
            try {
                player.release();
            } catch (Throwable ignored) {
                // already gone
            }
            player = null;
        }
        surface.setVisibility(View.GONE);
    }

    private void send(String type, Object a) {
        send(type, a, 0, 0);
    }

    private void send(String type, Object a, Object b, Object c) {
        sink.js("window.__np&&window.__np(" + gen + "," + JSONObject.quote(type) + "," + arg(a) + "," + arg(b) + "," + arg(c) + ")");
    }

    private static String arg(Object o) {
        return o instanceof String ? JSONObject.quote((String) o) : String.valueOf(o);
    }

    private final class Listener implements Player.Listener {
        private final int mine;

        Listener(int mine) {
            this.mine = mine;
        }

        @Override
        public void onPlaybackStateChanged(int state) {
            if (mine != gen || player == null) {
                return;
            }
            if (state == Player.STATE_READY) {
                if (!readySent) {
                    readySent = true;
                    long d = player.getDuration();
                    send("ready", d < 0 ? 0 : d, width, height);
                }
                if (player.isPlaying()) {
                    send("playing", 0);
                }
            } else if (state == Player.STATE_BUFFERING) {
                send("waiting", 0);
            } else if (state == Player.STATE_ENDED) {
                send("ended", 0);
            }
        }

        @Override
        public void onIsPlayingChanged(boolean isPlaying) {
            if (mine != gen || player == null) {
                return;
            }
            if (isPlaying) {
                send("playing", 0);
            } else if (player.getPlaybackState() == Player.STATE_READY && !player.getPlayWhenReady()) {
                send("paused", 0);
            }
        }

        @Override
        public void onVideoSizeChanged(VideoSize size) {
            width = size.width;
            height = size.height;
        }

        @Override
        public void onPositionDiscontinuity(Player.PositionInfo oldPos, Player.PositionInfo newPos, int reason) {
            if (mine == gen && reason == Player.DISCONTINUITY_REASON_SEEK) {
                send("seeked", newPos.positionMs);
            }
        }

        @Override
        public void onTracksChanged(Tracks tracks) {
            if (mine != gen) {
                return;
            }
            JSONArray out = new JSONArray();
            try {
                java.util.List<Tracks.Group> gs = tracks.getGroups();
                for (int g = 0; g < gs.size(); g++) {
                    Tracks.Group grp = gs.get(g);
                    int type = grp.getType();
                    if (type != C.TRACK_TYPE_AUDIO && type != C.TRACK_TYPE_TEXT) {
                        continue;
                    }
                    for (int i = 0; i < grp.length; i++) {
                        if (!grp.isTrackSupported(i)) {
                            continue;      // a sound this device cannot decode, or a subtitle format with no decoder
                        }
                        Format f = grp.getTrackFormat(i);
                        JSONObject o = new JSONObject();
                        o.put("k", type == C.TRACK_TYPE_AUDIO ? "audio" : "text");
                        o.put("g", g);
                        o.put("i", i);
                        o.put("on", grp.isTrackSelected(i));
                        if (f.label != null) o.put("label", f.label);
                        if (f.language != null) o.put("lang", f.language);
                        if (f.sampleMimeType != null) o.put("mime", f.sampleMimeType);
                        if (f.channelCount > 0) o.put("ch", f.channelCount);
                        if ((f.selectionFlags & C.SELECTION_FLAG_FORCED) != 0) o.put("forced", true);
                        if ((f.roleFlags & (C.ROLE_FLAG_DESCRIBES_VIDEO | C.ROLE_FLAG_DESCRIBES_MUSIC_AND_SOUND)) != 0) o.put("desc", true);
                        out.put(o);
                    }
                }
            } catch (Exception ignored) {
                // a JSON put that cannot fail
            }
            send("tracks", out.toString());
        }

        /** Subtitles are drawn by the page, so they look like the rest of the app: text as it is, pictures (DVD/Blu-ray) as PNGs. */
        @Override
        public void onCues(CueGroup cues) {
            if (mine != gen) {
                return;
            }
            JSONArray out = new JSONArray();
            try {
                for (Cue c : cues.cues) {
                    JSONObject o = new JSONObject();
                    if (c.bitmap != null) {
                        ByteArrayOutputStream png = new ByteArrayOutputStream();
                        c.bitmap.compress(Bitmap.CompressFormat.PNG, 100, png);
                        o.put("img", "data:image/png;base64," + Base64.encodeToString(png.toByteArray(), Base64.NO_WRAP));
                        o.put("x", c.position == Cue.DIMEN_UNSET ? 0.5 : c.position);
                        o.put("y", c.line == Cue.DIMEN_UNSET ? 0.85 : c.line);
                        o.put("w", c.size == Cue.DIMEN_UNSET ? 0.5 : c.size);
                        o.put("ax", c.positionAnchor);
                        o.put("ay", c.lineAnchor);
                    } else if (c.text != null && c.text.length() > 0) {
                        o.put("t", c.text.toString());
                    } else {
                        continue;
                    }
                    out.put(o);
                }
            } catch (Exception ignored) {
                // a JSON put that cannot fail
            }
            send("cues", out.toString());
        }

        @Override
        public void onPlayerError(PlaybackException error) {
            if (mine != gen) {
                return;
            }
            if (ytServer != null && !readySent) {
                // a YouTube server refused the stream before it started: try the next one, as for a stall
                main.removeCallbacks(ytWatch);
                main.post(ytWatch);
                return;
            }
            send("error", error.getErrorCodeName() + (error.getMessage() != null ? ": " + error.getMessage() : ""));
        }
    }
}
