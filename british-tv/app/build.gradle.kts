plugins {
    id("com.android.application")
}

android {
    namespace = "app.britishtv"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.britishtv"
        minSdk = 22
        targetSdk = 34
        versionCode = 4594
        versionName = "0.45.94"
    }

    // A fixed key, so every build is signed the same and installs over the last one
    // (GitHub makes a brand-new debug key each run, which blocks updates).
    signingConfigs {
        getByName("debug") {
            storeFile = file("telly-debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // The backup player (NativePlayer.java): Media3's ExoPlayer, plus Jellyfin's build of the FFmpeg audio decoders
    // (AC3, E-AC3, DTS, TrueHD ...) that the web view's player lacks. The decoders are GPL-3.0: see the licence note
    // in the README. Keep the two on matching Media3 versions.
    implementation("androidx.media3:media3-exoplayer:1.5.0")
    implementation("org.jellyfin.media3:media3-ffmpeg-decoder:1.5.0+1")
}
