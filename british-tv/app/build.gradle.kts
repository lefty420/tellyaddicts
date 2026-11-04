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
        versionCode = 1
        versionName = "1.0"
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
