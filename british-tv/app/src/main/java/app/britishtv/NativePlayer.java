package app.britishtv;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.view.SurfaceView;
import android.view.View;

import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.VideoSize;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.DefaultRenderersFactory;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;

import org.json.JSONObject;

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

    private final Context ctx;
    private final SurfaceView surface;
    private final Sink sink;
    private final Handler main = new Handler(Looper.getMainLooper());
    private ExoPlayer player;
    private int gen;
    private boolean readySent;
    private boolean muted;
    private int width, height;

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

    void stop() {
        main.post(new Runnable() {
            @Override
            public void run() {
                release();
            }
        });
    }

    // ---------------------------------------------------------------- main thread

    private void start(String url, long startMs, int generation) {
        release();
        gen = generation;
        readySent = false;
        width = 0;
        height = 0;
        try {
            DefaultRenderersFactory renderers = new DefaultRenderersFactory(ctx)
                    .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_ON);
            DefaultHttpDataSource.Factory http = new DefaultHttpDataSource.Factory()
                    .setUserAgent("TellyAddicts")
                    .setConnectTimeoutMs(20000)
                    .setReadTimeoutMs(30000)
                    .setAllowCrossProtocolRedirects(true);
            player = new ExoPlayer.Builder(ctx, renderers)
                    .setMediaSourceFactory(new DefaultMediaSourceFactory(http))
                    .build();
            player.setVideoSurfaceView(surface);
            player.setVolume(muted ? 0f : 1f);
            player.addListener(new Listener(generation));
            player.setMediaItem(MediaItem.fromUri(url), Math.max(0, startMs));
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
        public void onPlayerError(PlaybackException error) {
            if (mine != gen) {
                return;
            }
            send("error", error.getErrorCodeName() + (error.getMessage() != null ? ": " + error.getMessage() : ""));
        }
    }
}
