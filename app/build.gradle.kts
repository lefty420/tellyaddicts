plugins {
    id("com.android.application")
}

android {
    namespace = "tv.spelunkr.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "tv.spelunkr.app"
        minSdk = 22
        targetSdk = 34
        // The site reads this through the SpelunkrApp bridge and the user-agent suffix.
        versionCode = 4
        versionName = "1.3"
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
