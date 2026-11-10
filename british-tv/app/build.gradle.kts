plugins {
    id("com.android.application")
}

android {
    namespace = "app.britishtv"
    compileSdk = 34

    defaultConfig {
        applicationId = "app.britishtv"
        minSdk = 22
        targetSdk = 34
        versionCode = 2201
        versionName = "0.22.1"
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
