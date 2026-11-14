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
        versionCode = 4619
        versionName = "0.46.19"
    }

    // Two builds from the one codebase: "tv" (the TV app, exactly as before) and "mobile" (for phones). They have different
    // application ids, so they install side by side and keep separate data: nothing done on a phone can touch the TV app.
    // Both share everything in src/main; src/mobile holds anything that is only for phones.
    flavorDimensions += "device"
    productFlavors {
        create("tv") {
            dimension = "device"
        }
        create("mobile") {
            dimension = "device"
            applicationIdSuffix = ".mobile"
        }
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

// The Telly Addict Builder (in the scraper repo) builds with `assembleDebug` and picks the TV APK up from
// build/outputs/apk/debug/app-debug.apk. Splitting into tv and mobile moved the files, so the TV one is copied back there.
afterEvaluate {
    tasks.named("assembleDebug") {
        doLast {
            val built = layout.buildDirectory.file("outputs/apk/tv/debug/app-tv-debug.apk").get().asFile
            val legacy = layout.buildDirectory.file("outputs/apk/debug/app-debug.apk").get().asFile
            if (built.exists()) {
                legacy.parentFile.mkdirs()
                built.copyTo(legacy, overwrite = true)
            }
        }
    }
}
